const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new Database(dbPath);

try {
  db.exec(`
    DROP TABLE IF EXISTS circuit_plants;
    
    CREATE TABLE circuit_plants (
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX idx_circuit_plants_city ON circuit_plants(city);
    CREATE INDEX idx_circuit_plants_circuit ON circuit_plants(circuit);
    CREATE INDEX idx_circuit_plants_inspector ON circuit_plants(assigned_inspector_id);
    CREATE INDEX idx_circuit_plants_active ON circuit_plants(is_active);
  `);
  
  console.log('✅ Circuit plants table created successfully!');
  
  const cols = db.prepare('PRAGMA table_info(circuit_plants)').all();
  console.log('Columns:', cols.map(c => c.name).join(', '));
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}
