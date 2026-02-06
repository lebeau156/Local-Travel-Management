const { db } = require('../models/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

// Upload directory
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Get allowed file types from system config
  const config = db.prepare(`
    SELECT config_value FROM system_config WHERE config_key = 'allowed_file_types'
  `).get();
  
  const allowedTypes = config ? config.config_value.split(',') : ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'xls', 'xlsx'];
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB default (will check config too)
  }
});

/**
 * Upload file attachment
 */
exports.uploadFile = upload.single('file');

/**
 * Save attachment metadata to database
 */
exports.saveAttachment = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { entityType, entityId, description } = req.body;

    if (!entityType || !entityId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Entity type and ID are required' });
    }

    // Validate entity exists
    let entityExists = false;
    if (entityType === 'trip') {
      entityExists = db.prepare('SELECT id FROM trips WHERE id = ?').get(entityId);
    } else if (entityType === 'voucher') {
      entityExists = db.prepare('SELECT id FROM vouchers WHERE id = ?').get(entityId);
    }

    if (!entityExists) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: `${entityType} not found` });
    }

    const result = db.prepare(`
      INSERT INTO attachments (
        entity_type, entity_id, file_name, original_name, 
        file_path, file_size, mime_type, uploaded_by, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entityType,
      entityId,
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      req.user.id,
      description || null
    );

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'File uploaded successfully',
      attachment: {
        ...attachment,
        file_path: undefined, // Don't expose full path
        url: `/api/attachments/${attachment.id}/download`
      }
    });
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to clean up file:', e);
      }
    }
    console.error('Error saving attachment:', error);
    res.status(500).json({ error: 'Failed to save attachment' });
  }
};

/**
 * Get attachments for entity
 */
exports.getAttachments = (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const attachments = db.prepare(`
      SELECT 
        a.*,
        u.email as uploaded_by_email
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.entity_type = ? AND a.entity_id = ?
      ORDER BY a.uploaded_at DESC
    `).all(entityType, entityId);

    // Add download URLs and remove file paths
    const formattedAttachments = attachments.map(att => ({
      ...att,
      file_path: undefined,
      url: `/api/attachments/${att.id}/download`,
      thumbnail: att.mime_type.startsWith('image/') ? `/api/attachments/${att.id}/thumbnail` : null
    }));

    res.json(formattedAttachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
};

/**
 * Download attachment
 */
exports.downloadAttachment = (req, res) => {
  try {
    const { id } = req.params;

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check if file exists
    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(attachment.file_path, attachment.original_name);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
};

/**
 * Delete attachment
 */
exports.deleteAttachment = (req, res) => {
  try {
    const { id } = req.params;

    const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check permissions (owner or admin)
    if (attachment.uploaded_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete file from disk
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    // Delete from database
    db.prepare('DELETE FROM attachments WHERE id = ?').run(id);

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
};

/**
 * Get attachment stats
 */
exports.getAttachmentStats = (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        AVG(file_size) as avg_size,
        COUNT(DISTINCT entity_id) as entities_with_files
      FROM attachments
    `).get();

    const byType = db.prepare(`
      SELECT 
        entity_type,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM attachments
      GROUP BY entity_type
    `).all();

    res.json({
      ...stats,
      by_type: byType
    });
  } catch (error) {
    console.error('Error fetching attachment stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

module.exports = {
  ...exports,
  upload
};
