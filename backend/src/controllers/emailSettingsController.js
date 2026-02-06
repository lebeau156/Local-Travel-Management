const fs = require('fs');
const path = require('path');
const emailService = require('../utils/emailService');

const envPath = path.join(__dirname, '../../.env');

/**
 * Get current email settings (masked)
 */
exports.getEmailSettings = (req, res) => {
  try {
    const settings = {
      configured: emailService.isEmailConfigured(),
      host: process.env.SMTP_HOST || '',
      port: process.env.SMTP_PORT || '587',
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
      // Never send the actual password to frontend
      hasPassword: !!(process.env.SMTP_PASS)
    };

    res.json(settings);
  } catch (error) {
    console.error('Error fetching email settings:', error);
    res.status(500).json({ error: 'Failed to fetch email settings' });
  }
};

/**
 * Update email settings
 */
exports.updateEmailSettings = (req, res) => {
  try {
    const { host, port, secure, user, password, from } = req.body;

    // Validate required fields
    if (!host || !port || !user) {
      return res.status(400).json({ error: 'Host, port, and user are required' });
    }

    // Read current .env file
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Helper function to update or add env variable
    const updateEnvVar = (content, key, value) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`);
      } else {
        return content + `\n${key}=${value}`;
      }
    };

    // Update each setting
    envContent = updateEnvVar(envContent, 'SMTP_HOST', host);
    envContent = updateEnvVar(envContent, 'SMTP_PORT', port);
    envContent = updateEnvVar(envContent, 'SMTP_SECURE', secure ? 'true' : 'false');
    envContent = updateEnvVar(envContent, 'SMTP_USER', user);
    if (password) {
      envContent = updateEnvVar(envContent, 'SMTP_PASS', password);
    }
    envContent = updateEnvVar(envContent, 'SMTP_FROM', from || user);

    // Write back to .env file
    fs.writeFileSync(envPath, envContent.trim() + '\n');

    // Update process.env (will take effect on next server restart)
    process.env.SMTP_HOST = host;
    process.env.SMTP_PORT = port;
    process.env.SMTP_SECURE = secure ? 'true' : 'false';
    process.env.SMTP_USER = user;
    if (password) {
      process.env.SMTP_PASS = password;
    }
    process.env.SMTP_FROM = from || user;

    res.json({
      success: true,
      message: 'Email settings updated successfully. Server restart may be required for changes to take full effect.',
      configured: emailService.isEmailConfigured()
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({ error: 'Failed to update email settings' });
  }
};

/**
 * Send test email
 */
exports.sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    if (!emailService.isEmailConfigured()) {
      return res.status(400).json({ error: 'Email service is not configured. Please configure SMTP settings first.' });
    }

    const result = await emailService.testEmailConfiguration(email);

    if (result.success) {
      res.json({
        success: true,
        message: `Test email sent successfully to ${email}`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send test email'
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message || 'Failed to send test email' });
  }
};
