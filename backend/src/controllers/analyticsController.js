const { db } = require('../models/database');
const ExcelJS = require('exceljs');

console.log('🔷 Analytics controller loaded at:', new Date().toISOString());

/**
 * Get filter options for advanced filtering
 */
exports.getFilterOptions = (req, res) => {
  try {
    console.log('📋 Fetching filter options...');
    
    // Get all inspectors (users with role inspector or supervisor)
    const inspectors = db.prepare(`
      SELECT DISTINCT
        u.id,
        u.email,
        COALESCE(p.first_name || ' ' || p.last_name, u.email) as name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role IN ('inspector', 'supervisor')
      ORDER BY name ASC
    `).all();
    
    // Get distinct states
    const states = db.prepare(`
      SELECT DISTINCT state
      FROM profiles
      WHERE state IS NOT NULL AND state != ''
      ORDER BY state ASC
    `).all().map(row => row.state);
    
    // Get distinct circuits
    const circuits = db.prepare(`
      SELECT DISTINCT circuit
      FROM profiles
      WHERE circuit IS NOT NULL AND circuit != ''
      ORDER BY circuit ASC
    `).all().map(row => row.circuit);
    
    // Get distinct vehicle makes
    const vehicleMakes = db.prepare(`
      SELECT DISTINCT vehicle_make
      FROM profiles
      WHERE vehicle_make IS NOT NULL AND vehicle_make != ''
      ORDER BY vehicle_make ASC
    `).all().map(row => row.vehicle_make);
    
    // Get distinct vehicle models
    const vehicleModels = db.prepare(`
      SELECT DISTINCT vehicle_model
      FROM profiles
      WHERE vehicle_model IS NOT NULL AND vehicle_model != ''
      ORDER BY vehicle_model ASC
    `).all().map(row => row.vehicle_model);
    
    console.log('✅ Filter options fetched:', {
      inspectors: inspectors.length,
      states: states.length,
      circuits: circuits.length,
      vehicleMakes: vehicleMakes.length,
      vehicleModels: vehicleModels.length
    });
    
    res.json({
      inspectors,
      states,
      cities: [], // City column doesn't exist in profiles table
      circuits,
      vehicleMakes,
      vehicleModels
    });
  } catch (error) {
    console.error('❌ Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
};

/**
 * Get comprehensive analytics overview
 */
exports.getAnalyticsOverview = (req, res) => {
  console.log('========================================');
  console.log('🚨 ANALYTICS OVERVIEW CALLED - VERSION 2026-01-23-2025');
  console.log('========================================');
  try {
    console.log('📊 Analytics overview requested');
    const { 
      startDate, 
      endDate, 
      inspectorId, 
      state, 
      circuit, 
      vehicleMake, 
      vehicleModel, 
      vehicleLicense 
    } = req.query;
    console.log('Date range:', { startDate, endDate });
    console.log('Filters:', { inspectorId, state, circuit, vehicleMake, vehicleModel, vehicleLicense });
    
    // Build filters
    let dateFilter = '';
    let advancedFilters = '';
    const dateParams = [];
    const filterParams = [];
    
    // Date filter
    if (startDate && endDate) {
      dateFilter = 'WHERE t.date BETWEEN ? AND ?';
      dateParams.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = 'WHERE t.date >= ?';
      dateParams.push(startDate);
    } else if (endDate) {
      dateFilter = 'WHERE t.date <= ?';
      dateParams.push(endDate);
    }
    
    // Advanced filters - build additional WHERE conditions
    const filterConditions = [];
    if (inspectorId) {
      filterConditions.push('t.user_id = ?');
      filterParams.push(inspectorId);
    }
    if (state) {
      filterConditions.push('p.state = ?');
      filterParams.push(state);
    }
    if (circuit) {
      filterConditions.push('p.circuit = ?');
      filterParams.push(circuit);
    }
    if (vehicleMake) {
      filterConditions.push('p.vehicle_make = ?');
      filterParams.push(vehicleMake);
    }
    if (vehicleModel) {
      filterConditions.push('p.vehicle_model = ?');
      filterParams.push(vehicleModel);
    }
    if (vehicleLicense) {
      filterConditions.push('p.vehicle_license LIKE ?');
      filterParams.push(`%${vehicleLicense}%`);
    }
    
    // Combine filters
    if (filterConditions.length > 0) {
      advancedFilters = (dateFilter ? ' AND ' : 'WHERE ') + filterConditions.join(' AND ');
    }
    
    const fullFilter = dateFilter + advancedFilters;
    const allParams = [...dateParams, ...filterParams];

    console.log('Step 1: Fetching total statistics...');
    // Total statistics - with JOIN to profiles for advanced filters
    const totalStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT t.id) as total_trips,
        COUNT(DISTINCT t.user_id) as active_inspectors,
        COALESCE(SUM(t.miles_calculated), 0) as total_miles,
        COALESCE(SUM(t.lodging_cost + t.meals_cost + t.other_expenses), 0) as total_expenses,
        COALESCE(AVG(t.miles_calculated), 0) as avg_miles_per_trip,
        COUNT(DISTINCT v.id) as total_vouchers,
        COALESCE(SUM(v.total_amount), 0) as total_reimbursements
      FROM trips t
      LEFT JOIN profiles p ON t.user_id = p.user_id
      LEFT JOIN voucher_trips vt ON t.id = vt.trip_id
      LEFT JOIN vouchers v ON vt.voucher_id = v.id
      ${fullFilter}
    `).get(...allParams);
    console.log('Total stats:', totalStats);

    console.log('Step 2: Fetching voucher status breakdown...');
    // Voucher status breakdown
    const vouchersByStatus = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM vouchers
      ${dateFilter ? dateFilter.replace('date', 'created_at').replace('t.', '') : ''}
      GROUP BY status
    `).all(...dateParams);
    console.log('Vouchers by status:', vouchersByStatus);

    console.log('Step 3: Fetching monthly trends...');
    // Monthly trends (last 12 months)
    const monthlyTrends = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        COUNT(DISTINCT id) as trip_count,
        COALESCE(SUM(miles_calculated), 0) as total_miles,
        COALESCE(SUM(lodging_cost + meals_cost + other_expenses), 0) as total_expenses
      FROM trips
      WHERE date >= date('now', '-12 months')
      GROUP BY month
      ORDER BY month ASC
    `).all();
    console.log('Monthly trends:', monthlyTrends.length, 'months');

    console.log('Step 4: Fetching top inspectors...');
    // Top inspectors by mileage - need to apply same filters
    let topInspectorsFilter = 'WHERE u.role = \'inspector\' OR u.role = \'supervisor\'';
    if (fullFilter) {
      // Add the filter conditions (without the WHERE keyword)
      topInspectorsFilter = fullFilter.replace(/^WHERE /, 'WHERE (') + ') AND (u.role = \'inspector\' OR u.role = \'supervisor\')';
    }
    
    const topInspectors = db.prepare(`
      SELECT 
        u.id,
        u.email,
        p.first_name,
        p.last_name,
        COUNT(DISTINCT t.id) as trip_count,
        COALESCE(SUM(t.miles_calculated), 0) as total_miles,
        COALESCE(SUM(t.lodging_cost + t.meals_cost + t.other_expenses), 0) as total_expenses
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN trips t ON u.id = t.user_id
      ${topInspectorsFilter}
      GROUP BY u.id
      ORDER BY total_miles DESC
      LIMIT 10
    `).all(...allParams);
    console.log('Top inspectors:', topInspectors.length);

    console.log('Step 5: Fetching approval metrics...');
    // Average approval time
    const approvalMetrics = db.prepare(`
      SELECT 
        AVG(JULIANDAY(supervisor_approved_at) - JULIANDAY(submitted_at)) * 24 as avg_supervisor_approval_hours,
        AVG(JULIANDAY(fleet_approved_at) - JULIANDAY(supervisor_approved_at)) * 24 as avg_fleet_approval_hours,
        AVG(JULIANDAY(fleet_approved_at) - JULIANDAY(submitted_at)) * 24 as avg_total_approval_hours
      FROM vouchers
      WHERE status = 'approved'
      ${dateFilter ? 'AND ' + dateFilter.replace('date', 'submitted_at').replace('t.', '') : ''}
    `).get(...dateParams);
    console.log('Approval metrics:', approvalMetrics);

    console.log('✅ Analytics data fetched successfully');
    res.json({
      totalStats,
      vouchersByStatus,
      monthlyTrends,
      topInspectors,
      approvalMetrics
    });
  } catch (error) {
    console.error('❌ Error fetching analytics overview:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch analytics overview', details: error.message });
  }
};

/**
 * Get monthly comparison data
 */
exports.getMonthlyComparison = (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    const data = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        COUNT(DISTINCT id) as trip_count,
        COUNT(DISTINCT user_id) as inspector_count,
        COALESCE(SUM(miles_calculated), 0) as total_miles,
        COALESCE(SUM(lodging_cost + meals_cost + other_expenses), 0) as total_expenses,
        COALESCE(AVG(miles_calculated), 0) as avg_miles
      FROM trips
      WHERE date >= date('now', '-' || ? || ' months')
      GROUP BY month
      ORDER BY month ASC
    `).all(months);

    res.json(data);
  } catch (error) {
    console.error('Error fetching monthly comparison:', error);
    res.status(500).json({ error: 'Failed to fetch monthly comparison' });
  }
};

