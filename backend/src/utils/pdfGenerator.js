const PDFDocument = require('pdfkit');

/**
 * Generate AD-616 Travel Voucher PDF matching official 2-page format
 * @param {Object} voucherData - Complete voucher data with trips and profile
 * @returns {PDFDocument} - PDF document stream
 */
function generateVoucherPDF(voucherData) {
  // Create landscape Letter-size document (11" x 8.5")
  const doc = new PDFDocument({ 
    size: 'LETTER',
    layout: 'landscape',
    margin: 30 
  });
  
  const { voucher, trips, profile } = voucherData;
  
  // Helper functions
  const formatCurrency = (amount) => `$${parseFloat(amount || 0).toFixed(2)}`;
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Page setup - LANDSCAPE
  const pageHeight = doc.page.height; // 612
  const pageWidth = doc.page.width;   // 792
  const margin = doc.page.margins.left;
  const usableWidth = pageWidth - (margin * 2); // 732
  
  let y = 40;
  
  // ===== PAGE 1 =====
  
  // Title
  doc.fontSize(14).font('Helvetica-Bold')
     .text('TRAVEL VOUCHER (Temporary Duty Travel)', margin, y, { align: 'center' });
  doc.fontSize(9).font('Helvetica')
     .text('FORM AD-616 (GSA) (Rev. 11/96)', margin, y + 18, { align: 'center' });
  
  y = 75;
  
  // SECTION A - IDENTIFICATION (Compact two-column layout)
  doc.fontSize(10).font('Helvetica-Bold')
     .text('SECTION A - IDENTIFICATION', margin, y);
  
  y += 18;
  doc.fontSize(8).font('Helvetica');
  
  const col1X = margin;
  const col2X = margin + 370;
  
  // Left column
  doc.font('Helvetica-Bold').text('1. TRAVELER\'S NAME:', col1X, y, { continued: true });
  doc.font('Helvetica').text(`  ${profile.first_name || ''} ${profile.middle_initial || ''} ${profile.last_name || ''}`);
  
  // Right column
  doc.font('Helvetica-Bold').text('2. SSN:', col2X, y, { continued: true });
  doc.font('Helvetica').text(`  XXX-XX-${profile.ssn_last_four || 'XXXX'}`);
  
  y += 15;
  
  doc.font('Helvetica-Bold').text('5. AGENCY:', col1X, y, { continued: true });
  doc.font('Helvetica').text(`  ${profile.agency || 'USDA'}`);
  
  doc.font('Helvetica-Bold').text('6. EMPLOYEE ID:', col2X, y, { continued: true });
  doc.font('Helvetica').text(`  ${profile.employee_id || ''}`);
  
  y += 15;
  
  doc.font('Helvetica-Bold').text('OFFICE:', col1X, y, { continued: true });
  doc.font('Helvetica').text(`  ${profile.office || ''}`);
  
  doc.font('Helvetica-Bold').text('DUTY STATION:', col2X, y, { continued: true });
  doc.font('Helvetica').text(`  ${profile.duty_station || ''}`);
  
  y += 15;
  
  doc.font('Helvetica-Bold').text('7. DATES OF TRAVEL:', col1X, y, { continued: true });
  doc.font('Helvetica').text(`  ${monthNames[voucher.month - 1]} ${voucher.year}`);
  
  y += 25;
  
  // SECTION C - TRANSPORTATION
  doc.fontSize(10).font('Helvetica-Bold')
     .text('SECTION C - TRANSPORTATION COSTS', margin, y);
  
  y += 18;
  doc.fontSize(8).font('Helvetica-Bold');
  doc.text('PRIVATELY OWNED VEHICLE (POV):', margin + 10, y);
  y += 12;
  doc.font('Helvetica').fontSize(7);
  doc.text(`Vehicle: ${profile.vehicle_year || ''} ${profile.vehicle_make || ''} ${profile.vehicle_model || ''}`, margin + 20, y);
  y += 10;
  doc.text(`License Plate: ${profile.vehicle_license || ''}`, margin + 20, y);
  
  y += 20;
  
  // SECTION D - CLAIMS
  doc.fontSize(10).font('Helvetica-Bold')
     .text('SECTION D - CLAIMS', margin, y);
  
  y += 18;
  doc.fontSize(8).font('Helvetica');
  
  // Mileage Claims
  const mileageRate = profile.mileage_rate || 0.67;
  const mileageAmount = voucher.total_miles * mileageRate;
  
  doc.font('Helvetica-Bold').text('Total Miles:', margin + 10, y, { continued: true });
  doc.font('Helvetica').text(`  ${voucher.total_miles.toFixed(1)} miles`);
  y += 12;
  
  doc.font('Helvetica-Bold').text('Mileage Rate:', margin + 10, y, { continued: true });
  doc.font('Helvetica').text(`  ${formatCurrency(mileageRate)} per mile`);
  y += 12;
  
  doc.font('Helvetica-Bold').text('Total Mileage Amount:', margin + 10, y, { continued: true });
  doc.font('Helvetica').text(`  ${formatCurrency(mileageAmount)}`);
  y += 12;
  
  // Additional Expenses (if any)
  const hasExpenses = (voucher.total_lodging > 0 || voucher.total_meals > 0 || voucher.total_other > 0);
  
  if (hasExpenses) {
    y += 8;
    doc.font('Helvetica-Bold').text('Additional Expenses:', margin + 10, y);
    y += 12;
    
    if (voucher.total_lodging > 0) {
      doc.font('Helvetica-Bold').text('  Lodging:', margin + 20, y, { continued: true });
      doc.font('Helvetica').text(`  ${formatCurrency(voucher.total_lodging)}`);
      y += 12;
    }
    
    if (voucher.total_meals > 0) {
      doc.font('Helvetica-Bold').text('  Meals:', margin + 20, y, { continued: true });
      doc.font('Helvetica').text(`  ${formatCurrency(voucher.total_meals)}`);
      y += 12;
    }
    
    if (voucher.total_other > 0) {
      doc.font('Helvetica-Bold').text('  Other Expenses:', margin + 20, y, { continued: true });
      doc.font('Helvetica').text(`  ${formatCurrency(voucher.total_other)}`);
      y += 12;
    }
    
    y += 8;
    doc.font('Helvetica-Bold').text('TOTAL AMOUNT CLAIMED:', margin + 10, y, { continued: true });
    doc.font('Helvetica-Bold').fontSize(9).text(`  ${formatCurrency(voucher.total_amount)}`);
    doc.fontSize(8);
  }
  
  y += 30;
  
  // SECTION G - SCHEDULE (Simplified table for page 1)
  doc.fontSize(10).font('Helvetica-Bold')
     .text('SECTION G - SCHEDULE OF EXPENSES AND AMOUNTS CLAIMED', margin, y);
  
  y += 18;
  
  // Simple trip table with expense breakdown
  doc.fontSize(7).font('Helvetica-Bold');
  
  // Table header
  const tableY = y;
  doc.rect(margin, tableY, usableWidth, 15).stroke();
  
  doc.text('DATE', margin + 5, tableY + 4, { width: 60 });
  doc.text('FROM', margin + 70, tableY + 4, { width: 110 });
  doc.text('TO', margin + 185, tableY + 4, { width: 110 });
  doc.text('PLANT', margin + 300, tableY + 4, { width: 100 });
  doc.text('PURPOSE', margin + 405, tableY + 4, { width: 80 });
  doc.text('MILES', margin + 490, tableY + 4, { width: 50, align: 'right' });
  doc.text('VALUE($)', margin + 545, tableY + 4, { width: 55, align: 'right' });
  doc.text('EXPENSES', margin + 605, tableY + 4, { width: 55, align: 'right' });
  doc.text('TOTAL', margin + 665, tableY + 4, { width: 60, align: 'right' });
  
  y += 15;
  
  // Trip rows
  doc.fontSize(7).font('Helvetica');
  trips.forEach((trip) => {
    const mileageRate = profile.mileage_rate || 0.67;
    const tripMileageAmount = trip.miles_calculated * mileageRate;
    const tripExpenses = (trip.lodging_cost || 0) + (trip.meals_cost || 0) + (trip.other_expenses || 0);
    const tripAmount = tripMileageAmount + tripExpenses;
    
    doc.rect(margin, y, usableWidth, 14).stroke();
    
    doc.text(formatDate(trip.date), margin + 5, y + 3, { width: 60 });
    doc.text(trip.from_address || '', margin + 70, y + 3, { width: 110 });
    doc.text(trip.to_address || '', margin + 185, y + 3, { width: 110 });
    doc.text(trip.site_name || '', margin + 300, y + 3, { width: 100 });
    doc.text(trip.purpose || '', margin + 405, y + 3, { width: 80 });
    doc.text(trip.miles_calculated.toFixed(1), margin + 490, y + 3, { width: 50, align: 'right' });
    doc.text(formatCurrency(tripMileageAmount), margin + 545, y + 3, { width: 55, align: 'right' });
    doc.text(formatCurrency(tripExpenses), margin + 605, y + 3, { width: 55, align: 'right' });
    doc.text(formatCurrency(tripAmount), margin + 665, y + 3, { width: 60, align: 'right' });
    
    y += 14;
  });
  
  // Total row
  doc.font('Helvetica-Bold');
  doc.rect(margin, y, usableWidth, 14).fillAndStroke('#f0f0f0', '#000000');
  doc.fillColor('#000000');
  
  const totalMileageAmount = voucher.total_miles * mileageRate;
  const totalExpenses = (voucher.total_lodging || 0) + (voucher.total_meals || 0) + (voucher.total_other || 0);
  
  doc.text('TOTAL:', margin + 405, y + 3, { width: 80 });
  doc.text(voucher.total_miles.toFixed(1), margin + 490, y + 3, { width: 50, align: 'right' });
  doc.text(formatCurrency(totalMileageAmount), margin + 545, y + 3, { width: 55, align: 'right' });
  doc.text(formatCurrency(totalExpenses), margin + 605, y + 3, { width: 55, align: 'right' });
  doc.text(formatCurrency(voucher.total_amount), margin + 665, y + 3, { width: 60, align: 'right' });
  
  y += 25;
  
  // SECTION F - CERTIFICATIONS
  if (y > 450) {
    doc.addPage({ layout: 'landscape' });
    y = 50;
  }
  
  doc.fontSize(10).font('Helvetica-Bold')
     .text('SECTION F - CERTIFICATIONS', margin, y);
  
  y += 18;
  doc.fontSize(7).font('Helvetica');
  
  const certText = `I CERTIFY that this claim is true and correct to the best of my knowledge and belief and that payment has not been received. I have not used Government-furnished transportation or subsistence in kind for the expenses claimed herein. All travel and transportation was necessary in the performance of official business. This voucher is submitted in duplicate.`;
  
  doc.text(certText, margin, y, { width: usableWidth, align: 'justify' });
  
  y += 40;
  
  // Signature lines
  doc.moveTo(margin, y).lineTo(margin + 250, y).stroke();
  doc.moveTo(margin + 400, y).lineTo(margin + 550, y).stroke();
  doc.fontSize(7).font('Helvetica-Bold')
     .text('EMPLOYEE SIGNATURE', margin, y + 5)
     .text('DATE', margin + 400, y + 5);
  
  y += 40;
  
  doc.moveTo(margin, y).lineTo(margin + 250, y).stroke();
  doc.moveTo(margin + 400, y).lineTo(margin + 550, y).stroke();
  doc.text('APPROVING OFFICER SIGNATURE', margin, y + 5)
     .text('DATE', margin + 400, y + 5);
  
  // Footer
  doc.fontSize(6).font('Helvetica')
     .text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, pageHeight - 30, { align: 'center' });
  doc.text('USDA Travel Mileage Tracker System', margin, pageHeight - 20, { align: 'center' });
  
  return doc;
}

module.exports = { generateVoucherPDF };
