import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render's self-signed certs
  }
});

pool.on('connect', () => {
  console.log('Database client connected');
});

export default pool;
