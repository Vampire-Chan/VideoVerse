import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.string('password_hash', 255).nullable().alter();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.string('password_hash', 255).notNullable().alter();
  });
}

