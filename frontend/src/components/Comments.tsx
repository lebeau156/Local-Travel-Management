import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Comment {
  id: number;
  entity_type: string;
  entity_id: number;
  user_id: number;
  parent_id: number | null;
  comment_text: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  replies?: Comment[];
}

interface CommentsProps {
  entityType: 'trip' | 'voucher';
  entityId: number;
}

export default function Comments({ entityType, entityId }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetchComments();
  }, [entityType, entityId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/comments/${entityType}/${entityId}`);
      setComments(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post(`/comments/${entityType}/${entityId}`, {
        comment_text: newComment
      });
      setNewComment('');
      fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post comment');
    }
  };

  const handleReply = async (parentId: number) => {
    if (!replyText.trim()) return;

    try {
      await api.post(`/comments/${entityType}/${entityId}`, {
        comment_text: replyText,
        parent_id: parentId
      });
      setReplyText('');
      setReplyTo(null);
      fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to post reply');
    }
  };

  const handleEdit = async (id: number) => {
    if (!editText.trim()) return;

    try {
      await api.put(`/comments/${id}`, {
        comment_text: editText
      });
      setEditingId(null);
      setEditText('');
      fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update comment');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/comments/${id}`);
      fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const isAuthor = user?.id === comment.user_id;
    const isAdmin = user?.role === 'admin';
    const canEdit = isAuthor || isAdmin;

    return (
      <div className={`${depth > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {comment.first_name[0]}{comment.last_name[0]}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {comment.first_name} {comment.last_name}
                  <span className="ml-2 text-xs text-gray-500">
                    ({comment.role})
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(comment.created_at)}
                  {comment.updated_at !== comment.created_at && ' (edited)'}
                </div>
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditText(comment.comment_text);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {editingId === comment.id ? (
            <div className="mt-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit(comment.id)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditText('');
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.comment_text}</p>
              <button
                onClick={() => {
                  setReplyTo(comment.id);
                  setReplyText('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 mt-2"
              >
                💬 Reply
              </button>
            </>
          )}

          {replyTo === comment.id && (
            <div className="mt-3 bg-white rounded p-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText('');
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-600 dark:text-gray-300">Loading comments...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Comments & Notes ({comments.length})
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment or note..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Post Comment
        </button>
      </form>

      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}


