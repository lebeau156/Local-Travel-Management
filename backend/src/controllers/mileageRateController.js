const { db } = require('../models/database');

/**
 * Get all mileage rates (including historical)
 */
exports.getAllRates = (req, res) => {
  try {
    const rates = db.prepare(`
      SELECT 
        mr.*,
        u.email as created_by_email
      FROM mileage_rates mr
      LEFT JOIN users u ON mr.created_by = u.id
      ORDER BY mr.effective_from DESC
    `).all();

    res.json(rates);
  } catch (error) {
    console.error('Error fetching mileage rates:', error);
    res.status(500).json({ error: 'Failed to fetch mileage rates' });
  }
};

/**
 * Get current active mileage rate
 */
exports.getCurrentRate = (req, res) => {
  try {
    const { date } = req.query;
    const effectiveDate = date || new Date().toISOString().split('T')[0];

    const rate = db.prepare(`
      SELECT * FROM mileage_rates
      WHERE effective_from <= ?
        AND (effective_to IS NULL OR effective_to >= ?)
      ORDER BY effective_from DESC
      LIMIT 1
    `).get(effectiveDate, effectiveDate);

    if (!rate) {
      return res.status(404).json({ error: 'No active mileage rate found' });
    }

    res.json(rate);
  } catch (error) {
    console.error('Error fetching current rate:', error);
    res.status(500).json({ error: 'Failed to fetch current rate' });
  }
};

/**
 * Create new mileage rate
 */
exports.createRate = (req, res) => {
  try {
    const { rate, effectiveFrom, effectiveTo, notes } = req.body;

    if (!rate || !effectiveFrom) {
      return res.status(400).json({ error: 'Rate and effective date are required' });
    }

    if (rate <= 0 || rate > 10) {
      return res.status(400).json({ error: 'Rate must be between 0 and 10' });
    }

    // Check for overlapping rates
    const overlap = db.prepare(`
      SELECT id FROM mileage_rates
      WHERE (
        (effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?))
        OR
        (effective_from <= ? AND (effective_to IS NULL OR effective_to >= ?))
        OR
        (effective_from >= ? AND effective_from <= ?)
      )
    `).get(
      effectiveFrom, effectiveFrom,
      effectiveTo || '9999-12-31', effectiveTo || '9999-12-31',
      effectiveFrom, effectiveTo || '9999-12-31'
    );

    if (overlap) {
      return res.status(409).json({ 
        error: 'Date range overlaps with existing rate. Please adjust dates or end the existing rate first.' 
      });
    }

    const result = db.prepare(`
      INSERT INTO mileage_rates (rate, effective_from, effective_to, created_by, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(rate, effectiveFrom, effectiveTo || null, req.user.id, notes || null);

    const newRate = db.prepare('SELECT * FROM mileage_rates WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Mileage rate created successfully',
      rate: newRate
    });
  } catch (error) {
    console.error('Error creating mileage rate:', error);
    res.status(500).json({ error: 'Failed to create mileage rate' });
  }
};

/**
 * Update mileage rate
 */
exports.updateRate = (req, res) => {
  try {
    const { id } = req.params;
    const { rate, effectiveFrom, effectiveTo, notes } = req.body;

    const existing = db.prepare('SELECT * FROM mileage_rates WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Mileage rate not found' });
    }

    if (rate && (rate <= 0 || rate > 10)) {
      return res.status(400).json({ error: 'Rate must be between 0 and 10' });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];

    if (rate !== undefined) {
      updates.push('rate = ?');
      params.push(rate);
    }
    if (effectiveFrom !== undefined) {
      updates.push('effective_from = ?');
      params.push(effectiveFrom);
    }
    if (effectiveTo !== undefined) {
      updates.push('effective_to = ?');
      params.push(effectiveTo);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    db.prepare(`
      UPDATE mileage_rates 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);

    const updated = db.prepare('SELECT * FROM mileage_rates WHERE id = ?').get(id);

    res.json({
      message: 'Mileage rate updated successfully',
      rate: updated
    });
  } catch (error) {
    console.error('Error updating mileage rate:', error);
    res.status(500).json({ error: 'Failed to update mileage rate' });
  }
};

/**
 * Delete mileage rate
 */
exports.deleteRate = (req, res) => {
  try {
    const { id } = req.params;

    const rate = db.prepare('SELECT * FROM mileage_rates WHERE id = ?').get(id);
    if (!rate) {
      return res.status(404).json({ error: 'Mileage rate not found' });
    }

    // Check if rate is being used by any trips
    const tripsUsingRate = db.prepare(`
      SELECT COUNT(*) as count FROM trips
      WHERE date >= ? AND (? IS NULL OR date <= ?)
    `).get(rate.effective_from, rate.effective_to, rate.effective_to);

    if (tripsUsingRate.count > 0) {
      return res.status(409).json({ 
        error: `Cannot delete rate - it is being used by ${tripsUsingRate.count} trip(s)`,
        tripCount: tripsUsingRate.count
      });
    }

    db.prepare('DELETE FROM mileage_rates WHERE id = ?').run(id);

    res.json({ message: 'Mileage rate deleted successfully' });
  } catch (error) {
    console.error('Error deleting mileage rate:', error);
    res.status(500).json({ error: 'Failed to delete mileage rate' });
  }
};

/**
 * Get rate for specific trip date
 */
exports.getRateForDate = (req, res) => {
  try {
    const { date } = req.params;

    const rate = db.prepare(`
      SELECT rate FROM mileage_rates
      WHERE effective_from <= ?
        AND (effective_to IS NULL OR effective_to >= ?)
      ORDER BY effective_from DESC
      LIMIT 1
    `).get(date, date);

    if (!rate) {
      // Fallback to default
      return res.json({ rate: 0.67 });
    }

    res.json(rate);
  } catch (error) {
    console.error('Error fetching rate for date:', error);
    res.status(500).json({ error: 'Failed to fetch rate' });
  }
};
