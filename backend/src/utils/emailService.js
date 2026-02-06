const nodemailer = require('nodemailer');
const { db } = require('../models/database');

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (!transporter && emailConfig.auth.user && emailConfig.auth.pass) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
}

/**
 * Check if email service is configured
 */
function isEmailConfigured() {
  return !!(emailConfig.auth.user && emailConfig.auth.pass);
}

/**
 * Send email
 * @param {Object} options - Email options (to, subject, html, text)
 */
async function sendEmail(options) {
  try {
    if (!isEmailConfigured()) {
      console.log('⚠️  Email not configured - skipping email send');
      return { success: false, message: 'Email service not configured' };
    }

    const transport = getTransporter();
    if (!transport) {
      console.log('⚠️  Email transport not available');
      return { success: false, message: 'Email transport not available' };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || emailConfig.auth.user,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      to: options.to
    };
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user email by user ID
 */
function getUserEmail(userId) {
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
  return user?.email;
}

/**
 * Get user profile information
 */
function getUserProfile(userId) {
  const result = db.prepare(`
    SELECT u.email, u.role, p.first_name, p.last_name
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.id = ?
  `).get(userId);
  
  return result;
}

/**
 * Send voucher submission notification to supervisor
 */
async function notifyVoucherSubmitted(voucherId, inspectorId, supervisorId) {
  try {
    const inspector = getUserProfile(inspectorId);
    const supervisor = getUserProfile(supervisorId);
    const voucher = db.prepare(`
      SELECT v.*, 
             (SELECT COUNT(*) FROM voucher_trips WHERE voucher_id = v.id) as trip_count
      FROM vouchers v 
      WHERE v.id = ?
    `).get(voucherId);

    if (!supervisor?.email) {
      console.log('⚠️  Supervisor email not found');
      return { success: false };
    }

    const inspectorName = `${inspector.first_name || ''} ${inspector.last_name || ''}`.trim() || inspector.email;
    const supervisorName = `${supervisor.first_name || ''} ${supervisor.last_name || ''}`.trim() || 'Supervisor';

    const subject = `New Voucher Submitted for Review - ${voucher.month}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🚗 New Travel Voucher Submitted</h2>
        <p>Hello ${supervisorName},</p>
        <p><strong>${inspectorName}</strong> has submitted a travel voucher for your review.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Voucher Details</h3>
          <p><strong>Month:</strong> ${voucher.month}</p>
          <p><strong>Trips:</strong> ${voucher.trip_count}</p>
          <p><strong>Total Mileage:</strong> ${voucher.total_miles} miles</p>
          <p><strong>Total Amount:</strong> $${parseFloat(voucher.total_amount).toFixed(2)}</p>
          <p><strong>Submitted:</strong> ${new Date(voucher.submitted_at).toLocaleString()}</p>
        </div>

        <p>Please review and approve or reject this voucher at your earliest convenience.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from the USDA Travel Voucher System.</p>
        </div>
      </div>
    `;

    const text = `
New Travel Voucher Submitted

Hello ${supervisorName},

${inspectorName} has submitted a travel voucher for your review.

Voucher Details:
- Month: ${voucher.month}
- Trips: ${voucher.trip_count}
- Total Mileage: ${voucher.total_miles} miles
- Total Amount: $${parseFloat(voucher.total_amount).toFixed(2)}
- Submitted: ${new Date(voucher.submitted_at).toLocaleString()}

Please review and approve or reject this voucher at your earliest convenience.

This is an automated notification from the USDA Travel Voucher System.
    `;

    return await sendEmail({
      to: supervisor.email,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('❌ Failed to send voucher submission notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send supervisor approval notification to fleet manager
 */
async function notifySupervisorApproved(voucherId, inspectorId, supervisorId) {
  try {
    const inspector = getUserProfile(inspectorId);
    const supervisor = getUserProfile(supervisorId);
    const voucher = db.prepare(`
      SELECT v.*, 
             (SELECT COUNT(*) FROM voucher_trips WHERE voucher_id = v.id) as trip_count
      FROM vouchers v 
      WHERE v.id = ?
    `).get(voucherId);

    // Get all fleet managers
    const fleetManagers = db.prepare('SELECT email FROM users WHERE role = ?').all('fleet_manager');
    
    if (fleetManagers.length === 0) {
      console.log('⚠️  No fleet managers found');
      return { success: false };
    }

    const inspectorName = `${inspector.first_name || ''} ${inspector.last_name || ''}`.trim() || inspector.email;
    const supervisorName = `${supervisor.first_name || ''} ${supervisor.last_name || ''}`.trim() || supervisor.email;
    const fleetEmails = fleetManagers.map(fm => fm.email).join(', ');

    const subject = `Voucher Approved by Supervisor - Awaiting Final Approval - ${voucher.month}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">✅ Voucher Approved by Supervisor</h2>
        <p>Hello Fleet Manager,</p>
        <p>A travel voucher has been approved by the supervisor and is now awaiting your final approval.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Voucher Details</h3>
          <p><strong>Inspector:</strong> ${inspectorName}</p>
          <p><strong>Supervisor:</strong> ${supervisorName}</p>
          <p><strong>Month:</strong> ${voucher.month}</p>
          <p><strong>Trips:</strong> ${voucher.trip_count}</p>
          <p><strong>Total Mileage:</strong> ${voucher.total_miles} miles</p>
          <p><strong>Total Amount:</strong> $${parseFloat(voucher.total_amount).toFixed(2)}</p>
          <p><strong>Supervisor Approved:</strong> ${new Date(voucher.supervisor_approved_at).toLocaleString()}</p>
        </div>

        <p>Please review and provide final approval for this voucher.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from the USDA Travel Voucher System.</p>
        </div>
      </div>
    `;

    const text = `
Voucher Approved by Supervisor

Hello Fleet Manager,

A travel voucher has been approved by the supervisor and is now awaiting your final approval.

Voucher Details:
- Inspector: ${inspectorName}
- Supervisor: ${supervisorName}
- Month: ${voucher.month}
- Trips: ${voucher.trip_count}
- Total Mileage: ${voucher.total_miles} miles
- Total Amount: $${parseFloat(voucher.total_amount).toFixed(2)}
- Supervisor Approved: ${new Date(voucher.supervisor_approved_at).toLocaleString()}

Please review and provide final approval for this voucher.

This is an automated notification from the USDA Travel Voucher System.
    `;

    return await sendEmail({
      to: fleetEmails,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('❌ Failed to send supervisor approval notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send final approval notification to inspector and supervisor
 */
async function notifyVoucherApproved(voucherId, inspectorId, supervisorId, fleetManagerId) {
  try {
    const inspector = getUserProfile(inspectorId);
    const supervisor = getUserProfile(supervisorId);
    const fleetManager = getUserProfile(fleetManagerId);
    const voucher = db.prepare(`
      SELECT v.*, 
             (SELECT COUNT(*) FROM voucher_trips WHERE voucher_id = v.id) as trip_count
      FROM vouchers v 
      WHERE v.id = ?
    `).get(voucherId);

    if (!inspector?.email) {
      console.log('⚠️  Inspector email not found');
      return { success: false };
    }

    const inspectorName = `${inspector.first_name || ''} ${inspector.last_name || ''}`.trim() || inspector.email;
    const supervisorName = `${supervisor.first_name || ''} ${supervisor.last_name || ''}`.trim() || supervisor.email;
    const fleetManagerName = `${fleetManager.first_name || ''} ${fleetManager.last_name || ''}`.trim() || fleetManager.email;

    // Send to both inspector and supervisor
    const recipients = [inspector.email];
    if (supervisor?.email && supervisor.email !== inspector.email) {
      recipients.push(supervisor.email);
    }

    const subject = `✅ Voucher Fully Approved - ${voucher.month}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">🎉 Voucher Fully Approved</h2>
        <p>Hello ${inspectorName},</p>
        <p>Great news! Your travel voucher has been fully approved and is now being processed for reimbursement.</p>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #374151;">Voucher Details</h3>
          <p><strong>Month:</strong> ${voucher.month}</p>
          <p><strong>Trips:</strong> ${voucher.trip_count}</p>
          <p><strong>Total Mileage:</strong> ${voucher.total_miles} miles</p>
          <p><strong>Total Reimbursement:</strong> $${parseFloat(voucher.total_amount).toFixed(2)}</p>
          <p><strong>Approved by Supervisor:</strong> ${supervisorName}</p>
          <p><strong>Approved by Fleet Manager:</strong> ${fleetManagerName}</p>
          <p><strong>Final Approval Date:</strong> ${new Date(voucher.fleet_approved_at).toLocaleString()}</p>
        </div>

        <p>Your reimbursement will be processed according to standard payment schedules.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from the USDA Travel Voucher System.</p>
        </div>
      </div>
    `;

    const text = `
Voucher Fully Approved

Hello ${inspectorName},

Great news! Your travel voucher has been fully approved and is now being processed for reimbursement.

Voucher Details:
- Month: ${voucher.month}
- Trips: ${voucher.trip_count}
- Total Mileage: ${voucher.total_miles} miles
- Total Reimbursement: $${parseFloat(voucher.total_amount).toFixed(2)}
- Approved by Supervisor: ${supervisorName}
- Approved by Fleet Manager: ${fleetManagerName}
- Final Approval Date: ${new Date(voucher.fleet_approved_at).toLocaleString()}

Your reimbursement will be processed according to standard payment schedules.

This is an automated notification from the USDA Travel Voucher System.
    `;

    return await sendEmail({
      to: recipients.join(', '),
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('❌ Failed to send approval notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send rejection notification to inspector
 */
async function notifyVoucherRejected(voucherId, inspectorId, rejectedById) {
  try {
    const inspector = getUserProfile(inspectorId);
    const rejectedBy = getUserProfile(rejectedById);
    const voucher = db.prepare(`
      SELECT v.*, 
             (SELECT COUNT(*) FROM voucher_trips WHERE voucher_id = v.id) as trip_count
      FROM vouchers v 
      WHERE v.id = ?
    `).get(voucherId);

    if (!inspector?.email) {
      console.log('⚠️  Inspector email not found');
      return { success: false };
    }

    const inspectorName = `${inspector.first_name || ''} ${inspector.last_name || ''}`.trim() || inspector.email;
    const rejectorName = `${rejectedBy.first_name || ''} ${rejectedBy.last_name || ''}`.trim() || rejectedBy.email;
    const rejectorRole = rejectedBy.role === 'fleet_manager' ? 'Fleet Manager' : 'Supervisor';

    const subject = `❌ Voucher Rejected - Action Required - ${voucher.month}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">❌ Voucher Rejected</h2>
        <p>Hello ${inspectorName},</p>
        <p>Your travel voucher has been rejected by the ${rejectorRole} and requires your attention.</p>
        
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin-top: 0; color: #374151;">Voucher Details</h3>
          <p><strong>Month:</strong> ${voucher.month}</p>
          <p><strong>Trips:</strong> ${voucher.trip_count}</p>
          <p><strong>Total Mileage:</strong> ${voucher.total_miles} miles</p>
          <p><strong>Total Amount:</strong> $${parseFloat(voucher.total_amount).toFixed(2)}</p>
          <p><strong>Rejected by:</strong> ${rejectorName} (${rejectorRole})</p>
          ${voucher.rejection_reason ? `<p><strong>Reason:</strong> ${voucher.rejection_reason}</p>` : ''}
        </div>

        <div style="background-color: #fef9c3; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #854d0e;">⚠️ Action Required</h3>
          <p>Please review the rejection reason, make necessary corrections, and resubmit the voucher.</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from the USDA Travel Voucher System.</p>
        </div>
      </div>
    `;

    const text = `
Voucher Rejected - Action Required

Hello ${inspectorName},

Your travel voucher has been rejected by the ${rejectorRole} and requires your attention.

Voucher Details:
- Month: ${voucher.month}
- Trips: ${voucher.trip_count}
- Total Mileage: ${voucher.total_miles} miles
- Total Amount: $${parseFloat(voucher.total_amount).toFixed(2)}
- Rejected by: ${rejectorName} (${rejectorRole})
${voucher.rejection_reason ? `- Reason: ${voucher.rejection_reason}` : ''}

Action Required:
Please review the rejection reason, make necessary corrections, and resubmit the voucher.

This is an automated notification from the USDA Travel Voucher System.
    `;

    return await sendEmail({
      to: inspector.email,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('❌ Failed to send rejection notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test email configuration
 */
async function testEmailConfiguration(testEmail) {
  try {
    const subject = 'Test Email - USDA Travel Voucher System';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📧 Email Configuration Test</h2>
        <p>This is a test email to verify your email configuration is working correctly.</p>
        <p>If you received this email, your SMTP settings are properly configured!</p>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;">✅ Email service is operational</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>Sent from USDA Travel Voucher System</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    const text = `
Email Configuration Test

This is a test email to verify your email configuration is working correctly.

If you received this email, your SMTP settings are properly configured!

✅ Email service is operational

Sent from USDA Travel Voucher System
Time: ${new Date().toLocaleString()}
    `;

    return await sendEmail({
      to: testEmail,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendEmail,
  isEmailConfigured,
  notifyVoucherSubmitted,
  notifySupervisorApproved,
  notifyVoucherApproved,
  notifyVoucherRejected,
  testEmailConfiguration
};
