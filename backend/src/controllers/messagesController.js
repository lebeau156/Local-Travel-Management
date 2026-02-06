const { db } = require('../models/database');

// Get inbox messages for current user
exports.getInbox = (req, res) => {
  try {
    const userId = req.user.id;
    
    const messages = db.prepare(`
      SELECT 
        m.*,
        sender.email as sender_email,
        sender_profile.first_name as sender_first_name,
        sender_profile.last_name as sender_last_name,
        sender_profile.position as sender_position
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN profiles sender_profile ON sender.id = sender_profile.user_id
      WHERE m.recipient_id = ?
      ORDER BY m.created_at DESC
    `).all(userId);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Get sent messages for current user
exports.getSent = (req, res) => {
  try {
    const userId = req.user.id;
    
    const messages = db.prepare(`
      SELECT 
        m.*,
        recipient.email as recipient_email,
        recipient_profile.first_name as recipient_first_name,
        recipient_profile.last_name as recipient_last_name,
        recipient_profile.position as recipient_position
      FROM messages m
      JOIN users recipient ON m.recipient_id = recipient.id
      LEFT JOIN profiles recipient_profile ON recipient.id = recipient_profile.user_id
      WHERE m.sender_id = ?
      ORDER BY m.created_at DESC
    `).all(userId);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
};

// Get single message by ID
exports.getMessage = (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const message = db.prepare(`
      SELECT 
        m.*,
        sender.email as sender_email,
        sender_profile.first_name as sender_first_name,
        sender_profile.last_name as sender_last_name,
        sender_profile.position as sender_position,
        recipient.email as recipient_email,
        recipient_profile.first_name as recipient_first_name,
        recipient_profile.last_name as recipient_last_name,
        recipient_profile.position as recipient_position
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users recipient ON m.recipient_id = recipient.id
      LEFT JOIN profiles sender_profile ON sender.id = sender_profile.user_id
      LEFT JOIN profiles recipient_profile ON recipient.id = recipient_profile.user_id
      WHERE m.id = ? AND (m.sender_id = ? OR m.recipient_id = ?)
    `).get(messageId, userId, userId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Mark as read if user is the recipient and message is unread
    if (message.recipient_id === userId && !message.is_read) {
      db.prepare(`
        UPDATE messages 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(messageId);
      message.is_read = 1;
      message.read_at = new Date().toISOString();
    }

    res.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
};

// Send a new message
exports.sendMessage = (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipient_id, subject, message, parent_message_id } = req.body;

    // Validate inputs
    if (!recipient_id || !subject || !message) {
      return res.status(400).json({ error: 'Recipient, subject, and message are required' });
    }

    // Check if recipient exists
    const recipientExists = db.prepare('SELECT id FROM users WHERE id = ?').get(recipient_id);
    if (!recipientExists) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Insert message
    const result = db.prepare(`
      INSERT INTO messages (sender_id, recipient_id, subject, message, parent_message_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(senderId, recipient_id, subject, message, parent_message_id || null);

    // Fetch the created message with sender details
    const newMessage = db.prepare(`
      SELECT 
        m.*,
        sender.email as sender_email,
        sender_profile.first_name as sender_first_name,
        sender_profile.last_name as sender_last_name,
        recipient.email as recipient_email,
        recipient_profile.first_name as recipient_first_name,
        recipient_profile.last_name as recipient_last_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users recipient ON m.recipient_id = recipient.id
      LEFT JOIN profiles sender_profile ON sender.id = sender_profile.user_id
      LEFT JOIN profiles recipient_profile ON recipient.id = recipient_profile.user_id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Mark message as read
exports.markAsRead = (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    // Verify user is the recipient
    const message = db.prepare('SELECT recipient_id FROM messages WHERE id = ?').get(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.recipient_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.prepare(`
      UPDATE messages 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(messageId);

    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

// Mark message as unread
exports.markAsUnread = (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    // Verify user is the recipient
    const message = db.prepare('SELECT recipient_id FROM messages WHERE id = ?').get(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.recipient_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.prepare(`
      UPDATE messages 
      SET is_read = 0, read_at = NULL 
      WHERE id = ?
    `).run(messageId);

    res.json({ success: true, message: 'Message marked as unread' });
  } catch (error) {
    console.error('Error marking message as unread:', error);
    res.status(500).json({ error: 'Failed to mark message as unread' });
  }
};

// Delete a message
exports.deleteMessage = (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    // Verify user is sender or recipient
    const message = db.prepare('SELECT sender_id, recipient_id FROM messages WHERE id = ?').get(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender_id !== userId && message.recipient_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.prepare('DELETE FROM messages WHERE id = ?').run(messageId);

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Get unread count for current user
exports.getUnreadCount = (req, res) => {
  try {
    const userId = req.user.id;

    const result = db.prepare(`
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE recipient_id = ? AND is_read = 0
    `).get(userId);

    res.json({ count: result.count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Get list of users to message (for user search)
exports.getUserList = (req, res) => {
  try {
    const currentUserId = req.user.id;
    const searchTerm = req.query.search || '';

    let query = `
      SELECT 
        u.id,
        u.email,
        u.role,
        p.first_name,
        p.last_name,
        p.position
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id != ?
    `;

    const params = [currentUserId];

    if (searchTerm) {
      query += ` AND (
        u.email LIKE ? OR 
        p.first_name LIKE ? OR 
        p.last_name LIKE ? OR
        p.position LIKE ?
      )`;
      const likeTerm = `%${searchTerm}%`;
      params.push(likeTerm, likeTerm, likeTerm, likeTerm);
    }

    query += ` ORDER BY p.last_name, p.first_name LIMIT 50`;

    const users = db.prepare(query).all(...params);

    res.json(users);
  } catch (error) {
    console.error('Error fetching user list:', error);
    res.status(500).json({ error: 'Failed to fetch user list' });
  }
};
