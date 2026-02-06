const { db } = require('../models/database');

// Get audit logs with filters
exports.getAuditLogs = (req, res) => {
  try {
    const { limit = 100, offset = 0, action, entityType, userId, startDate, endDate } = req.query;
    
    let query = `
      SELECT al.*, u.email as user_email, p.first_name, p.last_name
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN profiles p ON al.user_id = p.user_id
      WHERE 1=1
    `;
    const params = [];

    // Filter by action
    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }

    // Filter by entity type
    if (entityType) {
      query += ' AND al.resource_type = ?';
      params.push(entityType);
    }

    // Filter by user (admin/supervisor can see all, inspectors see only their own)
    if (req.user.role === 'inspector') {
      query += ' AND al.user_id = ?';
      params.push(req.user.id);
    } else if (userId) {
      query += ' AND al.user_id = ?';
      params.push(userId);
    }

    // Filter by date range
    if (startDate) {
      query += ' AND DATE(al.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(al.created_at) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = db.prepare(query).all(...params);

    // Parse JSON details
    const logsWithParsedDetails = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM audit_log al WHERE 1=1';
    const countParams = [];
    if (action) {
      countQuery += ' AND action = ?';
      countParams.push(action);
    }
    if (entityType) {
      countQuery += ' AND resource_type = ?';
      countParams.push(entityType);
    }
    if (req.user.role === 'inspector') {
      countQuery += ' AND user_id = ?';
      countParams.push(req.user.id);
    } else if (userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(userId);
    }
    if (startDate) {
      countQuery += ' AND DATE(created_at) >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ' AND DATE(created_at) <= ?';
      countParams.push(endDate);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({
      logs: logsWithParsedDetails,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// Get audit log statistics
exports.getAuditStats = (req, res) => {
  try {
    // Get stats for current user or all users (based on role)
    let userFilter = '';
    const params = [];
    
    if (req.user.role === 'inspector') {
      userFilter = 'WHERE user_id = ?';
      params.push(req.user.id);
    }

    const stats = {
      totalActions: db.prepare(`SELECT COUNT(*) as count FROM audit_log ${userFilter}`).get(...params).count,
      
      actionsByType: db.prepare(`
        SELECT action, COUNT(*) as count 
        FROM audit_log ${userFilter}
        GROUP BY action 
        ORDER BY count DESC 
        LIMIT 10
      `).all(...params),
      
      recentActivity: db.prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM audit_log ${userFilter}
        WHERE created_at >= datetime('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `).all(...params),
      
      entityTypes: db.prepare(`
        SELECT resource_type, COUNT(*) as count 
        FROM audit_log ${userFilter}
        GROUP BY resource_type
      `).all(...params)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
};