/**
 * Get expense breakdown by category
 */
exports.getExpenseBreakdown = (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE t.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Mileage vs Other Expenses
    const breakdown = db.prepare(`
      SELECT 
        COALESCE(SUM(t.miles_calculated * 0.67), 0) as mileage_cost,
        COALESCE(SUM(t.expenses), 0) as other_expenses,
        COALESCE(SUM(v.total_lodging), 0) as lodging,
        COALESCE(SUM(v.total_meals), 0) as meals,
        COALESCE(SUM(v.total_other), 0) as other
      FROM trips t
      LEFT JOIN voucher_trips vt ON t.id = vt.trip_id
      LEFT JOIN vouchers v ON vt.voucher_id = v.id
      ${dateFilter}
    `).get(...params);

    res.json(breakdown);
  } catch (error) {
    console.error('Error fetching expense breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch expense breakdown' });
  }
};

/**
 * Get top routes/destinations
 */
exports.getTopRoutes = (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const routes = db.prepare(`
      SELECT 
        from_address,
        to_address,
        COUNT(*) as frequency,
        AVG(miles_calculated) as avg_miles,
        SUM(miles_calculated) as total_miles
      FROM trips
      WHERE from_address IS NOT NULL AND to_address IS NOT NULL
      GROUP BY from_address, to_address
      ORDER BY frequency DESC
      LIMIT ?
    `).all(limit);

    res.json(routes);
  } catch (error) {
    console.error('Error fetching top routes:', error);
    res.status(500).json({ error: 'Failed to fetch top routes' });
  }
};

