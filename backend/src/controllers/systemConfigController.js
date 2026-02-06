const { db } = require('../models/database');

/**
 * Get all system configurations
 */
exports.getAllConfigs = (req, res) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT * FROM system_config';
    const params = [];
    
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY category, config_key';
    
    const configs = db.prepare(query).all(...params);

    // Group by category
    const grouped = configs.reduce((acc, config) => {
      const cat = config.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(config);
      return acc;
    }, {});

    res.json({
      configs: configs,
      grouped: grouped
    });
  } catch (error) {
    console.error('Error fetching configs:', error);
    res.status(500).json({ error: 'Failed to fetch configurations' });
  }
};

/**
 * Get single configuration
 */
exports.getConfig = (req, res) => {
  try {
    const { key } = req.params;

    const config = db.prepare('SELECT * FROM system_config WHERE config_key = ?').get(key);
    
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
};

/**
 * Update configuration
 */
exports.updateConfig = (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const existing = db.prepare('SELECT * FROM system_config WHERE config_key = ?').get(key);
    
    if (!existing) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    // Validate value based on type
    let validatedValue = value;
    
    if (existing.config_type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return res.status(400).json({ error: 'Value must be a number' });
      }
      validatedValue = num.toString();
    } else if (existing.config_type === 'boolean') {
      if (value !== 'true' && value !== 'false') {
        return res.status(400).json({ error: 'Value must be true or false' });
      }
      validatedValue = value;
    }

    // Update
    db.prepare(`
      UPDATE system_config 
      SET config_value = ?, description = COALESCE(?, description), updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE config_key = ?
    `).run(validatedValue, description, req.user.id, key);

    const updated = db.prepare('SELECT * FROM system_config WHERE config_key = ?').get(key);

    res.json({
      message: 'Configuration updated successfully',
      config: updated
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
};

/**
 * Create new configuration
 */
exports.createConfig = (req, res) => {
  try {
    const { key, value, type, description, category } = req.body;

    if (!key || !value || !type) {
      return res.status(400).json({ error: 'Key, value, and type are required' });
    }

    // Check if exists
    const existing = db.prepare('SELECT id FROM system_config WHERE config_key = ?').get(key);
    if (existing) {
      return res.status(409).json({ error: 'Configuration key already exists' });
    }

    const result = db.prepare(`
      INSERT INTO system_config (config_key, config_value, config_type, description, category, updated_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(key, value, type, description || null, category || 'general', req.user.id);

    const newConfig = db.prepare('SELECT * FROM system_config WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Configuration created successfully',
      config: newConfig
    });
  } catch (error) {
    console.error('Error creating config:', error);
    res.status(500).json({ error: 'Failed to create configuration' });
  }
};

/**
 * Delete configuration
 */
exports.deleteConfig = (req, res) => {
  try {
    const { key } = req.params;

    const config = db.prepare('SELECT * FROM system_config WHERE config_key = ?').get(key);
    
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    // Prevent deletion of critical configs
    const protectedKeys = [
      'fiscal_year_start_month',
      'default_mileage_rate',
      'system_name'
    ];

    if (protectedKeys.includes(key)) {
      return res.status(403).json({ error: 'Cannot delete protected configuration' });
    }

    db.prepare('DELETE FROM system_config WHERE config_key = ?').run(key);

    res.json({ message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting config:', error);
    res.status(500).json({ error: 'Failed to delete configuration' });
  }
};

/**
 * Get configuration categories
 */
exports.getCategories = (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM system_config
      GROUP BY category
      ORDER BY category
    `).all();

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

/**
 * Bulk update configurations
 */
exports.bulkUpdate = (req, res) => {
  try {
    const { configs } = req.body;

    if (!Array.isArray(configs) || configs.length === 0) {
      return res.status(400).json({ error: 'Configs array is required' });
    }

    const updated = [];
    const errors = [];

    const updateStmt = db.prepare(`
      UPDATE system_config 
      SET config_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE config_key = ?
    `);

    for (const { key, value } of configs) {
      try {
        const existing = db.prepare('SELECT config_type FROM system_config WHERE config_key = ?').get(key);
        
        if (!existing) {
          errors.push({ key, error: 'Configuration not found' });
          continue;
        }

        // Validate
        let validatedValue = value;
        if (existing.config_type === 'number') {
          const num = parseFloat(value);
          if (isNaN(num)) {
            errors.push({ key, error: 'Value must be a number' });
            continue;
          }
          validatedValue = num.toString();
        } else if (existing.config_type === 'boolean') {
          if (value !== 'true' && value !== 'false') {
            errors.push({ key, error: 'Value must be true or false' });
            continue;
          }
        }

        updateStmt.run(validatedValue, req.user.id, key);
        updated.push(key);
      } catch (error) {
        errors.push({ key, error: error.message });
      }
    }

    res.json({
      message: `Updated ${updated.length} configuration(s)`,
      updated: updated.length,
      errors: errors.length,
      details: errors
    });
  } catch (error) {
    console.error('Error bulk updating configs:', error);
    res.status(500).json({ error: 'Failed to bulk update configurations' });
  }
};

/**
 * Reset configuration to default
 */
exports.resetToDefault = (req, res) => {
  try {
    const { key } = req.params;

    // Default values map
    const defaults = {
      fiscal_year_start_month: '10',
      default_mileage_rate: '0.67',
      max_attachment_size_mb: '10',
      allowed_file_types: 'pdf,jpg,jpeg,png,gif,doc,docx,xls,xlsx',
      auto_approve_threshold: '0',
      require_supervisor_approval: 'true',
      enable_email_notifications: 'true',
      backup_retention_days: '30',
      system_name: 'USDA Travel Mileage System',
      support_email: 'support@usda.gov'
    };

    if (!defaults[key]) {
      return res.status(404).json({ error: 'No default value available for this configuration' });
    }

    db.prepare(`
      UPDATE system_config 
      SET config_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE config_key = ?
    `).run(defaults[key], req.user.id, key);

    const updated = db.prepare('SELECT * FROM system_config WHERE config_key = ?').get(key);

    res.json({
      message: 'Configuration reset to default',
      config: updated
    });
  } catch (error) {
    console.error('Error resetting config:', error);
    res.status(500).json({ error: 'Failed to reset configuration' });
  }
};
