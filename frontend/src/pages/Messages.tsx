import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  subject: string;
  message: string;
  is_read: number;
  parent_message_id: number | null;
  created_at: string;
  read_at: string | null;
  sender_email?: string;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_position?: string;
  recipient_email?: string;
  recipient_first_name?: string;
  recipient_last_name?: string;
  recipient_position?: string;
}

interface User {
  id: number;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  position?: string;
}

const Messages: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Compose form state
  const [composeForm, setComposeForm] = useState({
    recipient_id: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  useEffect(() => {
    if (showComposeModal) {
      fetchUsers();
    }
  }, [showComposeModal, searchTerm]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'inbox' ? '/messages/inbox' : '/messages/sent';
      const response = await api.get(endpoint);
      setMessages(response.data);
    } catch (err: any) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/messages/users', {
        params: { search: searchTerm }
      });
      setUsers(response.data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!composeForm.recipient_id || !composeForm.subject || !composeForm.message) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await api.post('/messages', {
        recipient_id: parseInt(composeForm.recipient_id),
        subject: composeForm.subject,
        message: composeForm.message,
        parent_message_id: selectedMessage?.id || null,
      });

      setSuccess('Message sent successfully');
      setShowComposeModal(false);
      setComposeForm({ recipient_id: '', subject: '', message: '' });
      setSelectedMessage(null);
      fetchMessages();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleViewMessage = async (message: Message) => {
    try {
      const response = await api.get(`/messages/${message.id}`);
      setSelectedMessage(response.data);
      
      // Refresh messages list to update read status
      if (activeTab === 'inbox') {
        fetchMessages();
      }
    } catch (err: any) {
      setError('Failed to load message');
      console.error('Error fetching message:', err);
    }
  };

  const handleReply = () => {
    if (!selectedMessage) return;

    setComposeForm({
      recipient_id: selectedMessage.sender_id.toString(),
      subject: `Re: ${selectedMessage.subject}`,
      message: `\n\n---\nOn ${new Date(selectedMessage.created_at).toLocaleString()}, ${selectedMessage.sender_first_name} ${selectedMessage.sender_last_name} wrote:\n${selectedMessage.message}`,
    });
    setShowComposeModal(true);
  };

  const handleDelete = async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await api.delete(`/messages/${messageId}`);
      setSuccess('Message deleted');
      setSelectedMessage(null);
      fetchMessages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to delete message');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleMarkAsUnread = async (messageId: number) => {
    try {
      await api.patch(`/messages/${messageId}/unread`);
      fetchMessages();
    } catch (err: any) {
      setError('Failed to mark as unread');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getDisplayName = (message: Message, isSender: boolean = false) => {
    if (isSender) {
      const firstName = message.sender_first_name || '';
      const lastName = message.sender_last_name || '';
      return firstName && lastName ? `${firstName} ${lastName}` : message.sender_email;
    } else {
      const firstName = message.recipient_first_name || '';
      const lastName = message.recipient_last_name || '';
      return firstName && lastName ? `${firstName} ${lastName}` : message.recipient_email;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Internal communication system</p>
        </div>
        <button
          onClick={() => {
            setSelectedMessage(null);
            setComposeForm({ recipient_id: '', subject: '', message: '' });
            setShowComposeModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <span>✍️</span>
          Compose Message
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'inbox'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📥 Inbox
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📤 Sent
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {activeTab === 'inbox' ? 'No messages in inbox' : 'No sent messages'}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                onClick={() => handleViewMessage(message)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !message.is_read && activeTab === 'inbox' ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {!message.is_read && activeTab === 'inbox' && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                      <span className="font-semibold text-gray-900">
                        {activeTab === 'inbox' 
                          ? getDisplayName(message, true)
                          : `To: ${getDisplayName(message, false)}`}
                      </span>
                      {(activeTab === 'inbox' ? message.sender_position : message.recipient_position) && (
                        <span className="text-xs text-gray-500">
                          ({activeTab === 'inbox' ? message.sender_position : message.recipient_position})
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-medium text-gray-800">{message.subject}</div>
                    <div className="mt-1 text-sm text-gray-600 truncate">
                      {message.message.substring(0, 100)}
                      {message.message.length > 100 && '...'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 ml-4">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                  <div className="mt-2 text-sm text-gray-600">
                    <div>From: {getDisplayName(selectedMessage, true)} ({selectedMessage.sender_email})</div>
                    <div>To: {getDisplayName(selectedMessage, false)} ({selectedMessage.recipient_email})</div>
                    <div>Date: {new Date(selectedMessage.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="prose max-w-none whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
              {activeTab === 'inbox' && (
                <>
                  <button
                    onClick={handleReply}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ↩️ Reply
                  </button>
                  {selectedMessage.is_read && (
                    <button
                      onClick={() => handleMarkAsUnread(selectedMessage.id)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Mark as Unread
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => handleDelete(selectedMessage.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => setSelectedMessage(null)}
                className="ml-auto bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Compose Message</h2>
                <button
                  onClick={() => {
                    setShowComposeModal(false);
                    setComposeForm({ recipient_id: '', subject: '', message: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To: *
                </label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                />
                {searchTerm && users.length > 0 && (
                  <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          setComposeForm({ ...composeForm, recipient_id: user.id.toString() });
                          setSearchTerm(`${user.first_name || ''} ${user.last_name || ''} (${user.email})`);
                        }}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.email} {user.position && `• ${user.position}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject: *
                </label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter subject..."
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message: *
                </label>
                <textarea
                  value={composeForm.message}
                  onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={8}
                  placeholder="Type your message..."
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  📧 Send Message
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowComposeModal(false);
                    setComposeForm({ recipient_id: '', subject: '', message: '' });
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
