import { run, get, all, initDatabase } from './database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  await initDatabase();
  
  await run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const executedMigrations = await all('SELECT name FROM migrations');
  const executedNames = new Set(executedMigrations.map((m: any) => m.name));

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('📁 No migrations directory found');
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (executedNames.has(file)) {
      console.log(`✓ Already executed: ${file}`);
      continue;
    }

    console.log(`⏳ Executing: ${file}`);
    
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    try {
      await run(sql);
      await run('INSERT INTO migrations (name) VALUES ($1)', [file]);
      console.log(`✅ Completed: ${file}`);
    } catch (error) {
      console.error(`❌ Failed: ${file}`);
      console.error(error);
      throw error;
    }
  }

  console.log('🎉 All migrations completed');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
