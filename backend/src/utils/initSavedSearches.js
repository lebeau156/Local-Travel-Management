const db = require('../models/database').db;

function initSavedSearches() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      search_name TEXT NOT NULL,
      filters TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_saved_searches_user 
    ON saved_searches(user_id)
  `);

  console.log('✅ Saved searches table created');
}

if (require.main === module) {
  initSavedSearches();
}

module.exports = { initSavedSearches };