/**
 * Get supervisor performance metrics
 */
exports.getSupervisorMetrics = (req, res) => {
  try {
    const metrics = db.prepare(`
      SELECT 
        u.id,
        u.email,
        p.first_name,
        p.last_name,
        COUNT(DISTINCT v.id) as vouchers_reviewed,
        COUNT(DISTINCT CASE WHEN v.status = 'supervisor_approved' OR v.status = 'approved' THEN v.id END) as vouchers_approved,
        COUNT(DISTINCT CASE WHEN v.status = 'rejected' THEN v.id END) as vouchers_rejected,
        AVG(CASE 
          WHEN v.supervisor_approved_at IS NOT NULL 
          THEN (JULIANDAY(v.supervisor_approved_at) - JULIANDAY(v.submitted_at)) * 24 
        END) as avg_approval_hours
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN vouchers v ON u.id = v.supervisor_id
      WHERE u.role = 'supervisor'
      GROUP BY u.id
      ORDER BY vouchers_reviewed DESC
    `).all();

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching supervisor metrics:', error);
    res.status(500).json({ error: 'Failed to fetch supervisor metrics' });
  }
};

/**
 * Generate custom report with filters
 */
exports.generateCustomReport = async (req, res) => {
  try {
    const { 
      reportType, 
      startDate, 
      endDate, 
      userId, 
      status,
      format = 'json' 
    } = req.query;

    let query = '';
    const params = [];
    let data = [];

    switch (reportType) {
      case 'trips':
        query = `
          SELECT 
            t.id,
            t.date,
            u.email as inspector_email,
            p.first_name || ' ' || p.last_name as inspector_name,
            t.from_address,
            t.to_address,
            t.site_name,
            t.purpose,
            t.miles_calculated,
            t.expenses,
            t.created_at
          FROM trips t
          LEFT JOIN users u ON t.user_id = u.id
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE 1=1
        `;
        
        if (startDate && endDate) {
          query += ' AND t.date BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
        if (userId) {
          query += ' AND t.user_id = ?';
          params.push(userId);
        }
        query += ' ORDER BY t.date DESC';
        break;

      case 'vouchers':
        query = `
          SELECT 
            v.id,
            v.month,
            v.year,
            u.email as inspector_email,
            p.first_name || ' ' || p.last_name as inspector_name,
            v.status,
            v.total_miles,
            v.total_amount,
            v.submitted_at,
            v.supervisor_approved_at,
            v.fleet_approved_at,
            s.email as supervisor_email,
            f.email as fleet_manager_email
          FROM vouchers v
          LEFT JOIN users u ON v.user_id = u.id
          LEFT JOIN profiles p ON u.id = p.user_id
          LEFT JOIN users s ON v.supervisor_id = s.id
          LEFT JOIN users f ON v.fleet_manager_id = f.id
          WHERE 1=1
        `;
        
        if (startDate && endDate) {
          query += ' AND v.created_at BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
        if (userId) {
          query += ' AND v.user_id = ?';
          params.push(userId);
        }
        if (status) {
          query += ' AND v.status = ?';
          params.push(status);
        }
        query += ' ORDER BY v.created_at DESC';
        break;

      case 'reimbursements':
        query = `
          SELECT 
            v.id as voucher_id,
            v.month,
            v.year,
            u.email as inspector_email,
            p.first_name || ' ' || p.last_name as inspector_name,
            v.total_miles,
            v.total_amount,
            v.total_lodging,
            v.total_meals,
            v.total_other,
            v.fleet_approved_at as approved_date
          FROM vouchers v
          LEFT JOIN users u ON v.user_id = u.id
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE v.status = 'approved'
        `;
        
        if (startDate && endDate) {
          query += ' AND v.fleet_approved_at BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
        if (userId) {
          query += ' AND v.user_id = ?';
          params.push(userId);
        }
        query += ' ORDER BY v.fleet_approved_at DESC';
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    data = db.prepare(query).all(...params);

    if (format === 'excel') {
      return await exportToExcel(data, reportType, res);
    }

    res.json(data);
  } catch (error) {
    console.error('Error generating custom report:', error);
    res.status(500).json({ error: 'Failed to generate custom report' });
  }
};

/**
 * Export data to Excel
 */
async function exportToExcel(data, reportType, res) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportType.charAt(0).toUpperCase() + reportType.slice(1));

    if (data.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data
    data.forEach(row => {
      worksheet.addRow(Object.values(row));
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export to Excel' });
  }
}

/**
 * Get year-over-year comparison
 */
exports.getYearOverYearComparison = (req, res) => {
  try {
    const data = db.prepare(`
      SELECT 
        strftime('%Y', date) as year,
        COUNT(DISTINCT id) as trip_count,
        COALESCE(SUM(miles_calculated), 0) as total_miles,
        COALESCE(SUM(lodging_cost + meals_cost + other_expenses), 0) as total_expenses,
        COUNT(DISTINCT user_id) as active_inspectors
      FROM trips
      WHERE date >= date('now', '-3 years')
      GROUP BY year
      ORDER BY year ASC
    `).all();

    res.json(data);
  } catch (error) {
    console.error('Error fetching year-over-year comparison:', error);
    res.status(500).json({ error: 'Failed to fetch year-over-year comparison' });
  }
};
