import React, { useState } from 'react';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import api from '../api/axios';

interface PlantImportData {
  est_number: string;
  est_name: string;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  circuit?: string;
  shift?: number;
  tour_of_duty?: string;
  assigned_inspector_email?: string;
  notes?: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ est_number: string; error: string }>;
}

const CircuitPlantsBulkImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [plants, setPlants] = useState<PlantImportData[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setErrors(['CSV file is empty or invalid']);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const parsedPlants: PlantImportData[] = [];
      const parseErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length < headers.length) {
          parseErrors.push(`Line ${i + 1}: Incomplete data`);
          continue;
        }

        const plant: any = {};
        headers.forEach((header, index) => {
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
          let value = values[index];

          // Map headers to expected field names
          if (normalizedHeader.includes('est') && normalizedHeader.includes('number')) {
            plant.est_number = value;
          } else if (normalizedHeader.includes('est') && normalizedHeader.includes('name')) {
            plant.est_name = value;
          } else if (normalizedHeader === 'address') {
            plant.address = value;
          } else if (normalizedHeader === 'city') {
            plant.city = value;
          } else if (normalizedHeader === 'state') {
            plant.state = value || 'NJ';
          } else if (normalizedHeader.includes('zip')) {
            plant.zip_code = value;
          } else if (normalizedHeader === 'circuit') {
            plant.circuit = value;
          } else if (normalizedHeader === 'shift') {
            plant.shift = value ? parseInt(value) : undefined;
          } else if (normalizedHeader.includes('tour')) {
            plant.tour_of_duty = value;
          } else if (normalizedHeader.includes('inspector') && normalizedHeader.includes('email')) {
            plant.assigned_inspector_email = value;
          } else if (normalizedHeader === 'notes') {
            plant.notes = value;
          }
        });

        // Validation
        if (!plant.est_number || !plant.est_name || !plant.address || !plant.city) {
          parseErrors.push(`Line ${i + 1}: Missing required fields (est_number, est_name, address, city)`);
          continue;
        }

        parsedPlants.push(plant);
      }

      setPlants(parsedPlants);
      setErrors(parseErrors);
    } catch (error) {
      setErrors(['Failed to parse CSV file. Please check the format.']);
    }
  };

  const handleImport = async () => {
    if (plants.length === 0) {
      setErrors(['No valid plants to import']);
      return;
    }

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      // Simulate progress for geocoding
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await api.post('/circuit-plants/bulk-import', {
        plants
      });

      clearInterval(progressInterval);
      setProgress(100);
      setResult(response.data);
    } catch (error: any) {
      setErrors([error.response?.data?.error || 'Import failed']);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Est #,Est. Name,Address,City,State,Zip,Circuit,Shift,Tour of duty,Assigned Inspector Email,Notes
M/P33789,United Premium Foods,1 Amboy Ave,Woodbridge,NJ,07095,8020-Elizabeth NJ,1,0700-1530,inspector@usda.gov,
G1610,Sample Plant,123 Main St,Elizabeth,NJ,07201,8020-Elizabeth NJ,2,1530-2400,,Sample notes`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'circuit_plants_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Upload className="w-8 h-8 text-blue-600" />
          Bulk Import Circuit Plants
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Import multiple circuit plants from a CSV file
        </p>
      </div>

      {/* Template Download */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Download Template First
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Download the CSV template to ensure your data is formatted correctly. 
              The template includes all required columns and example data.
            </p>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CSV Template
            </button>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          1. Upload CSV File
        </h2>
        
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <label className="cursor-pointer">
            <span className="text-blue-600 hover:text-blue-700 font-medium">
              Click to upload
            </span>
            <span className="text-gray-600 dark:text-gray-400"> or drag and drop</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            CSV files only
          </p>
        </div>

        {file && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{file.name}</span>
              <span className="text-sm">({plants.length} plants parsed)</span>
            </div>
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                Parsing Errors ({errors.length})
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                {errors.slice(0, 10).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {errors.length > 10 && (
                  <li className="text-red-600 dark:text-red-400">
                    ... and {errors.length - 10} more errors
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {plants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            2. Preview Data ({plants.length} plants)
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Est #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">City</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Circuit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Shift</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {plants.slice(0, 10).map((plant, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{plant.est_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{plant.est_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{plant.address}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{plant.city}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{plant.circuit}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{plant.shift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plants.length > 10 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                Showing first 10 of {plants.length} plants
              </p>
            )}
          </div>
        </div>
      )}

      {/* Import Button */}
      {plants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            3. Import Plants
          </h2>
          
          {importing && (
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Geocoding addresses and importing...
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing || plants.length === 0}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            {importing ? 'Importing...' : `Import ${plants.length} Plants`}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Import Results
          </h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.total}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Plants</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{result.success}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Successfully Imported</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{result.failed}</div>
              <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                Import Errors ({result.errors.length})
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                {result.errors.map((error, index) => (
                  <li key={index}>
                    <strong>{error.est_number}:</strong> {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.success > 0 && (
            <div className="mt-6">
              <a
                href="/supervisor/circuit-plants-map"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                View Plants on Map →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CircuitPlantsBulkImport;
