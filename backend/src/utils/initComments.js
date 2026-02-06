const db = require('../models/database').db;

function initComments() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      parent_id INTEGER,
      comment_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_comments_entity 
    ON comments(entity_type, entity_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_comments_parent 
    ON comments(parent_id)
  `);

  console.log('✅ Comments table created');
}

if (require.main === module) {
  initComments();
}

module.exports = { initComments };
