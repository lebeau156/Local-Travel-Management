const ExcelJS = require('exceljs');
const { db } = require('../models/database');
const { logActivity, getClientIp, ACTIONS } = require('../utils/auditLogger');

// Export trips to Excel
exports.exportTripsToExcel = async (req, res) => {
  try {
    const trips = db.prepare(`
      SELECT 
        date, from_address, to_address, site_name, purpose,
        miles_calculated, lodging_cost, meals_cost, other_expenses,
        departure_time, return_time, notes
      FROM trips 
      WHERE user_id = ?
      ORDER BY date DESC
    `).all(req.user.id);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Trips');

    // Add headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'From', key: 'from_address', width: 30 },
      { header: 'To', key: 'to_address', width: 30 },
      { header: 'Plant Name', key: 'site_name', width: 20 },
      { header: 'Purpose', key: 'purpose', width: 15 },
      { header: 'Miles', key: 'miles_calculated', width: 10 },
      { header: 'Lodging ($)', key: 'lodging_cost', width: 12 },
      { header: 'Meals ($)', key: 'meals_cost', width: 12 },
      { header: 'Other ($)', key: 'other_expenses', width: 12 },
      { header: 'Departure Time', key: 'departure_time', width: 15 },
      { header: 'Return Time', key: 'return_time', width: 15 },
      { header: 'Notes', key: 'notes', width: 40 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    trips.forEach(trip => {
      const row = worksheet.addRow({
        date: new Date(trip.date).toLocaleDateString(),
        from_address: trip.from_address,
        to_address: trip.to_address,
        site_name: trip.site_name || '',
        purpose: trip.purpose || '',
        miles_calculated: trip.miles_calculated,
        lodging_cost: trip.lodging_cost || 0,
        meals_cost: trip.meals_cost || 0,
        other_expenses: trip.other_expenses || 0,
        departure_time: trip.departure_time || '',
        return_time: trip.return_time || '',
        notes: trip.notes || ''
      });

      // Format currency columns
      row.getCell(7).numFmt = '$#,##0.00';
      row.getCell(8).numFmt = '$#,##0.00';
      row.getCell(9).numFmt = '$#,##0.00';
    });

    // Add totals row
    const totalRow = worksheet.addRow({
      date: '',
      from_address: '',
      to_address: '',
      site_name: '',
      purpose: 'TOTAL:',
      miles_calculated: { formula: `SUM(F2:F${trips.length + 1})` },
      lodging_cost: { formula: `SUM(G2:G${trips.length + 1})` },
      meals_cost: { formula: `SUM(H2:H${trips.length + 1})` },
      other_expenses: { formula: `SUM(I2:I${trips.length + 1})` },
      departure_time: '',
      return_time: '',
      notes: ''
    });

    totalRow.font = { bold: true };
    totalRow.getCell(7).numFmt = '$#,##0.00';
    totalRow.getCell(8).numFmt = '$#,##0.00';
    totalRow.getCell(9).numFmt = '$#,##0.00';

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=trips_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.EXPORT_TRIPS_EXCEL,
      entityType: 'trip',
      entityId: null,
      details: { 
        format: 'excel',
        tripCount: trips.length
      },
      ipAddress: getClientIp(req)
    });

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export trips to Excel error:', error);
    res.status(500).json({ error: 'Failed to export trips' });
  }
};

