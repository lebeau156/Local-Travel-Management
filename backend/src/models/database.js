const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// Optimize for performance
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 10000');
db.pragma('temp_store = MEMORY');

// Create tables
function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'inspector',
      assigned_supervisor_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_supervisor_id) REFERENCES users(id)
    )
  `);
  
  // Add assigned_supervisor_id if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN assigned_supervisor_id INTEGER REFERENCES users(id)`);
  } catch (e) { /* Column already exists */ }
  
  // Add fls_supervisor_id if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN fls_supervisor_id INTEGER REFERENCES users(id)`);
  } catch (e) { /* Column already exists */ }

  // Profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      middle_initial TEXT,
      ssn_encrypted TEXT,
      phone TEXT,
      home_address TEXT,
      duty_station TEXT,
      employee_id TEXT,
      travel_auth_no TEXT,
      agency TEXT DEFAULT 'USDA',
      office TEXT,
      vehicle_make TEXT,
      vehicle_model TEXT,
      vehicle_year TEXT,
      vehicle_license TEXT,
      mileage_rate REAL DEFAULT 0.67,
      per_diem_rate REAL DEFAULT 0.00,
      account_number TEXT,
      signature_data TEXT,
      signature_type TEXT,
      accounting_code TEXT,
      cost_center TEXT,
      fund_code TEXT,
      organization_code TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Add accounting fields if they don't exist (migration)
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN accounting_code TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN cost_center TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN fund_code TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN organization_code TEXT`);
  } catch (e) { /* Column already exists */ }
  
  // Add supervisor and location fields if they don't exist (migration)
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN supervisor_id INTEGER REFERENCES users(id)`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN state TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN circuit TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN position TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE profiles ADD COLUMN hire_date DATE`);
  } catch (e) { /* Column already exists */ }

  // Trips table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      site_name TEXT,
      purpose TEXT,
      miles_calculated REAL NOT NULL,
      route_data TEXT,
      departure_time TEXT,
      return_time TEXT,
      notes TEXT,
      lodging_cost REAL DEFAULT 0,
      meals_cost REAL DEFAULT 0,
      per_diem_days REAL DEFAULT 0,
      other_expenses REAL DEFAULT 0,
      expense_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  // Add per diem fields if they don't exist (migration)
  try {
    db.exec(`ALTER TABLE trips ADD COLUMN lodging_cost REAL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE trips ADD COLUMN meals_cost REAL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE trips ADD COLUMN per_diem_days REAL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE trips ADD COLUMN other_expenses REAL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE trips ADD COLUMN expense_notes TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE trips ADD COLUMN avoid_tolls INTEGER DEFAULT 0`);
  } catch (e) { /* Column already exists */ }

  // Vouchers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      status TEXT DEFAULT 'draft',
      total_miles REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      total_lodging REAL DEFAULT 0,
      total_meals REAL DEFAULT 0,
      total_other REAL DEFAULT 0,
      submitted_at DATETIME,
      supervisor_id INTEGER,
      supervisor_approved_at DATETIME,
      fleet_manager_id INTEGER,
      fleet_approved_at DATETIME,
      rejection_reason TEXT,
      pdf_url TEXT,
      employee_signature TEXT,
      employee_signed_at DATETIME,
      approver_signature TEXT,
      approver_signed_at DATETIME,
      certification_statement TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (supervisor_id) REFERENCES users(id),
      FOREIGN KEY (fleet_manager_id) REFERENCES users(id)
    )
  `);
  
  // Add expense totals if they don't exist (migration)
  try {
    db.exec(`ALTER TABLE vouchers ADD COLUMN total_lodging REAL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE vouchers ADD COLUMN total_meals REAL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE vouchers ADD COLUMN total_other REAL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE vouchers ADD COLUMN employee_signature TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE vouchers ADD COLUMN employee_signed_at DATETIME`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE vouchers ADD COLUMN approver_signature TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE vouchers ADD COLUMN approver_signed_at DATETIME`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE vouchers ADD COLUMN certification_statement TEXT`);
  } catch (e) { /* Column already exists */ }

  // Voucher trips junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS voucher_trips (
      voucher_id INTEGER NOT NULL,
      trip_id INTEGER NOT NULL,
      PRIMARY KEY (voucher_id, trip_id),
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    )
  `);

  // Audit log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // ========== CREATE INDEXES FOR PERFORMANCE ==========
  // These indexes speed up common queries significantly
  
  // Users indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
  
  // Trips indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_trips_user_date ON trips(user_id, date)`);
  
  // Vouchers indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON vouchers(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_vouchers_month_year ON vouchers(month, year)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_vouchers_user_month_year ON vouchers(user_id, month, year)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_vouchers_supervisor_id ON vouchers(supervisor_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_vouchers_fleet_manager_id ON vouchers(fleet_manager_id)`);
  
  // Voucher trips indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_voucher_trips_voucher_id ON voucher_trips(voucher_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_voucher_trips_trip_id ON voucher_trips(trip_id)`);
  
  // Audit log indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id)`);

  // Messages table for internal communication
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      parent_message_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL
    )
  `);

  // Messages indexes for performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_message_id)`);

  console.log('✅ Database tables created successfully');

  // Create default admin account if not exists
  createDefaultUsers();
}

function createDefaultUsers() {
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@usda.gov');
  
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('Admin123!', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (email, password, role) VALUES (?, ?, ?)
    `);
    
    const adminId = insertUser.run('admin@usda.gov', hashedPassword, 'admin').lastInsertRowid;
    const inspectorId = insertUser.run('inspector@usda.gov', bcrypt.hashSync('Test123!', 10), 'inspector').lastInsertRowid;
    const supervisorId = insertUser.run('supervisor@usda.gov', bcrypt.hashSync('Test123!', 10), 'supervisor').lastInsertRowid;
    const fleetMgrId = insertUser.run('fleetmgr@usda.gov', bcrypt.hashSync('Test123!', 10), 'fleet_manager').lastInsertRowid;

    // Create profiles for default users
    const insertProfile = db.prepare(`
      INSERT INTO profiles (user_id, first_name, last_name, agency, office, duty_station) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertProfile.run(adminId, 'System', 'Admin', 'USDA', 'IT Department', 'Washington DC');
    insertProfile.run(inspectorId, 'John', 'Doe', 'USDA', 'CSI Eastern Region', 'Baltimore, MD');
    insertProfile.run(supervisorId, 'Jane', 'Smith', 'USDA', 'CSI Eastern Region', 'Baltimore, MD');
    insertProfile.run(fleetMgrId, 'Mike', 'Johnson', 'USDA', 'Fleet Management', 'Washington DC');

    // Assign inspector to supervisor
    db.prepare('UPDATE users SET assigned_supervisor_id = ? WHERE id = ?').run(supervisorId, inspectorId);

    console.log('✅ Default user accounts created');
    console.log('   Admin: admin@usda.gov / Admin123!');
    console.log('   Inspector: inspector@usda.gov / Test123!');
    console.log('   Supervisor: supervisor@usda.gov / Test123!');
    console.log('   Fleet Manager: fleetmgr@usda.gov / Test123!');
  }
}

module.exports = { db, initDatabase };
