import React, { useState } from 'react';
import { Download, Upload, Users, FileText, Check, X, Plus } from 'lucide-react';

const CSVImportSystem = () => {
  const [attendees, setAttendees] = useState([]);
  const [importStatus, setImportStatus] = useState('idle'); // idle, importing, success, error
  const [validationErrors, setValidationErrors] = useState([]);

  // Generate sample CSV data for testing
  const generateTestData = () => {
    const testAttendees = [
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@email.com',
        ticket_type: 'VIP Tasting',
        order_id: 'EB-001-2024',
        phone: '+1-555-0101'
      },
      {
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'michael.chen@email.com',
        ticket_type: 'Standard Tasting',
        order_id: 'EB-002-2024',
        phone: '+1-555-0102'
      },
      {
        first_name: 'Emma',
        last_name: 'Rodriguez',
        email: 'emma.rodriguez@email.com',
        ticket_type: 'Premium Tasting',
        order_id: 'EB-003-2024',
        phone: '+1-555-0103'
      },
      {
        first_name: 'David',
        last_name: 'Thompson',
        email: 'david.thompson@email.com',
        ticket_type: 'VIP Tasting',
        order_id: 'EB-004-2024',
        phone: '+1-555-0104'
      },
      {
        first_name: 'Lisa',
        last_name: 'Anderson',
        email: 'lisa.anderson@email.com',
        ticket_type: 'Standard Tasting',
        order_id: 'EB-005-2024',
        phone: '+1-555-0105'
      },
      {
        first_name: 'James',
        last_name: 'Wilson',
        email: 'james.wilson@email.com',
        ticket_type: 'Premium Tasting',
        order_id: 'EB-006-2024',
        phone: '+1-555-0106'
      },
      {
        first_name: 'Maria',
        last_name: 'Garcia',
        email: 'maria.garcia@email.com',
        ticket_type: 'VIP Tasting',
        order_id: 'EB-007-2024',
        phone: '+1-555-0107'
      },
      {
        first_name: 'Robert',
        last_name: 'Davis',
        email: 'robert.davis@email.com',
        ticket_type: 'Standard Tasting',
        order_id: 'EB-008-2024',
        phone: '+1-555-0108'
      },
      {
        first_name: 'Jennifer',
        last_name: 'Miller',
        email: 'jennifer.miller@email.com',
        ticket_type: 'Premium Tasting',
        order_id: 'EB-009-2024',
        phone: '+1-555-0109'
      },
      {
        first_name: 'Christopher',
        last_name: 'Brown',
        email: 'christopher.brown@email.com',
        ticket_type: 'VIP Tasting',
        order_id: 'EB-010-2024',
        phone: '+1-555-0110'
      }
    ];

    setAttendees(testAttendees);
    setImportStatus('success');
    setValidationErrors([]);
  };

  // Download sample CSV template
  const downloadTemplate = () => {
    const headers = ['first_name', 'last_name', 'email', 'ticket_type', 'order_id', 'phone'];
    const sampleData = [
      'John,Doe,john.doe@email.com,Standard Tasting,EB-SAMPLE-001,+1-555-0000',
      'Jane,Smith,jane.smith@email.com,VIP Tasting,EB-SAMPLE-002,+1-555-0001'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eventbrite_attendees_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Parse CSV content
  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      
      row.rowIndex = index + 2; // +2 because index starts at 0 and we skip header
      return row;
    });

    return data;
  };

  // Validate attendee data
  const validateAttendees = (data) => {
    const errors = [];
    const requiredFields = ['first_name', 'last_name', 'email'];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    data.forEach((attendee, index) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (!attendee[field] || attendee[field].trim() === '') {
          errors.push({
            row: attendee.rowIndex,
            field: field,
            message: `${field.replace('_', ' ')} is required`,
            type: 'error'
          });
        }
      });

      // Validate email format
      if (attendee.email && !emailRegex.test(attendee.email)) {
        errors.push({
          row: attendee.rowIndex,
          field: 'email',
          message: 'Invalid email format',
          type: 'error'
        });
      }

      // Check for duplicate emails
      const duplicates = data.filter(other => 
        other.email === attendee.email && other.rowIndex !== attendee.rowIndex
      );
      if (duplicates.length > 0) {
        errors.push({
          row: attendee.rowIndex,
          field: 'email',
          message: `Duplicate email found (also in row ${duplicates[0].rowIndex})`,
          type: 'warning'
        });
      }
    });

    return errors;
  };

  // Handle CSV file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportStatus('importing');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const parsedData = parseCSV(csvText);
        const errors = validateAttendees(parsedData);
        
        setAttendees(parsedData);
        setValidationErrors(errors);
        setImportStatus(errors.some(e => e.type === 'error') ? 'error' : 'success');
      } catch (error) {
        setValidationErrors([{
          row: 0,
          field: 'file',
          message: 'Failed to parse CSV file. Please check the format.',
          type: 'error'
        }]);
        setImportStatus('error');
      }
    };
    
    reader.readAsText(file);
  };

  // Simulate creating profiles in database
  const createTempProfiles = async () => {
    if (validationErrors.some(e => e.type === 'error')) {
      alert('Please fix validation errors before creating profiles');
      return;
    }

    try {
      // Import the helper function
      const { createTempProfiles: createTempProfilesHelper } = await import('./supabaseHelpers');
      
      // You would pass the actual event ID here
      const eventId = 'your-event-id-here'; // Replace with actual event ID
      
      const { data, error } = await createTempProfilesHelper(attendees, eventId);
      
      if (error) {
        alert('Error creating profiles: ' + error.message);
        return;
      }
      
      alert(`Successfully created ${attendees.length} temporary user profiles!`);
      
    } catch (error) {
      console.error('Error importing helper function:', error);
      alert('Error creating profiles. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Eventbrite Attendee Import</h2>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            <Download size={20} />
            Download CSV Template
          </button>
          
          <button
            onClick={generateTestData}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            <Users size={20} />
            Generate Test Data (10 users)
          </button>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
            <Upload size={20} />
            Upload CSV File
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Import Status */}
        {importStatus !== 'idle' && (
          <div className={`mb-6 p-4 rounded-lg border ${
            importStatus === 'importing' ? 'bg-blue-50 border-blue-200' :
            importStatus === 'success' ? 'bg-green-50 border-green-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {importStatus === 'importing' && (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-blue-800">Processing CSV file...</span>
                </>
              )}
              {importStatus === 'success' && (
                <>
                  <Check size={20} className="text-green-600" />
                  <span className="text-green-800">
                    Successfully imported {attendees.length} attendees
                    {validationErrors.length > 0 && ` (${validationErrors.length} warnings)`}
                  </span>
                </>
              )}
              {importStatus === 'error' && (
                <>
                  <X size={20} className="text-red-600" />
                  <span className="text-red-800">Import failed - please check errors below</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-3">Validation Issues:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <div key={index} className={`text-sm ${
                  error.type === 'error' ? 'text-red-700' : 'text-orange-700'
                }`}>
                  <span className="font-medium">Row {error.row}:</span> {error.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendees Table */}
        {attendees.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Imported Attendees ({attendees.length})
              </h3>
              <button
                onClick={createTempProfiles}
                disabled={validationErrors.some(e => e.type === 'error')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Plus size={20} />
                Create Temp Profiles
              </button>
            </div>
            
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Ticket Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Order ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {attendees.map((attendee, index) => {
                    const hasError = validationErrors.some(
                      e => e.row === attendee.rowIndex && e.type === 'error'
                    );
                    const hasWarning = validationErrors.some(
                      e => e.row === attendee.rowIndex && e.type === 'warning'
                    );
                    
                    return (
                      <tr key={index} className={`${
                        hasError ? 'bg-red-50' : hasWarning ? 'bg-orange-50' : 'bg-white'
                      }`}>
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {attendee.first_name} {attendee.last_name}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">{attendee.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{attendee.ticket_type}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{attendee.order_id}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{attendee.phone}</td>
                        <td className="px-4 py-3 text-sm">
                          {hasError && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                              <X size={12} />
                              Error
                            </span>
                          )}
                          {hasWarning && !hasError && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">
                              ⚠️ Warning
                            </span>
                          )}
                          {!hasError && !hasWarning && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                              <Check size={12} />
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instructions */}
        {attendees.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
            <FileText size={48} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Attendees Imported</h3>
            <p className="text-slate-600 mb-4">
              Upload a CSV file from Eventbrite or generate test data to get started
            </p>
            <div className="text-sm text-slate-500 max-w-md mx-auto">
              <p className="mb-2"><strong>Expected CSV format:</strong></p>
              <p>first_name, last_name, email, ticket_type, order_id, phone</p>
            </div>
          </div>
        )}
      </div>

      {/* Implementation Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Implementation Notes:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Test data includes 10 realistic users with different ticket types</li>
          <li>• CSV validation checks for required fields and email format</li>
          <li>• "Create Temp Profiles" would insert these users into your Supabase profiles table</li>
          <li>• Users would have is_temp_account = true and account_expires_at = 30 days from now</li>
          <li>• Event access would verify email against this attendee list</li>
        </ul>
      </div>
    </div>
  );
};

export default CSVImportSystem;