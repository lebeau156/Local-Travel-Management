# Email Notification System - Complete Guide

## Overview

The email notification system automatically sends email alerts to relevant users when voucher status changes occur. This ensures timely communication and smooth approval workflows.

## Features Implemented

### ✅ 1. Email Service (`backend/src/utils/emailService.js`)

**Core Functions:**
- `sendEmail()` - Send email via SMTP
- `isEmailConfigured()` - Check if SMTP is configured
- `testEmailConfiguration()` - Send test email

**Notification Functions:**
- `notifyVoucherSubmitted()` - When inspector submits voucher → supervisor
- `notifySupervisorApproved()` - When supervisor approves → fleet managers
- `notifyVoucherApproved()` - When fleet manager approves → inspector + supervisor
- `notifyVoucherRejected()` - When voucher rejected → inspector

### ✅ 2. Email Templates

All emails include:
- Professional HTML formatting
- Plain text fallback
- Color-coded status indicators
- Complete voucher details
- Action guidance

**Templates:**

#### Voucher Submitted (Blue)
- **Recipient:** Assigned supervisor
- **Content:** Inspector name, voucher month, trips count, total mileage/amount
- **CTA:** Review and approve

#### Supervisor Approved (Green)
- **Recipient:** All fleet managers
- **Content:** Inspector, supervisor, voucher details
- **CTA:** Provide final approval

#### Fully Approved (Green with celebration)
- **Recipients:** Inspector + supervisor
- **Content:** Complete approval chain, reimbursement amount
- **CTA:** Payment processing notice

#### Rejected (Red)
- **Recipient:** Inspector
- **Content:** Rejector name/role, rejection reason, voucher details
- **CTA:** Make corrections and resubmit

### ✅ 3. Integration Points

**Backend Controller Updates (`backend/src/controllers/voucherController.js`):**

1. **submitVoucher (Line 222-226)**
   ```javascript
   const inspector = db.prepare('SELECT assigned_supervisor_id FROM users WHERE id = ?').get(req.user.id);
   if (inspector?.assigned_supervisor_id) {
     emailService.notifyVoucherSubmitted(id, req.user.id, inspector.assigned_supervisor_id)
       .catch(err => console.error('Email notification failed:', err));
   }
   ```

2. **approveVoucherAsSupervisor (Line 535-536)**
   ```javascript
   emailService.notifySupervisorApproved(id, voucher.user_id, req.user.id)
     .catch(err => console.error('Email notification failed:', err));
   ```

3. **approveVoucherAsFleetManager (Line 629-630)**
   ```javascript
   emailService.notifyVoucherApproved(id, voucher.user_id, voucher.supervisor_id, req.user.id)
     .catch(err => console.error('Email notification failed:', err));
   ```

4. **rejectVoucher (Line 707-708)**
   ```javascript
   emailService.notifyVoucherRejected(id, voucher.user_id, req.user.id)
     .catch(err => console.error('Email notification failed:', err));
   ```

### ✅ 4. Admin Configuration UI

**Email Settings Page (`frontend/src/pages/EmailSettings.tsx`):**

Features:
- SMTP configuration form (host, port, secure, user, password, from)
- Configuration status indicator
- Test email functionality
- Masked password field
- Helpful guidance and tips

**API Endpoints (`backend/src/routes/admin.js`):**
- `GET /api/admin/email-settings` - Fetch current settings (masked)
- `PUT /api/admin/email-settings` - Update SMTP configuration
- `POST /api/admin/email-settings/test` - Send test email

**Controller (`backend/src/controllers/emailSettingsController.js`):**
- Reads/writes `.env` file
- Updates process.env variables
- Sends test emails
- Validates configuration

### ✅ 5. Navigation Integration

**Admin Menu (`frontend/src/components/Layout.tsx`):**
- Added "Email Settings" 📧 link to admin navigation

**Routing (`frontend/src/App.tsx`):**
- Added route: `/admin/email-settings`

## Configuration

### Environment Variables (.env)

