const { db } = require('../models/database');
const { calculateMileage } = require('../utils/mileageCalculator');
const { logActivity, getClientIp, ACTIONS } = require('../utils/auditLogger');

// Get all trips for user
exports.getTrips = (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    let query = 'SELECT * FROM trips WHERE user_id = ?';
    const params = [req.user.id];

    if (month && year) {
      query += ` AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`;
      params.push(month.toString().padStart(2, '0'), year.toString());
    } else if (startDate && endDate) {
      query += ` AND date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ' ORDER BY date DESC';

    const trips = db.prepare(query).all(...params);
    res.json(trips);
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Failed to get trips' });
  }
};

// Get single trip
exports.getTrip = (req, res) => {
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Failed to get trip' });
  }
};

// Create trip
exports.createTrip = async (req, res) => {
  try {
    console.log('📝 Creating trip with data:', req.body);
    
    const {
      date, from_address, to_address, site_name, purpose,
      departure_time, return_time, notes,
      lodging_cost, meals_cost, per_diem_days, other_expenses, expense_notes,
      avoid_tolls
    } = req.body;

    console.log('💰 Expense fields:', { lodging_cost, meals_cost, per_diem_days, other_expenses, expense_notes });
    console.log('🚗 Toll preference:', { avoid_tolls });

    if (!date || !from_address || !to_address) {
      return res.status(400).json({ error: 'Date, from_address, and to_address required' });
    }

    // Calculate mileage with toll preference
    const mileageData = await calculateMileage(from_address, to_address, avoid_tolls);

    const result = db.prepare(`
      INSERT INTO trips (
        user_id, date, from_address, to_address, site_name, purpose,
        miles_calculated, route_data, departure_time, return_time, notes,
        lodging_cost, meals_cost, per_diem_days, other_expenses, expense_notes,
        avoid_tolls
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id, date, from_address, to_address, site_name, purpose,
      mileageData.miles, JSON.stringify(mileageData.route),
      departure_time, return_time, notes,
      lodging_cost || 0, meals_cost || 0, per_diem_days || 0, other_expenses || 0, expense_notes || null,
      avoid_tolls ? 1 : 0
    );

    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(result.lastInsertRowid);

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.CREATE_TRIP,
      entityType: 'trip',
      entityId: trip.id,
      details: { from: from_address, to: to_address, miles: mileageData.miles },
      ipAddress: getClientIp(req)
    });

    res.status(201).json({
      message: 'Trip created',
      trip,
      mileageInfo: mileageData.usedMock ? 'Mock mileage (no API key)' : 'Calculated via Google Maps'
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
};

// Update trip
exports.updateTrip = async (req, res) => {
  try {
    const {
      date, from_address, to_address, site_name, purpose,
      departure_time, return_time, notes,
      lodging_cost, meals_cost, per_diem_days, other_expenses, expense_notes,
      avoid_tolls
    } = req.body;

    const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    let miles_calculated = trip.miles_calculated;
    let route_data = trip.route_data;

    // Recalculate mileage if addresses or toll preference changed
    const tollPreferenceChanged = avoid_tolls !== undefined && avoid_tolls !== Boolean(trip.avoid_tolls);
    if ((from_address && from_address !== trip.from_address) ||
        (to_address && to_address !== trip.to_address) ||
        tollPreferenceChanged) {
      const mileageData = await calculateMileage(
        from_address || trip.from_address,
        to_address || trip.to_address,
        avoid_tolls !== undefined ? avoid_tolls : Boolean(trip.avoid_tolls)
      );
      miles_calculated = mileageData.miles;
      route_data = JSON.stringify(mileageData.route);
    }

    db.prepare(`
      UPDATE trips SET
        date = COALESCE(?, date),
        from_address = COALESCE(?, from_address),
        to_address = COALESCE(?, to_address),
        site_name = COALESCE(?, site_name),
        purpose = COALESCE(?, purpose),
        miles_calculated = ?,
        route_data = ?,
        departure_time = COALESCE(?, departure_time),
        return_time = COALESCE(?, return_time),
        notes = COALESCE(?, notes),
        lodging_cost = ?,
        meals_cost = ?,
        per_diem_days = ?,
        other_expenses = ?,
        expense_notes = COALESCE(?, expense_notes),
        avoid_tolls = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      date, from_address, to_address, site_name, purpose,
      miles_calculated, route_data,
      departure_time, return_time, notes,
      lodging_cost !== undefined ? lodging_cost : trip.lodging_cost,
      meals_cost !== undefined ? meals_cost : trip.meals_cost,
      per_diem_days !== undefined ? per_diem_days : trip.per_diem_days,
      other_expenses !== undefined ? other_expenses : trip.other_expenses,
      expense_notes,
      avoid_tolls !== undefined ? (avoid_tolls ? 1 : 0) : trip.avoid_tolls,
      req.params.id, req.user.id
    );

    const updatedTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
    
    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.UPDATE_TRIP,
      entityType: 'trip',
      entityId: updatedTrip.id,
      details: { 
        from: updatedTrip.from_address, 
        to: updatedTrip.to_address, 
        miles: updatedTrip.miles_calculated 
      },
      ipAddress: getClientIp(req)
    });

    res.json({ message: 'Trip updated', trip: updatedTrip });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
};

// Delete trip
exports.deleteTrip = (req, res) => {
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const result = db.prepare('DELETE FROM trips WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.DELETE_TRIP,
      entityType: 'trip',
      entityId: req.params.id,
      details: { 
        from: trip.from_address, 
        to: trip.to_address, 
        miles: trip.miles_calculated 
      },
      ipAddress: getClientIp(req)
    });

    res.json({ message: 'Trip deleted' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
};

// Calculate mileage (utility endpoint)
exports.calculateMileageEndpoint = async (req, res) => {
  try {
    const { from, to, avoidTolls } = req.body;

    if (!from || !to) {
      return res.status(400).json({ error: 'From and to addresses required' });
    }

    const mileageData = await calculateMileage(from, to, avoidTolls);
    res.json(mileageData);
  } catch (error) {
    console.error('Calculate mileage error:', error);
    res.status(500).json({ error: 'Failed to calculate mileage' });
  }
};
