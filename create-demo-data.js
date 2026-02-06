// CREATE DEMO DATA FOR PRESENTATION
// Run this script to populate database with realistic demo data

const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = sqlite3(dbPath);

console.log('🎬 Creating demo data for presentation...\n');

try {
  // 1. Create demo trips for inspector
  console.log('📍 Creating trips for inspector...');
  
  const trips = [
    {
      user_id: 2, // inspector@usda.gov
      date: '2026-01-05',
      from_address: 'USDA Office, Trenton, NJ',
      to_address: 'Superior Poultry, Vineland, NJ',
      site_name: 'Superior Poultry',
      miles_calculated: 28.4,
      purpose: 'Routine poultry inspection'
    },
    {
      user_id: 2,
      date: '2026-01-07',
      from_address: 'USDA Office, Trenton, NJ',
      to_address: 'Garden State Farms, Hammonton, NJ',
      site_name: 'Garden State Farms',
      miles_calculated: 35.2,
      purpose: 'Food safety compliance check'
    },
    {
      user_id: 2,
      date: '2026-01-10',
      from_address: 'USDA Office, Trenton, NJ',
      to_address: 'Atlantic Processing Plant, Atlantic City, NJ',
      site_name: 'Atlantic Processing',
      miles_calculated: 42.1,
      purpose: 'Quarterly facility inspection'
    },
    {
      user_id: 2,
      date: '2026-01-12',
      from_address: 'USDA Office, Trenton, NJ',
      to_address: 'Camden Meat Packing, Camden, NJ',
      site_name: 'Camden Meat Packing',
      miles_calculated: 18.6,
      purpose: 'Follow-up on corrective actions'
    },
    {
      user_id: 2,
      date: '2026-01-15',
      from_address: 'USDA Office, Trenton, NJ',
      to_address: 'Jersey Fresh Produce, Swedesboro, NJ',
      site_name: 'Jersey Fresh Produce',
      miles_calculated: 31.8,
      purpose: 'Produce handling inspection'
    },
    {
      user_id: 2,
      date: '2026-01-17',
      from_address: 'USDA Office, Trenton, NJ',
      to_address: 'Wonder Bread Factory, Bridgeton, NJ',
      site_name: 'Wonder Bread Factory',
      miles_calculated: 39.5,
      purpose: 'Bakery facility audit'
    },
    {
      user_id: 2,
      date: '2026-01-20',
      from_address: 'USDA Office, Trenton, NJ',
      to_address: 'United Premium Beef, Pennsauken, NJ',
      site_name: 'United Premium Beef',
      miles_calculated: 22.3,
      purpose: 'Beef processing inspection'
    },
    {
      user_id: 2,
      date: '2026-01-22',
      from_address: 'USDA Office, Trenton, NJ',
      to_address: 'Ocean Fresh Seafood, Cape May, NJ',
      site_name: 'Ocean Fresh Seafood',
      miles_calculated: 48.7,
      purpose: 'Seafood processing review'
    },
    {
      user_id: 2,
      date: '2026-01-24',
      from_address: 'USDA Office, Trenton, NJ',
      to_address: 'Sunrise Dairy, Mullica Hill, NJ',
      site_name: 'Sunrise Dairy',
      miles_calculated: 25.9,
      purpose: 'Dairy plant inspection'
    },
    {
      user_id: 2,
      date: '2026-01-27',
      from_address: 'USDA Office, Trenton, NJ',
      to_address: 'Premium Poultry Corp, Egg Harbor, NJ',
      site_name: 'Premium Poultry Corp',
      miles_calculated: 45.3,
      purpose: 'Poultry slaughter inspection'
    },
    {
      user_id: 2,
      date: '2026-01-29',
      from_address: 'USDA Office, Trenton, NJ',
      to_address: 'Farmland Foods, Williamstown, NJ',
      site_name: 'Farmland Foods',
      miles_calculated: 27.4,
      purpose: 'Pork processing inspection'
    }
  ];

  const insertTrip = db.prepare(`
    INSERT INTO trips (user_id, date, from_address, to_address, site_name, miles_calculated, purpose, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  for (const trip of trips) {
    insertTrip.run(
      trip.user_id,
      trip.date,
      trip.from_address,
      trip.to_address,
      trip.site_name,
      trip.miles_calculated,
      trip.purpose
    );
  }
  
  console.log(`✅ Created ${trips.length} trips`);
  console.log(`   Total mileage: ${trips.reduce((sum, t) => sum + t.miles_calculated, 0).toFixed(1)} miles\n`);

  // 2. Create a submitted voucher
  console.log('📄 Creating submitted voucher...');
  
  const voucherData = {
    user_id: 2,
    month: 1,
    year: 2026,
    total_miles: trips.reduce((sum, t) => sum + t.mileage, 0),
    total_amount: trips.reduce((sum, t) => sum + t.mileage, 0) * 0.70, // $0.70/mile
    status: 'pending',
    supervisor_id: 3, // supervisor@usda.gov
    submitted_at: '2026-01-30 14:30:00'
  };

  const insertVoucher = db.prepare(`
    INSERT INTO vouchers (
      user_id, month, year, total_miles, total_amount, status, 
      supervisor_id, submitted_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const result = insertVoucher.run(
    voucherData.user_id,
    voucherData.month,
    voucherData.year,
    voucherData.total_miles,
    voucherData.total_amount,
    voucherData.status,
    voucherData.supervisor_id,
    voucherData.submitted_at
  );

  console.log(`✅ Created voucher ID: ${result.lastInsertRowid}`);
  console.log(`   Status: ${voucherData.status}`);
  console.log(`   Total: $${voucherData.total_amount.toFixed(2)}\n`);

  // 3. Add some circuit plants for map demo
  console.log('🗺️ Adding circuit plants...');
  
  const plants = [
    { plant_number: 'P-01', plant_name: 'Superior Poultry', city: 'Vineland', state: 'NJ', circuit: 'NJ-01', latitude: 39.4860, longitude: -75.0254 },
    { plant_number: 'P-02', plant_name: 'Garden State Farms', city: 'Hammonton', state: 'NJ', circuit: 'NJ-01', latitude: 39.6543, longitude: -74.8021 },
    { plant_number: 'P-03', plant_name: 'Atlantic Processing', city: 'Atlantic City', state: 'NJ', circuit: 'NJ-01', latitude: 39.3643, longitude: -74.4229 },
    { plant_number: 'P-04', plant_name: 'Camden Meat Packing', city: 'Camden', state: 'NJ', circuit: 'NJ-01', latitude: 39.9259, longitude: -75.1196 },
    { plant_number: 'P-05', plant_name: 'Jersey Fresh Produce', city: 'Swedesboro', state: 'NJ', circuit: 'NJ-01', latitude: 39.7476, longitude: -75.3105 },
  ];

  const insertPlant = db.prepare(`
    INSERT OR REPLACE INTO circuit_plants (
      plant_number, plant_name, address, city, state, zip_code, 
      circuit, latitude, longitude, assigned_inspector_id, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  for (const plant of plants) {
    insertPlant.run(
      plant.plant_number,
      plant.plant_name,
      '123 Main St', // Generic address
      plant.city,
      plant.state,
      '08000',
      plant.circuit,
      plant.latitude,
      plant.longitude,
      2 // Assigned to inspector
    );
  }

  console.log(`✅ Added ${plants.length} circuit plants\n`);

  // 4. Summary
  console.log('✅ DEMO DATA READY!\n');
  console.log('📊 Summary:');
  console.log(`   • ${trips.length} trips created for inspector`);
  console.log(`   • 1 voucher submitted (status: pending)`);
  console.log(`   • ${plants.length} circuit plants on map`);
  console.log(`   • Total mileage: ${voucherData.total_miles.toFixed(1)} miles`);
  console.log(`   • Total amount: $${voucherData.total_amount.toFixed(2)}\n`);

  console.log('🎬 You\'re ready for the demo!\n');
  console.log('Login credentials:');
  console.log('   Inspector: inspector@usda.gov / Test123!');
  console.log('   Supervisor: supervisor@usda.gov / Test123!');
  console.log('   Fleet Manager: fleetmgr@usda.gov / Test123!\n');

} catch (error) {
  console.error('❌ Error creating demo data:', error.message);
} finally {
  db.close();
}