Add these to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@yourdomain.com
```

### Gmail Setup (Recommended)

1. **Enable 2-Step Verification:**
   - Go to Google Account settings
   - Security → 2-Step Verification → Turn On

2. **Create App Password:**
   - Google Account → Security → 2-Step Verification
   - Scroll to "App passwords"
   - Select app: "Mail", device: "Other (Custom name)"
   - Copy the 16-character password

3. **Use in Configuration:**
   - SMTP_HOST: `smtp.gmail.com`
   - SMTP_PORT: `587`
   - SMTP_SECURE: `false`
   - SMTP_USER: Your Gmail address
   - SMTP_PASS: The 16-character app password

### Alternative SMTP Providers

**Microsoft Outlook/Office365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Amazon SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

## Usage

### Initial Setup

1. **Login as Admin**
2. **Navigate to Email Settings**
   - Dashboard → Email Settings (📧)

3. **Configure SMTP**
   - Enter SMTP host, port, username, password
   - Check "Use SSL/TLS" if using port 465
   - Optionally set custom "From" address
   - Click "Save Settings"

4. **Test Configuration**
   - Enter test email address
   - Click "Send Test Email"
   - Check inbox for test message

### Automatic Notifications

Once configured, emails are sent automatically:

| Event | Trigger | Recipient | Email Type |
|-------|---------|-----------|------------|
| Inspector submits voucher | `POST /api/vouchers/:id/submit` | Assigned supervisor | Voucher Submitted |
| Supervisor approves | `PUT /api/vouchers/:id/approve-supervisor` | All fleet managers | Supervisor Approved |
| Fleet manager approves | `PUT /api/vouchers/:id/approve-fleet` | Inspector + supervisor | Fully Approved |
| Rejection (any level) | `PUT /api/vouchers/:id/reject` | Inspector | Rejected |

### Graceful Degradation

If email is **not configured**:
- System continues to function normally
- Email sends are skipped silently
- Console logs show: `⚠️ Email not configured - skipping email send`
- No errors thrown

If email **send fails**:
- Error logged to console
- Request continues successfully
- No impact on voucher status updates

## Testing

### 1. Test Email Configuration

```bash
# Admin UI → Email Settings → Test Email
# OR via API:
curl -X POST http://localhost:5000/api/admin/email-settings/test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"recipient@example.com"}'
```

### 2. Test Voucher Submitted Notification

1. Login as inspector
2. Create trips for a month
3. Create voucher from trips
4. Submit voucher
5. Check supervisor's email

### 3. Test Supervisor Approval Notification

1. Login as supervisor
2. Approve a submitted voucher
3. Check fleet manager's email

### 4. Test Fleet Manager Approval Notification

1. Login as fleet manager
2. Approve a supervisor-approved voucher
3. Check inspector's and supervisor's email

### 5. Test Rejection Notification

1. Login as supervisor or fleet manager
2. Reject a voucher with reason
3. Check inspector's email

## Troubleshooting

### Email Not Sending

**Check Configuration:**
```bash
# Verify .env file exists and has correct values
cat backend/.env | grep SMTP
```

**Check Console Logs:**
- Look for `✅ Email sent:` (success)
- Look for `❌ Email send failed:` (error)
- Look for `⚠️ Email not configured` (not set up)

**Common Issues:**

1. **Gmail "Less secure apps" error**
   - Solution: Use app-specific password, not account password

2. **Port blocked by firewall**
   - Try port 587 (TLS) or 465 (SSL)
   - Check corporate firewall settings

3. **Authentication failed**
   - Verify username/password are correct
   - Check if 2FA is enabled (requires app password)

4. **SSL/TLS mismatch**
   - Port 587 → SMTP_SECURE=false
   - Port 465 → SMTP_SECURE=true

### Email Sent but Not Received

1. **Check spam folder**
2. **Check email logs** in console for messageId
3. **Verify recipient email** is correct in database
4. **Check SMTP provider** for delivery issues

### Configuration Not Saving

1. **Check file permissions** on `.env` file
2. **Verify admin role** on logged-in user
3. **Check server logs** for write errors

## Security Considerations

### ✅ Implemented

1. **Admin-only access** - Only admins can view/edit email settings
2. **Password masking** - Passwords never sent to frontend
3. **Optional password update** - Can update settings without changing password
4. **Secure storage** - Passwords stored in `.env` file (git-ignored)

### 🔒 Best Practices

1. **Use app-specific passwords** - Never use main account password
2. **Restrict .env file** - Set proper file permissions (600)
3. **Use dedicated email** - Create separate email account for system notifications
4. **Enable monitoring** - Monitor email service for abuse
5. **Rate limiting** - Consider adding rate limits for email sends

## Files Created/Modified

### New Files

1. `backend/src/utils/emailService.js` - Email service utility
2. `backend/src/controllers/emailSettingsController.js` - Settings controller
3. `frontend/src/pages/EmailSettings.tsx` - Settings UI
4. `EMAIL_NOTIFICATIONS_GUIDE.md` - This documentation

### Modified Files

1. `backend/src/controllers/voucherController.js` - Added email triggers
2. `backend/src/routes/admin.js` - Added email settings routes
3. `frontend/src/App.tsx` - Added email settings route
4. `frontend/src/components/Layout.tsx` - Added email settings to admin menu

## Next Steps

### Optional Enhancements

1. **Email Templates Customization**
   - Add UI to customize email templates
   - Support for multiple languages

2. **Email Queue**
   - Implement job queue for reliable delivery
   - Retry failed sends

3. **Email Preferences**
   - Allow users to opt-in/opt-out of notifications
   - Choose notification frequency

4. **Email Analytics**
   - Track email open rates
   - Monitor delivery success/failures

5. **Rich Notifications**
   - Add PDF attachments (voucher reports)
   - Include action buttons (Approve/Reject links)

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify email configuration in admin panel
3. Test with test email function
4. Review this documentation

---

**Status:** ✅ Fully Implemented and Ready for Use

**Version:** 1.0.0

**Last Updated:** January 2026
