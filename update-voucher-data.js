const db = require('better-sqlite3')('backend/database.sqlite');

const formData = {
  travel_auth_no: 'N/A',
  ssn_last4: '6739',
  name_first: 'Mohamed',
  name_last: 'Diallo',
  name_middle: 'L',
  agency_code_num: '37',
  agency_office_num: 'AG37586000',
  traveler_office_num: 'ABC 12',
  from_date: '2026-01-01',
  thru_date: '2026-01-31',
  type_claim: 'DM',
  purpose_of_travel_code: '1',
  official_duty_station: 'United Premium Foods',
  resident_city: 'Cranford, NJ',
  digital_signature_timestamp: '01/19/2026 at 02:10:00 PM EST',
  claimant_signature: 'Mohamed L Diallo',
  accounting_distribution: [
    {code: '5TC0285', percentage: 50},
    {code: '5TC0286', percentage: 30},
    {code: '5TC0987', percentage: 20}
  ],
  remarks: ''
};

db.prepare(`
  UPDATE vouchers 
  SET form_data = ?, 
      employee_signature = ? 
  WHERE id = 1
`).run(JSON.stringify(formData), 'Mohamed L Diallo');

console.log('✅ Voucher updated with form data');
db.close();
