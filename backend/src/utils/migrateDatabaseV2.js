const { db } = require('../models/database');

/**
 * Add new tables for mileage rates, file attachments, and system config
 */
function migrateDatabase() {
  console.log('🔄 Running database migrations...');

  try {
    // 1. Mileage Rates Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS mileage_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rate REAL NOT NULL,
        effective_from DATE NOT NULL,
        effective_to DATE,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✅ Mileage rates table created');

    // Insert default rate if table is empty
    const rateCount = db.prepare('SELECT COUNT(*) as count FROM mileage_rates').get();
    if (rateCount.count === 0) {
      db.prepare(`
        INSERT INTO mileage_rates (rate, effective_from, created_by, notes)
        VALUES (0.67, '2024-01-01', 1, 'Default IRS mileage rate')
      `).run();
      console.log('✅ Default mileage rate inserted');
    }

    // 2. File Attachments Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        uploaded_by INTEGER NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        description TEXT,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);
    console.log('✅ Attachments table created');

    // Create index for faster lookups
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_attachments_entity 
      ON attachments(entity_type, entity_id)
    `);

    // 3. System Configuration Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS system_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_key TEXT UNIQUE NOT NULL,
        config_value TEXT NOT NULL,
        config_type TEXT NOT NULL,
        description TEXT,
        category TEXT,
        updated_by INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `);
    console.log('✅ System config table created');

    // Insert default configurations
    const configCount = db.prepare('SELECT COUNT(*) as count FROM system_config').get();
    if (configCount.count === 0) {
      const defaultConfigs = [
        { key: 'fiscal_year_start_month', value: '10', type: 'number', desc: 'Fiscal year start month (1-12)', category: 'fiscal' },
        { key: 'default_mileage_rate', value: '0.67', type: 'number', desc: 'Default mileage reimbursement rate', category: 'rates' },
        { key: 'max_attachment_size_mb', value: '10', type: 'number', desc: 'Maximum file attachment size in MB', category: 'files' },
        { key: 'allowed_file_types', value: 'pdf,jpg,jpeg,png,gif,doc,docx,xls,xlsx', type: 'string', desc: 'Allowed file extensions', category: 'files' },
        { key: 'auto_approve_threshold', value: '0', type: 'number', desc: 'Auto-approve vouchers under this amount (0=disabled)', category: 'approval' },
        { key: 'require_supervisor_approval', value: 'true', type: 'boolean', desc: 'Require supervisor approval before fleet manager', category: 'approval' },
        { key: 'enable_email_notifications', value: 'true', type: 'boolean', desc: 'Enable email notifications system-wide', category: 'notifications' },
        { key: 'backup_retention_days', value: '30', type: 'number', desc: 'Number of days to keep backup files', category: 'backup' },
        { key: 'system_name', value: 'USDA Travel Mileage System', type: 'string', desc: 'System display name', category: 'general' },
        { key: 'support_email', value: 'support@usda.gov', type: 'string', desc: 'Support contact email', category: 'general' }
      ];

      const insertConfig = db.prepare(`
        INSERT INTO system_config (config_key, config_value, config_type, description, category)
        VALUES (?, ?, ?, ?, ?)
      `);

      defaultConfigs.forEach(cfg => {
        insertConfig.run(cfg.key, cfg.value, cfg.type, cfg.desc, cfg.category);
      });
      console.log('✅ Default system configurations inserted');
    }

    // 4. Add indexes for performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
      CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
      CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
      CREATE INDEX IF NOT EXISTS idx_vouchers_user ON vouchers(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(created_at);
    `);
    console.log('✅ Performance indexes created');

    console.log('🎉 Database migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

module.exports = { migrateDatabase };
