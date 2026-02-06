const Database = require('better-sqlite3');
const db = new Database('./backend/database.sqlite');

// Sample plants from different NJ cities
const samplePlants = [
  // Elizabeth plants
  {
    est_number: 'M33789',
    est_name: 'United Premium Foods',
    address: '1 Amboy Ave',
    city: 'Elizabeth',
    state: 'NJ',
    zip_code: '07201',
    circuit: '8020-Elizabeth NJ',
    shift: 1,
    tour_of_duty: '0700-1530',
    latitude: 40.6639916,
    longitude: -74.2107006,
    notes: 'Main processing facility'
  },
  {
    est_number: 'M18574',
    est_name: 'Elite Foods Inc',
    address: '600 Newark Ave',
    city: 'Elizabeth',
    state: 'NJ',
    zip_code: '07208',
    circuit: '8020-Elizabeth NJ',
    shift: 1,
    tour_of_duty: '0700-1530',
    latitude: 40.6698729,
    longitude: -74.1992729,
    notes: 'Secondary location'
  },
  // Linden plants
  {
    est_number: 'M9841',
    est_name: 'Quality Meats Processing',
    address: '1401 E Linden Ave',
    city: 'Linden',
    state: 'NJ',
    zip_code: '07036',
    circuit: '8020-Elizabeth NJ',
    shift: 2,
    tour_of_duty: '1530-2400',
    latitude: 40.6220565,
    longitude: -74.2287369,
    notes: 'Evening shift operations'
  },
  {
    est_number: 'G5672',
    est_name: 'Garden State Poultry',
    address: '925 N Wood Ave',
    city: 'Linden',
    state: 'NJ',
    zip_code: '07036',
    circuit: '8020-Elizabeth NJ',
    shift: 1,
    tour_of_duty: '0700-1530',
    latitude: 40.6375804,
    longitude: -74.2454284,
    notes: 'Poultry processing'
  },
  // Cranford plants
  {
    est_number: 'M7523',
    est_name: 'Premium Protein Corp',
    address: '6 Commerce Dr',
    city: 'Cranford',
    state: 'NJ',
    zip_code: '07016',
    circuit: '8020-Elizabeth NJ',
    shift: 1,
    tour_of_duty: '0700-1530',
    latitude: 40.6581727,
    longitude: -74.2993216,
    notes: 'Certified organic'
  },
  // Woodbridge plants
  {
    est_number: 'M33790',
    est_name: 'Northeast Food Distributors',
    address: '150 Main St',
    city: 'Woodbridge',
    state: 'NJ',
    zip_code: '07095',
    circuit: '8020-Elizabeth NJ',
    shift: 1,
    tour_of_duty: '0700-1530',
    latitude: 40.5576318,
    longitude: -74.2846006,
    notes: 'Distribution center'
  },
  {
    est_number: 'P8854',
    est_name: 'Woodbridge Processing LLC',
    address: '785 Rahway Ave',
    city: 'Woodbridge',
    state: 'NJ',
    zip_code: '07095',
    circuit: '8020-Elizabeth NJ',
    shift: 2,
    tour_of_duty: '1530-2400',
    latitude: 40.5567318,
    longitude: -74.2774545,
    notes: 'Night operations'
  },
  // Edison plants
  {
    est_number: 'M6421',
    est_name: 'Edison Meat Market',
    address: '1665 Oak Tree Rd',
    city: 'Edison',
    state: 'NJ',
    zip_code: '08820',
    circuit: '8020-Elizabeth NJ',
    shift: 1,
    tour_of_duty: '0700-1530',
    latitude: 40.5795317,
    longitude: -74.3287735,
    notes: 'Retail operations'
  },
  // Union plants
  {
    est_number: 'M9512',
    est_name: 'Union County Foods',
    address: '2625 Morris Ave',
    city: 'Union',
    state: 'NJ',
    zip_code: '07083',
    circuit: '8020-Elizabeth NJ',
    shift: 1,
    tour_of_duty: '0700-1530',
    latitude: 40.6981584,
    longitude: -74.2579046,
    notes: 'County supplier'
  },
  // Carteret plants
  {
    est_number: 'M8741',
    est_name: 'Carteret Processing Center',
    address: '55 Chrome Ave',
    city: 'Carteret',
    state: 'NJ',
    zip_code: '07008',
    circuit: '8020-Elizabeth NJ',
    shift: 1,
    tour_of_duty: '0700-1530',
    latitude: 40.5776319,
    longitude: -74.2282047,
    notes: 'Industrial zone'
  },
  // Sayreville plants
  {
    est_number: 'M7896',
    est_name: 'Sayreville Meat Solutions',
    address: '1200 Washington Rd',
    city: 'Sayreville',
    state: 'NJ',
    zip_code: '08872',
    circuit: '8020-Elizabeth NJ',
    shift: 1,
    tour_of_duty: '0700-1530',
    latitude: 40.4659493,
    longitude: -74.3607114,
    notes: 'Custom cutting'
  },
  // S. Plainfield plants
  {
    est_number: 'M5236',
    est_name: 'South Plainfield Foods',
    address: '3051 Hamilton Blvd',
    city: 'S. Plainfield',
    state: 'NJ',
    zip_code: '07080',
    circuit: '8020-Elizabeth NJ',
    shift: 1,
    tour_of_duty: '0700-1530',
    latitude: 40.5781653,
    longitude: -74.4115518,
    notes: 'Wholesale distributor'
  }
];

// Insert plants
const insertStmt = db.prepare(`
  INSERT INTO circuit_plants (
    est_number, est_name, address, city, state, zip_code,
    latitude, longitude, circuit, shift, tour_of_duty, notes, is_active
  ) VALUES (
    @est_number, @est_name, @address, @city, @state, @zip_code,
    @latitude, @longitude, @circuit, @shift, @tour_of_duty, @notes, 1
  )
`);

let inserted = 0;
for (const plant of samplePlants) {
  try {
    insertStmt.run(plant);
    inserted++;
    console.log(`✅ Added: ${plant.est_number} - ${plant.est_name} (${plant.city})`);
  } catch (error) {
    console.error(`❌ Failed to add ${plant.est_number}:`, error.message);
  }
}

console.log(`\n✨ Successfully inserted ${inserted}/${samplePlants.length} plants`);

// Verify
const count = db.prepare('SELECT COUNT(*) as count FROM circuit_plants').get();
console.log(`📊 Total plants in database: ${count.count}`);

// Show city breakdown
const cityCounts = db.prepare(`
  SELECT city, COUNT(*) as count 
  FROM circuit_plants 
  GROUP BY city 
  ORDER BY city
`).all();

console.log('\n🏙️ Plants by city:');
cityCounts.forEach(row => {
  console.log(`   ${row.city}: ${row.count} plant${row.count > 1 ? 's' : ''}`);
});

db.close();
