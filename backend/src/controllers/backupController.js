const backupManager = require('../utils/backupManager');
const path = require('path');

// Create backup
exports.createBackup = (req, res) => {
  try {
    const result = backupManager.createBackup();
    res.json({
      success: true,
      message: 'Backup created successfully',
      backup: result
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: error.message });
  }
};

// List all backups
exports.listBackups = (req, res) => {
  try {
    const backups = backupManager.listBackups();
    const stats = backupManager.getBackupStats();
    
    res.json({
      success: true,
      backups,
      stats
    });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Download backup file
exports.downloadBackup = (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(backupManager.BACKUP_DIR, fileName);
    
    // Security check: ensure file exists and is in backup directory
    const backups = backupManager.listBackups();
    const backupExists = backups.some(b => b.fileName === fileName);
    
    if (!backupExists) {
      return res.status(404).json({ error: 'Backup file not found' });
    }

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download backup' });
      }
    });
  } catch (error) {
    console.error('Download backup error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Restore from backup
exports.restoreBackup = (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ error: 'Backup file name is required' });
    }

    const result = backupManager.restoreBackup(fileName);
    
    res.json({
      success: true,
      message: 'Database restored successfully. Server will restart...',
      restore: result
    });

    // Restart server after 2 seconds to reload database
    setTimeout(() => {
      console.log('🔄 Restarting server after database restore...');
      process.exit(0); // PM2 or similar will auto-restart
    }, 2000);
    
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete backup
exports.deleteBackup = (req, res) => {
  try {
    const { fileName } = req.params;
    const result = backupManager.deleteBackup(fileName);
    
    res.json({
      success: true,
      message: 'Backup deleted successfully',
      delete: result
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Cleanup old backups
exports.cleanupBackups = (req, res) => {
  try {
    const { keepCount } = req.body;
    const count = parseInt(keepCount) || 10;
    
    const result = backupManager.cleanupOldBackups(count);
    
    res.json({
      success: true,
      message: result.message,
      cleanup: result
    });
  } catch (error) {
    console.error('Cleanup backups error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export as JSON
exports.exportJSON = (req, res) => {
  try {
    const result = backupManager.exportDatabaseAsJSON();
    
    res.json({
      success: true,
      message: 'JSON export created successfully',
      export: result
    });
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Download JSON export
exports.downloadJSON = (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(backupManager.BACKUP_DIR, fileName);
    
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download JSON error:', err);
        res.status(500).json({ error: 'Failed to download JSON export' });
      }
    });
  } catch (error) {
    console.error('Download JSON error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get backup statistics
exports.getStats = (req, res) => {
  try {
    const stats = backupManager.getBackupStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
};
