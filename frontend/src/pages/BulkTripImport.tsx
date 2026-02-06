import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: ValidationError[];
  imported?: any[];
  validRows?: number;
  rowCount?: number;
  invalidRows?: number;
  failed?: number;
  preview?: any[];
}

const BulkTripImport: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dryRun, setDryRun] = useState(true);

  // Allow all authenticated users to import their own trips
  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Access Denied: Please login to import trips.
        </div>
      </div>
    );
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess('');
    setValidationErrors([]);
    setImportResult(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/csv/template', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'trip_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Template downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Template download error:', err);
      
      // Handle blob error response
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const errorData = JSON.parse(text);
          setError(errorData.error || 'Failed to download template');
        } catch {
          setError('Failed to download template - please check your connection');
        }
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to download template');
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dryRun', dryRun.toString());

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setValidationErrors([]);

      const response = await api.post('/csv/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResult(response.data);

      console.log('Import response:', response.data);
      console.log('Validation errors:', response.data.errors);

      if (response.data.invalidRows > 0 || response.data.errors?.length > 0) {
        setValidationErrors(response.data.errors || []);
        setError(`Found ${response.data.invalidRows || response.data.errors.length} validation errors. Please fix them and try again.`);
        
        // Log each error for debugging
        response.data.errors?.forEach((err: any) => {
          console.log(`Row ${err.row}, Field: ${err.field}, Error: ${err.message}`);
        });
      } else if (dryRun) {
        setSuccess(`Validation successful! ${response.data.rowCount} trips ready to import. Uncheck "Dry Run" to complete the import.`);
      } else {
        setSuccess(`Successfully imported ${response.data.imported} trips!`);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import trips');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError('');
    setSuccess('');
    setValidationErrors([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Trip Import</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Import multiple trips at once from a CSV file. All imported trips will be created under your account.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Step 1: Download Template</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Download the CSV template with the correct format and column headers.
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Download CSV Template
          </button>
        </div>

        <div className="border-t dark:border-gray-700 pt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Step 2: Upload CSV File</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Fill in the template with your trip data and upload it below.
          </p>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
              id="file-upload"
            />
            
            {file ? (
              <div className="space-y-2">
                <div className="text-green-600 dark:text-green-400 font-semibold">{file.name}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">{(file.size / 1024).toFixed(2)} KB</div>
                <button
                  onClick={handleReset}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm underline"
                >
                  Choose different file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-gray-600 dark:text-gray-300">
                  Drag and drop your CSV file here, or
                </div>
                <label
                  htmlFor="file-upload"
                  className="inline-block cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Browse Files
                </label>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="dry-run"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="dry-run" className="text-gray-700 dark:text-gray-300">
                  Dry Run (validate only, don't import)
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="bg-green-600 dark:bg-green-500 text-white px-6 py-2 rounded hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
                >
                  {loading ? 'Processing...' : dryRun ? 'Validate CSV' : 'Import Trips'}
                </button>
                <button
                  onClick={handleReset}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {importResult && (
        <div className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Import Results</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="text-green-700 font-semibold">Valid Rows</div>
              <div className="text-3xl font-bold text-green-600">
                {importResult.validRows || importResult.rowCount || importResult.imported || 0}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="text-red-700 font-semibold">Errors</div>
              <div className="text-3xl font-bold text-red-600">
                {importResult.invalidRows || importResult.failed || validationErrors.length || 0}
              </div>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-700">Validation Errors</h3>
              <div className="bg-red-50 border border-red-200 rounded p-4 max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-red-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-700 uppercase">Row</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-700 uppercase">Field</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-700 uppercase">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-200">
                    {validationErrors.map((err, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-red-900">{err.row}</td>
                        <td className="px-4 py-2 text-sm text-red-900 font-medium">{err.field}</td>
                        <td className="px-4 py-2 text-sm text-red-900">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {importResult.preview && importResult.preview.length > 0 && dryRun && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-green-700">Preview (First 10 Trips)</h3>
              <div className="bg-green-50 border border-green-200 rounded p-4 max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-green-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase">From</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase">To</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase">Site</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase">Purpose</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-green-700 uppercase">Expenses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-200">
                    {importResult.preview.slice(0, 10).map((trip: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-green-900">{trip.date}</td>
                        <td className="px-4 py-2 text-sm text-green-900">{trip.from_address}</td>
                        <td className="px-4 py-2 text-sm text-green-900">{trip.to_address}</td>
                        <td className="px-4 py-2 text-sm text-green-900">{trip.site_name || '-'}</td>
                        <td className="px-4 py-2 text-sm text-green-900">{trip.purpose || '-'}</td>
                        <td className="px-4 py-2 text-sm text-green-900">${trip.expenses || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">CSV Format Requirements:</h3>
        <ul className="list-disc list-inside text-blue-800 dark:text-blue-300 space-y-1 text-sm">
          <li>Required columns: date, from_address, to_address</li>
          <li>Optional columns: site_name, purpose, expenses, expense_notes</li>
          <li>Date format: YYYY-MM-DD (e.g., 2026-01-15)</li>
          <li>Expenses must be a positive number (optional)</li>
          <li>Mileage defaults to 50 miles and will be calculated by Google Maps integration</li>
          <li>Download the template below to see the exact format</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkTripImport;


