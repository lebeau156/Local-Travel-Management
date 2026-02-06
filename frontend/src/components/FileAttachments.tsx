import React, { useEffect, useState } from 'react';
import api from '../api/axios';

interface Attachment {
  id: number;
  entity_type: string;
  entity_id: number;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  uploaded_by_email?: string;
  uploaded_at: string;
  description: string | null;
}

interface FileAttachmentsProps {
  entityType: 'trip' | 'voucher';
  entityId: number;
  canUpload?: boolean;
  canDelete?: boolean;
}

const FileAttachments: React.FC<FileAttachmentsProps> = ({
  entityType,
  entityId,
  canUpload = true,
  canDelete = false
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAttachments();
  }, [entityType, entityId]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/attachments/${entityType}/${entityId}`);
      setAttachments(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId.toString());

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      await api.post('/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('File uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchAttachments();
      
      e.target.value = '';
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachmentId: number, fileName: string) => {
    try {
      const response = await api.get(`/attachments/${attachmentId}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to download file');
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      setError('');
      await api.delete(`/attachments/${attachmentId}`);
      setSuccess('File deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchAttachments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  if (loading) {
    return <div className="text-gray-500">Loading attachments...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
          {success}
        </div>
      )}

      {canUpload && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id={`file-upload-${entityType}-${entityId}`}
          />
          <label
            htmlFor={`file-upload-${entityType}-${entityId}`}
            className={`block text-center cursor-pointer ${uploading ? 'opacity-50' : ''}`}
          >
            <div className="text-gray-600 mb-2">
              {uploading ? 'Uploading...' : 'Click to upload file'}
            </div>
            <div className="text-xs text-gray-500">
              PDF, Images, Word, Excel files (max 10MB)
            </div>
          </label>
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-4">
          No attachments yet
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded p-3"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">
                  {getFileIcon(attachment.mime_type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {attachment.original_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(attachment.file_size)} • 
                    Uploaded {new Date(attachment.uploaded_at).toLocaleDateString()} by {attachment.uploaded_by_email || 'User'}
                  </div>
                  {attachment.description && (
                    <div className="text-xs text-gray-600 mt-1">
                      {attachment.description}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleDownload(attachment.id, attachment.original_name)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  title="Download"
                >
                  ⬇️
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                    title="Delete"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileAttachments;


