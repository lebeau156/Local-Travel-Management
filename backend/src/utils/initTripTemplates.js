const { db } = require('../models/database');

/**
 * Initialize trip templates table
 */
function initTripTemplates() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trip_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      template_name TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      site_name TEXT,
      purpose TEXT,
      notes TEXT,
      is_favorite BOOLEAN DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create index for faster user lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_templates_user ON trip_templates(user_id)
  `);

  console.log('✅ Trip templates table created');
}

// Run initialization
try {
  initTripTemplates();
} catch (error) {
  console.error('Error initializing trip templates:', error);
}

module.exports = { initTripTemplates };
