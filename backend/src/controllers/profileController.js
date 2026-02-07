const { db } = require('../models/database');

// Get or create profile
exports.getProfile = (req, res) => {
  try {
    let profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    
    if (!profile) {
      const result = db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(req.user.id);
      profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(result.lastInsertRowid);
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update profile
exports.updateProfile = (req, res) => {
  try {
    const {
      first_name, last_name, middle_initial, phone, home_address,
      duty_station, employee_id, travel_auth_no, agency, office, position,
      vehicle_make, vehicle_model, vehicle_year, vehicle_license,
      mileage_rate, per_diem_rate, account_number,
      signature_data, signature_type, fls_supervisor_id
    } = req.body;

    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.user.id);
    
    if (!profile) {
      db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(req.user.id);
    }

    // Update profiles table (without fls_supervisor_id)
    db.prepare(`
      UPDATE profiles SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        middle_initial = COALESCE(?, middle_initial),
        phone = COALESCE(?, phone),
        home_address = COALESCE(?, home_address),
        duty_station = COALESCE(?, duty_station),
        employee_id = COALESCE(?, employee_id),
        travel_auth_no = COALESCE(?, travel_auth_no),
        agency = COALESCE(?, agency),
        office = COALESCE(?, office),
        position = COALESCE(?, position),
        vehicle_make = COALESCE(?, vehicle_make),
        vehicle_model = COALESCE(?, vehicle_model),
        vehicle_year = COALESCE(?, vehicle_year),
        vehicle_license = COALESCE(?, vehicle_license),
        mileage_rate = COALESCE(?, mileage_rate),
        per_diem_rate = COALESCE(?, per_diem_rate),
        account_number = COALESCE(?, account_number),
        signature_data = COALESCE(?, signature_data),
        signature_type = COALESCE(?, signature_type)
      WHERE user_id = ?
    `).run(
      first_name, last_name, middle_initial, phone, home_address,
      duty_station, employee_id, travel_auth_no, agency, office, position,
      vehicle_make, vehicle_model, vehicle_year, vehicle_license,
      mileage_rate, per_diem_rate, account_number,
      signature_data, signature_type, req.user.id
    );

    // Update fls_supervisor_id in users table
    if (fls_supervisor_id !== undefined) {
      db.prepare(`
        UPDATE users SET fls_supervisor_id = ? WHERE id = ?
      `).run(fls_supervisor_id, req.user.id);
    }

    const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
    res.json({ message: 'Profile updated', profile: updatedProfile });
  } catch (error) {
    console.error('Update profile error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
};
