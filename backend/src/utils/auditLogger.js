const { db } = require('../models/database');

/**
 * Log user activity to audit_log table
 * @param {number} userId - User ID performing the action
 * @param {string} action - Action performed (e.g., 'CREATE_TRIP', 'APPROVE_VOUCHER')
 * @param {string} entityType - Type of entity (e.g., 'trip', 'voucher')
 * @param {number} entityId - ID of the affected entity
 * @param {object} details - Additional details about the action
 * @param {string} ipAddress - IP address of the user
 */
function logActivity({ userId, action, entityType, entityId, details = {}, ipAddress = null }) {
  try {
    const detailsJson = JSON.stringify(details);
    
    db.prepare(`
      INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, action, entityType, entityId, detailsJson, ipAddress);
    
    console.log(`📝 Audit: ${action} by user ${userId} on ${entityType} #${entityId}`);
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

/**
 * Get IP address from request
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         null;
}

/**
 * Simplified logging function (compatibility wrapper)
 * @param {number} userId - User ID performing the action
 * @param {string} action - Action performed
 * @param {string} entityType - Type of entity
 * @param {number} entityId - ID of the affected entity
 * @param {object} details - Additional details
 * @param {string} ipAddress - IP address
 */
function logAction(userId, action, entityType, entityId, details = {}, ipAddress = null) {
  return logActivity({ userId, action, entityType, entityId, details, ipAddress });
}

module.exports = {
  logActivity,
  logAction,
  getClientIp,
  
  // Action constants
  ACTIONS: {
    // Trip actions
    CREATE_TRIP: 'CREATE_TRIP',
    UPDATE_TRIP: 'UPDATE_TRIP',
    DELETE_TRIP: 'DELETE_TRIP',
    
    // Voucher actions
    CREATE_VOUCHER: 'CREATE_VOUCHER',
    SUBMIT_VOUCHER: 'SUBMIT_VOUCHER',
    APPROVE_VOUCHER_SUPERVISOR: 'APPROVE_VOUCHER_SUPERVISOR',
    APPROVE_VOUCHER_FLEET: 'APPROVE_VOUCHER_FLEET',
    REJECT_VOUCHER: 'REJECT_VOUCHER',
    REOPEN_VOUCHER: 'REOPEN_VOUCHER',
    DELETE_VOUCHER: 'DELETE_VOUCHER',
    DOWNLOAD_VOUCHER_PDF: 'DOWNLOAD_VOUCHER_PDF',
    EXPORT_VOUCHER_EXCEL: 'EXPORT_VOUCHER_EXCEL',
    
    // Profile actions
    UPDATE_PROFILE: 'UPDATE_PROFILE',
    
    // Export actions
    EXPORT_TRIPS_EXCEL: 'EXPORT_TRIPS_EXCEL',
    EXPORT_TRIPS_CSV: 'EXPORT_TRIPS_CSV',
    
    // Auth actions
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    REGISTER: 'REGISTER'
  }
};
