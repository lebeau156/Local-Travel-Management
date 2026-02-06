const db = require('../models/database').db;

exports.getComments = (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    const comments = db.prepare(`
      SELECT 
        c.*,
        COALESCE(p.first_name, u.email) as first_name,
        COALESCE(p.last_name, '') as last_name,
        u.email,
        u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE c.entity_type = ? AND c.entity_id = ?
      ORDER BY c.created_at ASC
    `).all(entityType, entityId);

    const buildCommentTree = (comments, parentId = null) => {
      return comments
        .filter(c => c.parent_id === parentId)
        .map(comment => ({
          ...comment,
          replies: buildCommentTree(comments, comment.id)
        }));
    };

    const tree = buildCommentTree(comments);

    res.json(tree);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

exports.createComment = (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { comment_text, parent_id } = req.body;

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const insert = db.prepare(`
      INSERT INTO comments (entity_type, entity_id, user_id, parent_id, comment_text, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const result = insert.run(
      entityType,
      parseInt(entityId),
      req.user.id,
      parent_id || null,
      comment_text.trim()
    );

    const comment = db.prepare(`
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

exports.updateComment = (req, res) => {
  try {
    const { id } = req.params;
    const { comment_text } = req.body;

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }

    db.prepare(`
      UPDATE comments 
      SET comment_text = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(comment_text.trim(), id);

    const updated = db.prepare(`
      SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id);

    res.json(updated);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

exports.deleteComment = (req, res) => {
  try {
    const { id } = req.params;

    const comment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};
