const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
const db = new Database(dbPath);

console.log('Creating assignment_requests table...');

// Create assignment_requests table
db.exec(`
  CREATE TABLE IF NOT EXISTS assignment_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inspector_id INTEGER NOT NULL,
    requesting_supervisor_id INTEGER NOT NULL,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    processed_at DATETIME,
    processed_by INTEGER,
    notes TEXT,
    FOREIGN KEY (inspector_id) REFERENCES users(id),
    FOREIGN KEY (requesting_supervisor_id) REFERENCES users(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
  )
`);

console.log('✅ assignment_requests table created successfully');

// Create index for faster queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_assignment_requests_status 
  ON assignment_requests(status)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_assignment_requests_inspector 
  ON assignment_requests(inspector_id)
`);

console.log('✅ Indexes created successfully');

db.close();
console.log('Migration complete!');
