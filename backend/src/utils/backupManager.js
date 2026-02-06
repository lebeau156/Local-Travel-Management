const fs = require('fs');
const path = require('path');
const { db } = require('../models/database');

// Backup directory
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create a database backup
 * @returns {Object} Backup information
 */
function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `database_backup_${timestamp}.sqlite`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    const sourcePath = path.join(__dirname, '../../database.sqlite');

    // Copy database file
    fs.copyFileSync(sourcePath, backupPath);

    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    // Get record counts
    const counts = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      trips: db.prepare('SELECT COUNT(*) as count FROM trips').get().count,
      vouchers: db.prepare('SELECT COUNT(*) as count FROM vouchers').get().count,
      auditLogs: db.prepare('SELECT COUNT(*) as count FROM audit_log').get().count
    };

    console.log(`✅ Backup created: ${backupFileName} (${fileSizeKB} KB)`);

    return {
      success: true,
      fileName: backupFileName,
      filePath: backupPath,
      size: fileSizeKB,
      timestamp: new Date().toISOString(),
      counts
    };
  } catch (error) {
    console.error('❌ Backup creation failed:', error);
    throw new Error(`Backup failed: ${error.message}`);
  }
}

/**
 * List all available backups
 * @returns {Array} List of backup files
 */
function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return [];
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('database_backup_') && file.endsWith('.sqlite'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        return {
          fileName: file,
          filePath: filePath,
          size: (stats.size / 1024).toFixed(2), // KB
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime()); // Newest first

    return files;
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
    throw new Error(`Failed to list backups: ${error.message}`);
  }
}

/**
 * Restore database from backup
 * @param {string} backupFileName - Name of backup file to restore
 * @returns {Object} Restore information
 */
function restoreBackup(backupFileName) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    const dbPath = path.join(__dirname, '../../database.sqlite');

    // Verify backup file exists
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }

    // Create a safety backup of current database before restoring
    const safetyBackupName = `pre_restore_safety_${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
    const safetyBackupPath = path.join(BACKUP_DIR, safetyBackupName);
    fs.copyFileSync(dbPath, safetyBackupPath);

    // Restore the backup
    fs.copyFileSync(backupPath, dbPath);

    console.log(`✅ Database restored from: ${backupFileName}`);
    console.log(`📦 Safety backup created: ${safetyBackupName}`);

    return {
      success: true,
      restoredFrom: backupFileName,
      safetyBackup: safetyBackupName,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw new Error(`Restore failed: ${error.message}`);
  }
}

/**
 * Delete a backup file
 * @param {string} backupFileName - Name of backup file to delete
 * @returns {Object} Delete information
 */
function deleteBackup(backupFileName) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Verify file exists
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }

    // Delete the file
    fs.unlinkSync(backupPath);

    console.log(`🗑️  Backup deleted: ${backupFileName}`);

    return {
      success: true,
      deletedFile: backupFileName,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Delete failed:', error);
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Clean up old backups (keep only recent ones)
 * @param {number} keepCount - Number of recent backups to keep
 * @returns {Object} Cleanup information
 */
function cleanupOldBackups(keepCount = 10) {
  try {
    const backups = listBackups();
    
    if (backups.length <= keepCount) {
      return {
        success: true,
        deletedCount: 0,
        message: `Only ${backups.length} backups exist, keeping all`
      };
    }

    const toDelete = backups.slice(keepCount);
    let deletedCount = 0;

    toDelete.forEach(backup => {
      try {
        fs.unlinkSync(backup.filePath);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete ${backup.fileName}:`, err);
      }
    });

    console.log(`🧹 Cleaned up ${deletedCount} old backups`);

    return {
      success: true,
      deletedCount,
      remainingCount: backups.length - deletedCount,
      message: `Deleted ${deletedCount} old backups, keeping ${keepCount} most recent`
    };
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw new Error(`Cleanup failed: ${error.message}`);
  }
}

/**
 * Export database as JSON (for manual backup/analysis)
 * @returns {Object} Database export
 */
function exportDatabaseAsJSON() {
  try {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      users: db.prepare('SELECT * FROM users').all(),
      profiles: db.prepare('SELECT * FROM profiles').all(),
      trips: db.prepare('SELECT * FROM trips').all(),
      vouchers: db.prepare('SELECT * FROM vouchers').all(),
      auditLogs: db.prepare('SELECT * FROM audit_log').all()
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFileName = `database_export_${timestamp}.json`;
    const jsonPath = path.join(BACKUP_DIR, jsonFileName);

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

    const stats = fs.statSync(jsonPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✅ JSON export created: ${jsonFileName} (${fileSizeKB} KB)`);

    return {
      success: true,
      fileName: jsonFileName,
      filePath: jsonPath,
      size: fileSizeKB,
      recordCounts: {
        users: data.users.length,
        profiles: data.profiles.length,
        trips: data.trips.length,
        vouchers: data.vouchers.length,
        auditLogs: data.auditLogs.length
      }
    };
  } catch (error) {
    console.error('❌ JSON export failed:', error);
    throw new Error(`JSON export failed: ${error.message}`);
  }
}

/**
 * Get backup statistics
 * @returns {Object} Backup stats
 */
function getBackupStats() {
  try {
    const backups = listBackups();
    const totalSize = backups.reduce((sum, b) => sum + parseFloat(b.size), 0);
    
    return {
      totalBackups: backups.length,
      totalSizeKB: totalSize.toFixed(2),
      totalSizeMB: (totalSize / 1024).toFixed(2),
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
      newestBackup: backups.length > 0 ? backups[0].created : null,
      backupDirectory: BACKUP_DIR
    };
  } catch (error) {
    console.error('❌ Failed to get stats:', error);
    throw new Error(`Failed to get stats: ${error.message}`);
  }
}

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  cleanupOldBackups,
  exportDatabaseAsJSON,
  getBackupStats,
  BACKUP_DIR
};
