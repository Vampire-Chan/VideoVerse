import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.string('github_id').unique().nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('github_id');
  });
}