// Export trips to CSV
exports.exportTripsToCSV = async (req, res) => {
  try {
    const trips = db.prepare(`
      SELECT 
        date, from_address, to_address, site_name, purpose,
        miles_calculated, lodging_cost, meals_cost, other_expenses,
        departure_time, return_time, notes
      FROM trips 
      WHERE user_id = ?
      ORDER BY date DESC
    `).all(req.user.id);

    // CSV header
    const headers = [
      'Date', 'From', 'To', 'Plant Name', 'Purpose', 'Miles',
      'Lodging ($)', 'Meals ($)', 'Other ($)', 'Departure Time', 'Return Time', 'Notes'
    ];

    // Build CSV content
    let csv = headers.join(',') + '\n';

    trips.forEach(trip => {
      const row = [
        new Date(trip.date).toLocaleDateString(),
        `"${trip.from_address}"`,
        `"${trip.to_address}"`,
        `"${trip.site_name || ''}"`,
        trip.purpose || '',
        trip.miles_calculated,
        trip.lodging_cost || 0,
        trip.meals_cost || 0,
        trip.other_expenses || 0,
        trip.departure_time || '',
        trip.return_time || '',
        `"${(trip.notes || '').replace(/"/g, '""')}"`
      ];
      csv += row.join(',') + '\n';
    });

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=trips_${new Date().toISOString().slice(0, 10)}.csv`
    );

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.EXPORT_TRIPS_CSV,
      entityType: 'trip',
      entityId: null,
      details: { 
        format: 'csv',
        tripCount: trips.length
      },
      ipAddress: getClientIp(req)
    });

    res.send(csv);
  } catch (error) {
    console.error('Export trips to CSV error:', error);
    res.status(500).json({ error: 'Failed to export trips' });
  }
};

// Export voucher to Excel
exports.exportVoucherToExcel = async (req, res) => {
  try {
    const { id } = req.params;

    // Get voucher details
    const voucher = db.prepare(`
      SELECT v.*, p.first_name, p.last_name, p.employee_id, p.duty_station
      FROM vouchers v
      LEFT JOIN profiles p ON v.user_id = p.user_id
      WHERE v.id = ? AND v.user_id = ?
    `).get(id, req.user.id);

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found' });
    }

    // Get trips for voucher
    const trips = db.prepare(`
      SELECT date, from_address, to_address, site_name, purpose,
             miles_calculated, lodging_cost, meals_cost, other_expenses
      FROM trips
      WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
      ORDER BY date
    `).all(req.user.id, voucher.year.toString(), voucher.month.toString().padStart(2, '0'));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Voucher Details');

    // Voucher header
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'TRAVEL VOUCHER';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Employee info
    worksheet.getCell('A3').value = 'Employee:';
    worksheet.getCell('B3').value = `${voucher.first_name || ''} ${voucher.last_name || ''}`;
    worksheet.getCell('A4').value = 'Employee ID:';
    worksheet.getCell('B4').value = voucher.employee_id || '';
    worksheet.getCell('A5').value = 'Duty Station:';
    worksheet.getCell('B5').value = voucher.duty_station || '';

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    worksheet.getCell('D3').value = 'Period:';
    worksheet.getCell('E3').value = `${monthNames[voucher.month - 1]} ${voucher.year}`;
    worksheet.getCell('D4').value = 'Status:';
    worksheet.getCell('E4').value = voucher.status.toUpperCase();

    // Trips table
    worksheet.getCell('A7').value = 'TRIP DETAILS';
    worksheet.getCell('A7').font = { bold: true, size: 12 };

    const tripHeaders = worksheet.getRow(8);
    tripHeaders.values = ['Date', 'From', 'To', 'Plant', 'Purpose', 'Miles', 'Lodging', 'Meals', 'Other'];
    tripHeaders.font = { bold: true };
    tripHeaders.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add trips
    let rowNum = 9;
    trips.forEach(trip => {
      const row = worksheet.getRow(rowNum);
      row.values = [
        new Date(trip.date).toLocaleDateString(),
        trip.from_address,
        trip.to_address,
        trip.site_name || '',
        trip.purpose || '',
        trip.miles_calculated,
        trip.lodging_cost || 0,
        trip.meals_cost || 0,
        trip.other_expenses || 0
      ];
      row.getCell(7).numFmt = '$#,##0.00';
      row.getCell(8).numFmt = '$#,##0.00';
      row.getCell(9).numFmt = '$#,##0.00';
      rowNum++;
    });

    // Totals
    const totalRow = worksheet.getRow(rowNum);
    totalRow.values = [
      '', '', '', '', 'TOTAL:',
      voucher.total_miles,
      voucher.total_lodging || 0,
      voucher.total_meals || 0,
      voucher.total_other || 0
    ];
    totalRow.font = { bold: true };
    totalRow.getCell(7).numFmt = '$#,##0.00';
    totalRow.getCell(8).numFmt = '$#,##0.00';
    totalRow.getCell(9).numFmt = '$#,##0.00';

    rowNum += 2;
    worksheet.getCell(`A${rowNum}`).value = 'TOTAL AMOUNT:';
    worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 12 };
    worksheet.getCell(`B${rowNum}`).value = voucher.total_amount;
    worksheet.getCell(`B${rowNum}`).numFmt = '$#,##0.00';
    worksheet.getCell(`B${rowNum}`).font = { bold: true, size: 12, color: { argb: 'FF008000' } };

    // Column widths
    worksheet.getColumn(1).width = 12;
    worksheet.getColumn(2).width = 25;
    worksheet.getColumn(3).width = 25;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 10;
    worksheet.getColumn(7).width = 12;
    worksheet.getColumn(8).width = 12;
    worksheet.getColumn(9).width = 12;

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=voucher_${monthNames[voucher.month - 1]}_${voucher.year}.xlsx`
    );

    // Log activity
    logActivity({
      userId: req.user.id,
      action: ACTIONS.EXPORT_VOUCHER_EXCEL,
      entityType: 'voucher',
      entityId: voucher.id,
      details: { 
        format: 'excel',
        month: voucher.month,
        year: voucher.year,
        totalAmount: voucher.total_amount
      },
      ipAddress: getClientIp(req)
    });

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export voucher to Excel error:', error);
    res.status(500).json({ error: 'Failed to export voucher' });
  }
};
