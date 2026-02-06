const { db } = require('../models/database');

/**
 * Get all templates for current user
 */
exports.getAllTemplates = (req, res) => {
  try {
    const templates = db.prepare(`
      SELECT * FROM trip_templates 
      WHERE user_id = ?
      ORDER BY is_favorite DESC, usage_count DESC, template_name ASC
    `).all(req.user.id);

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

/**
 * Create new template
 */
exports.createTemplate = (req, res) => {
  try {
    const { template_name, from_address, to_address, site_name, purpose, notes } = req.body;

    if (!template_name || !from_address || !to_address) {
      return res.status(400).json({ error: 'Template name, from address, and to address are required' });
    }

    const result = db.prepare(`
      INSERT INTO trip_templates (
        user_id, template_name, from_address, to_address, 
        site_name, purpose, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      template_name,
      from_address,
      to_address,
      site_name || null,
      purpose || null,
      notes || null
    );

    const template = db.prepare('SELECT * FROM trip_templates WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

/**
 * Update template
 */
exports.updateTemplate = (req, res) => {
  try {
    const { id } = req.params;
    const { template_name, from_address, to_address, site_name, purpose, notes, is_favorite } = req.body;

    // Check ownership
    const template = db.prepare('SELECT * FROM trip_templates WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    db.prepare(`
      UPDATE trip_templates 
      SET template_name = ?,
          from_address = ?,
          to_address = ?,
          site_name = ?,
          purpose = ?,
          notes = ?,
          is_favorite = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      template_name,
      from_address,
      to_address,
      site_name || null,
      purpose || null,
      notes || null,
      is_favorite !== undefined ? is_favorite : template.is_favorite,
      id
    );

    const updated = db.prepare('SELECT * FROM trip_templates WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

/**
 * Delete template
 */
exports.deleteTemplate = (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const template = db.prepare('SELECT * FROM trip_templates WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    db.prepare('DELETE FROM trip_templates WHERE id = ?').run(id);
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

/**
 * Increment usage count
 */
exports.incrementUsage = (req, res) => {
  try {
    const { id } = req.params;

    db.prepare('UPDATE trip_templates SET usage_count = usage_count + 1 WHERE id = ?').run(id);
    
    const template = db.prepare('SELECT * FROM trip_templates WHERE id = ?').get(id);
    res.json(template);
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

/**
 * Toggle favorite
 */
exports.toggleFavorite = (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const template = db.prepare('SELECT * FROM trip_templates WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    db.prepare('UPDATE trip_templates SET is_favorite = NOT is_favorite WHERE id = ?').run(id);
    
    const updated = db.prepare('SELECT * FROM trip_templates WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};
