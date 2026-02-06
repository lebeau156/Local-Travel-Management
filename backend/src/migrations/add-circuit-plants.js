const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

console.log('Adding circuit_plants table...');

try {
  // Create table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS circuit_plants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      est_number TEXT NOT NULL UNIQUE,
      est_name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT DEFAULT 'NJ',
      zip_code TEXT,
      latitude REAL,
      longitude REAL,
      circuit TEXT,
      shift INTEGER,
      tour_of_duty TEXT,
      assigned_inspector_id INTEGER,
      notes TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_inspector_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `).run();

  console.log('✅ Circuit plants table created');

  // Verify table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='circuit_plants'").all();
  if (tables.length === 0) {
    throw new Error('Table was not created');
  }

  console.log('Creating indexes...');

  // Create indexes separately
  try {
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_circuit_plants_city ON circuit_plants(city)`).run();
    console.log('  ✓ City index created');
  } catch (e) {
    console.log('  - City index already exists or error:', e.message);
  }

  try {
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_circuit_plants_circuit ON circuit_plants(circuit)`).run();
    console.log('  ✓ Circuit index created');
  } catch (e) {
    console.log('  - Circuit index already exists or error:', e.message);
  }

  try {
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_circuit_plants_inspector ON circuit_plants(assigned_inspector_id)`).run();
    console.log('  ✓ Inspector index created');
  } catch (e) {
    console.log('  - Inspector index already exists or error:', e.message);
  }

  try {
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_circuit_plants_active ON circuit_plants(is_active)`).run();
    console.log('  ✓ Active index created');
  } catch (e) {
    console.log('  - Active index already exists or error:', e.message);
  }

  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error);
} finally {
  db.close();
}
