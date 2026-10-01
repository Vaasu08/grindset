import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://postgres:e18vPz3EAAlQ4FXK@db.khxamctqbmyowpbyzxos.supabase.co:5432/postgres';

const pool = new pg.Pool({
  connectionString,
});

async function runSQL() {
  const sqlPath = path.join(__dirname, '..', 'init_db.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected. Running SQL script...');
    
    // Execute the SQL file
    await client.query(sql);
    console.log('SQL script executed successfully!');
    
    client.release();
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await pool.end();
  }
}

runSQL();
