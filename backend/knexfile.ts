import type { Knex } from "knex";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: "./src/db/migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./src/db/seeds",
      extension: "ts",
    },
  },
};

module.exports = config;
