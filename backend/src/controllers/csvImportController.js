const { db } = require('../models/database');
const csvParser = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

/**
 * Download CSV template
 */
exports.downloadTemplate = (req, res) => {
  try {
    const template = `date,from_address,to_address,site_name,purpose,expenses,expense_notes
2026-01-15,"123 Main St, City, State","456 Oak Ave, City, State","Plant ABC","Routine inspection",25.50,"Parking fee"
2026-01-16,"456 Oak Ave, City, State","789 Pine Rd, City, State","Plant XYZ","Follow-up visit",0,""`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=trip_import_template.csv');
    res.send(template);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
};

/**
 * Parse and validate CSV data
 */
function parseCSVData(csvContent) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowNumber = 1; // Start at 1 (header is row 0)

    const stream = Readable.from(csvContent);

    stream
      .pipe(csvParser())
      .on('data', (row) => {
        rowNumber++;
        const validationErrors = validateTripRow(row, rowNumber);
        
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
        } else {
          results.push({
            ...row,
            rowNumber
          });
        }
      })
      .on('end', () => {
        resolve({ data: results, errors });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Validate individual trip row
 */
function validateTripRow(row, rowNumber) {
  const errors = [];

  // Required fields
  if (!row.date || row.date.trim() === '') {
    errors.push({ row: rowNumber, field: 'date', message: 'Date is required' });
  } else {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row.date)) {
      errors.push({ row: rowNumber, field: 'date', message: 'Date must be in YYYY-MM-DD format' });
    } else {
      const date = new Date(row.date);
      if (isNaN(date.getTime())) {
        errors.push({ row: rowNumber, field: 'date', message: 'Invalid date' });
      }
    }
  }

  if (!row.from_address || row.from_address.trim() === '') {
    errors.push({ row: rowNumber, field: 'from_address', message: 'From address is required' });
  }

  if (!row.to_address || row.to_address.trim() === '') {
    errors.push({ row: rowNumber, field: 'to_address', message: 'To address is required' });
  }

  // Optional but validated if present
  if (row.expenses) {
    const expenses = parseFloat(row.expenses);
    if (isNaN(expenses) || expenses < 0) {
      errors.push({ row: rowNumber, field: 'expenses', message: 'Expenses must be a non-negative number' });
    }
  }

  return errors;
}

/**
 * Import trips from CSV
 */
exports.importTrips = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    // Get CSV data from uploaded file
    const csvData = req.file.buffer.toString('utf-8');
    const dryRun = req.body.dryRun === 'true';

    // Parse and validate CSV
    const { data, errors } = await parseCSVData(csvData);

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation errors found',
        errors,
        validRows: data.length,
        invalidRows: errors.length
      });
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'No valid data to import' });
    }

    // Dry run - just return what would be imported
    if (dryRun) {
      return res.json({
        message: 'Dry run successful - no data imported',
        rowCount: data.length,
        preview: data.slice(0, 10),
        summary: {
          totalRows: data.length,
          estimatedMileage: 'Will be calculated on import',
          estimatedAmount: 'Will be calculated on import'
        }
      });
    }

    // Actual import
    const imported = [];
    const importErrors = [];

    const insertTrip = db.prepare(`
      INSERT INTO trips (
        user_id, date, from_address, to_address, 
        site_name, purpose, miles_calculated, 
        other_expenses, expense_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    for (const row of data) {
      try {
        // Calculate default mileage (50 miles - will be recalculated by frontend)
        const defaultMiles = 50;
        
        // Parse expenses (store as other_expenses)
        const otherExpenses = row.expenses ? parseFloat(row.expenses) : 0;

        const result = insertTrip.run(
          req.user.id,
          row.date,
          row.from_address.trim(),
          row.to_address.trim(),
          row.site_name?.trim() || null,
          row.purpose?.trim() || null,
          defaultMiles,
          otherExpenses,
          row.expense_notes?.trim() || null
        );

        imported.push({
          rowNumber: row.rowNumber,
          tripId: result.lastInsertRowid,
          date: row.date
        });
      } catch (error) {
        importErrors.push({
          row: row.rowNumber,
          message: error.message
        });
      }
    }

    res.json({
      message: `Successfully imported ${imported.length} trip(s)`,
      imported: imported.length,
      failed: importErrors.length,
      importedTrips: imported,
      errors: importErrors
    });
  } catch (error) {
    console.error('Error importing trips:', error);
    res.status(500).json({ error: 'Failed to import trips' });
  }
};

/**
 * Get import history (from audit logs)
 */
exports.getImportHistory = (req, res) => {
  try {
    const history = db.prepare(`
      SELECT 
        id, user_id, action, details, created_at
      FROM audit_log
      WHERE action = 'IMPORT_TRIPS'
      ORDER BY created_at DESC
      LIMIT 50
    `).all();

    res.json(history);
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
};

/**
 * Export trips to CSV
 */
exports.exportTrips = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        date, from_address, to_address, site_name, 
        purpose, miles_calculated, expenses, expense_notes
      FROM trips
      WHERE user_id = ?
    `;
    const params = [req.user.id];

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC';

    const trips = db.prepare(query).all(...params);

    if (trips.length === 0) {
      return res.status(404).json({ error: 'No trips found' });
    }

    // Generate CSV
    const headers = ['date', 'from_address', 'to_address', 'site_name', 'purpose', 'miles_calculated', 'expenses', 'expense_notes'];
    const rows = trips.map(trip => 
      headers.map(h => {
        const value = trip[h] || '';
        // Escape quotes and wrap in quotes if contains comma
        return value.toString().includes(',') || value.toString().includes('"') 
          ? `"${value.toString().replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=trips_export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting trips:', error);
    res.status(500).json({ error: 'Failed to export trips' });
  }
};
