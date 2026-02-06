const { db } = require('../models/database');
const geocodingService = require('../services/geocodingService');

// Get all circuit plants with optional filters
exports.getAllPlants = (req, res) => {
  try {
    const { city, state, circuit, inspector_id, active } = req.query;
    
    let query = `
      SELECT 
        cp.*,
        cp.est_name as name,
        u.email as inspector_email,
        p.first_name as inspector_first_name,
        p.last_name as inspector_last_name,
        (p.first_name || ' ' || p.last_name) as assigned_inspector_name
      FROM circuit_plants cp
      LEFT JOIN users u ON cp.assigned_inspector_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (state) {
      query += ` AND cp.state = ?`;
      params.push(state);
    }
    
    if (city) {
      query += ` AND cp.city = ?`;
      params.push(city);
    }
    
    if (circuit) {
      query += ` AND cp.circuit = ?`;
      params.push(circuit);
    }
    
    if (inspector_id) {
      query += ` AND cp.assigned_inspector_id = ?`;
      params.push(parseInt(inspector_id));
    }
    
    if (active !== undefined) {
      query += ` AND cp.is_active = ?`;
      params.push(active === 'true' ? 1 : 0);
    }
    
    query += ` ORDER BY cp.state, cp.city, cp.est_name`;
    
    const plants = db.prepare(query).all(...params);
    res.json(plants);
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
};

// Get unique cities with plant counts
exports.getCities = (req, res) => {
  try {
    const { state, circuit } = req.query;
    
    let query = `
      SELECT 
        city,
        COUNT(*) as plant_count
      FROM circuit_plants
      WHERE is_active = 1
    `;
    
    const params = [];
    
    if (state) {
      query += ` AND state = ?`;
      params.push(state);
    }
    
    if (circuit) {
      query += ` AND circuit = ?`;
      params.push(circuit);
    }
    
    query += ` GROUP BY city ORDER BY city`;
    
    const cities = db.prepare(query).all(...params);
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
};

// Get unique states with plant counts
exports.getStates = (req, res) => {
  try {
    const states = db.prepare(`
      SELECT 
        state,
        COUNT(*) as plant_count
      FROM circuit_plants
      WHERE is_active = 1
      GROUP BY state
      ORDER BY state
    `).all();
    
    res.json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
};

// Get unique circuits with plant counts
exports.getCircuits = (req, res) => {
  try {
    const { state } = req.query;
    
    let query = `
      SELECT 
        circuit,
        COUNT(*) as plant_count
      FROM circuit_plants
      WHERE is_active = 1
    `;
    
    const params = [];
    
    if (state) {
      query += ` AND state = ?`;
      params.push(state);
    }
    
    query += ` GROUP BY circuit ORDER BY circuit`;
    
    const circuits = db.prepare(query).all(...params);
    res.json(circuits);
  } catch (error) {
    console.error('Error fetching circuits:', error);
    res.status(500).json({ error: 'Failed to fetch circuits' });
  }
};

// Get single plant by ID
exports.getPlantById = (req, res) => {
  try {
    const plant = db.prepare(`
      SELECT 
        cp.*,
        u.email as inspector_email,
        p.first_name as inspector_first_name,
        p.last_name as inspector_last_name
      FROM circuit_plants cp
      LEFT JOIN users u ON cp.assigned_inspector_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE cp.id = ?
    `).get(req.params.id);
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json(plant);
  } catch (error) {
    console.error('Error fetching plant:', error);
    res.status(500).json({ error: 'Failed to fetch plant' });
  }
};

// Create new plant
exports.createPlant = async (req, res) => {
  try {
    const {
      est_number,
      est_name,
      address,
      city,
      state = 'NJ',
      zip_code,
      circuit,
      shift,
      tour_of_duty,
      assigned_inspector_id,
      notes
    } = req.body;
    
    // Validation
    if (!est_number || !est_name || !address || !city) {
      return res.status(400).json({ 
        error: 'Missing required fields: est_number, est_name, address, city' 
      });
    }
    
    // Check for duplicate est_number
    const existing = db.prepare('SELECT id FROM circuit_plants WHERE est_number = ?').get(est_number);
    if (existing) {
      return res.status(409).json({ error: 'Plant with this est_number already exists' });
    }
    
    // Geocode address
    let latitude = null;
    let longitude = null;
    
    const geocoded = await geocodingService.geocodeAddress(address, city, state, zip_code);
    if (geocoded) {
      latitude = geocoded.latitude;
      longitude = geocoded.longitude;
    }
    
    // Insert plant
    const result = db.prepare(`
      INSERT INTO circuit_plants (
        est_number, est_name, address, city, state, zip_code,
        latitude, longitude, circuit, shift, tour_of_duty,
        assigned_inspector_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      est_number,
      est_name,
      address,
      city,
      state,
      zip_code,
      latitude,
      longitude,
      circuit,
      shift,
      tour_of_duty,
      assigned_inspector_id || null,
      notes || null
    );
    
    const plant = db.prepare('SELECT * FROM circuit_plants WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(plant);
  } catch (error) {
    console.error('Error creating plant:', error);
    res.status(500).json({ error: 'Failed to create plant' });
  }
};

// Update plant
exports.updatePlant = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      est_number,
      est_name,
      address,
      city,
      state,
      zip_code,
      circuit,
      shift,
      tour_of_duty,
      assigned_inspector_id,
      notes,
      is_active
    } = req.body;
    
    // Check if plant exists
    const existing = db.prepare('SELECT * FROM circuit_plants WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    // Check if address changed and re-geocode
    let latitude = existing.latitude;
    let longitude = existing.longitude;
    
    const addressChanged = address !== existing.address || 
                          city !== existing.city || 
                          state !== existing.state || 
                          zip_code !== existing.zip_code;
    
    if (addressChanged) {
      const geocoded = await geocodingService.geocodeAddress(
        address || existing.address,
        city || existing.city,
        state || existing.state,
        zip_code || existing.zip_code
      );
      
      if (geocoded) {
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      }
    }
    
    // Update plant
    db.prepare(`
      UPDATE circuit_plants SET
        est_number = COALESCE(?, est_number),
        est_name = COALESCE(?, est_name),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        zip_code = COALESCE(?, zip_code),
        latitude = ?,
        longitude = ?,
        circuit = COALESCE(?, circuit),
        shift = COALESCE(?, shift),
        tour_of_duty = COALESCE(?, tour_of_duty),
        assigned_inspector_id = ?,
        notes = ?,
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      est_number,
      est_name,
      address,
      city,
      state,
      zip_code,
      latitude,
      longitude,
      circuit,
      shift,
      tour_of_duty,
      assigned_inspector_id !== undefined ? assigned_inspector_id : existing.assigned_inspector_id,
      notes !== undefined ? notes : existing.notes,
      is_active,
      id
    );
    
    const updated = db.prepare('SELECT * FROM circuit_plants WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating plant:', error);
    res.status(500).json({ error: 'Failed to update plant' });
  }
};

// Delete plant
exports.deletePlant = (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = db.prepare('SELECT id FROM circuit_plants WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    db.prepare('DELETE FROM circuit_plants WHERE id = ?').run(id);
    
    res.json({ message: 'Plant deleted successfully' });
  } catch (error) {
    console.error('Error deleting plant:', error);
    res.status(500).json({ error: 'Failed to delete plant' });
  }
};

// Bulk import plants from CSV
exports.bulkImport = async (req, res) => {
  try {
    const { plants } = req.body;
    
    if (!Array.isArray(plants) || plants.length === 0) {
      return res.status(400).json({ error: 'Invalid input: expected array of plants' });
    }
    
    const results = {
      total: plants.length,
      success: 0,
      failed: 0,
      errors: []
    };
    
    // Geocode all addresses first
    console.log(`🗺️  Geocoding ${plants.length} addresses...`);
    const geocodedPlants = await geocodingService.bulkGeocode(plants.map(p => ({
      address: p.address,
      city: p.city,
      state: p.state || 'NJ',
      zipCode: p.zip_code,
      ...p
    })));
    
    // Insert plants
    for (const plant of geocodedPlants) {
      try {
        db.prepare(`
          INSERT OR REPLACE INTO circuit_plants (
            est_number, est_name, address, city, state, zip_code,
            latitude, longitude, circuit, shift, tour_of_duty,
            assigned_inspector_id, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          plant.est_number,
          plant.est_name,
          plant.address,
          plant.city,
          plant.state || 'NJ',
          plant.zip_code || null,
          plant.latitude || null,
          plant.longitude || null,
          plant.circuit || null,
          plant.shift || null,
          plant.tour_of_duty || null,
          plant.assigned_inspector_id || null,
          plant.notes || null
        );
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          est_number: plant.est_number,
          error: error.message
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error bulk importing plants:', error);
    res.status(500).json({ error: 'Failed to bulk import plants' });
  }
};
