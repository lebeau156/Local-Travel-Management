// Test script to add a trip with real addresses for map testing
const sqlite3 = require('better-sqlite3');
const db = sqlite3('backend/database.sqlite');

// Delete test trips with fake addresses
db.prepare(`DELETE FROM trips WHERE from_address LIKE '%City, State%'`).run();

// Add a test trip with real Washington DC addresses
const insert = db.prepare(`
  INSERT INTO trips (
    user_id, date, from_address, to_address, 
    site_name, purpose, miles_calculated, 
    created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

insert.run(
  2, // inspector user
  '2026-01-17',
  '1600 Pennsylvania Avenue NW, Washington, DC 20500', // White House
  '100 Constitution Ave NW, Washington, DC 20001', // Capitol
  'USDA Headquarters',
  'Inspection',
  2.1
);

insert.run(
  2, // inspector user
  '2026-01-16',
  '789 S Halsted St, Chicago, IL 60607', // UIC
  '233 S Wacker Dr, Chicago, IL 60606', // Willis Tower
  'Chicago Plant',
  'Routine inspection',
  3.2
);

console.log('✅ Added test trips with real addresses for map testing');
console.log('Trip 1: White House to Capitol (Washington DC)');
console.log('Trip 2: UIC to Willis Tower (Chicago)');

db.close();
