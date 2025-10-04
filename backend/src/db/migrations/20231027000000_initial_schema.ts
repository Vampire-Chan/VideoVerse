import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('username', 50).unique().notNullable();
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('avatar_url', 255).nullable().defaultTo(null);
    table.string('banner_url', 255).nullable().defaultTo(null);
    table.text('description').nullable().defaultTo(null);
    table.jsonb('links').nullable().defaultTo('[]' as any);
    table.boolean('is_creator').defaultTo(false);
    table.string('display_name', 50).nullable().defaultTo(null);
    table.string('gender', 20).nullable().defaultTo(null);
    table.date('dob').nullable().defaultTo(null);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('videos', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table.string('video_url', 255).notNullable();
    table.string('thumbnail_url', 255).nullable();
    table.integer('file_size').nullable();
    table.integer('duration').nullable();
    table.string('visibility', 50).defaultTo('Public');
    table.string('restrictions', 50).defaultTo('None');
    table.integer('views').defaultTo(0);
    table.string('category', 50).defaultTo('All');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('video_reactions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('video_id').notNullable().references('id').inTable('videos').onDelete('CASCADE');
    table.string('type', 20).notNullable(); // 'like' or 'dislike'
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['user_id', 'video_id']);
  });

  await knex.schema.createTable('comments', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('video_id').notNullable().references('id').inTable('videos').onDelete('CASCADE');
    table.integer('parent_id').nullable().references('id').inTable('comments').onDelete('CASCADE'); // For nested comments
    table.text('text').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('watchers', (table) => {
    table.integer('watcher_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('watched_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.primary(['watcher_id', 'watched_id']);
  });

  await knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('sender_id').nullable().references('id').inTable('users').onDelete('SET NULL'); // Who triggered the notification (e.g., commenter, uploader)
    table.string('type', 50).notNullable(); // e.g., 'NEW_VIDEO', 'NEW_COMMENT', 'NEW_LIKE', 'NEW_SUBSCRIBER'
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.integer('related_entity_id').nullable(); // ID of the video, comment, etc. that the notification is about
    table.string('related_entity_type', 50).nullable(); // e.g., 'video', 'comment', 'user'
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('watchers');
  await knex.schema.dropTableIfExists('comments');
  await knex.schema.dropTableIfExists('video_reactions');
  await knex.schema.dropTableIfExists('videos');
  await knex.schema.dropTableIfExists('users');
}
