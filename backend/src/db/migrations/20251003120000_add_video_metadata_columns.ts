import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('videos', (table) => {
    table.integer('width').nullable();
    table.integer('height').nullable();
    table.string('format', 20).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('videos', (table) => {
    table.dropColumn('width');
    table.dropColumn('height');
    table.dropColumn('format');
  });
}
