import { readdirSync } from 'fs';
import { resolve } from 'path';
import { query } from './config/database';

(async () => {
  try {
    // Create a table to track executed migrations
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationFiles = readdirSync(resolve(__dirname, './migrations'))
      .filter(file => file.endsWith('.ts'))
      .sort();

    for (const file of migrationFiles) {
      const { rows } = await query('SELECT id FROM migrations WHERE name = $1', [file]);
      if (rows.length === 0) {
        console.log(`Running migration: ${file}`);
        const migration = await import(`./migrations/${file}`);
        await migration.up();
        await query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        console.log(`Migration ${file} completed.`);
      } else {
        console.log(`Migration ${file} already applied.`);
      }
    }
    console.log('All migrations processed.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // It's good practice to close the pool if this script is run standalone.
    // For now, we'll let it exit, as 'pg' client will manage itself.
  }
})();
