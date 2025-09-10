import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Database, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const DatabaseDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState([]);
  const [running, setRunning] = useState(false);

  const addResult = (test, status, message, details = null) => {
    setDiagnostics(prev => [...prev, { test, status, message, details, timestamp: new Date() }]);
  };

  const runDiagnostics = async () => {
    setDiagnostics([]);
    setRunning(true);

    try {
      // Test 1: Basic Supabase Connection
      addResult('Connection', 'running', 'Testing Supabase connection...');
      try {
        const { data, error } = await supabase.from('tasting_events').select('count', { count: 'exact', head: true });
        if (error) throw error;
        addResult('Connection', 'success', 'Supabase connection successful');
      } catch (error) {
        addResult('Connection', 'error', 'Supabase connection failed', error);
        setRunning(false);
        return;
      }

      // Test 2: Check current user auth
      addResult('Auth', 'running', 'Checking authentication status...');
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        addResult('Auth', 'info', user ? `Authenticated as: ${user.email}` : 'Not authenticated (anonymous access)');
      } catch (error) {
        addResult('Auth', 'warning', 'Auth check failed', error);
      }

      // Test 3: Profiles table access
      addResult('Profiles Read', 'running', 'Testing profiles table read access...');
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, is_temp_account')
          .limit(5);
        if (error) throw error;
        addResult('Profiles Read', 'success', `Read access successful. Found ${data.length} profiles.`, data);
      } catch (error) {
        addResult('Profiles Read', 'error', 'Read access failed', error);
      }

      // Test 4: Check profiles table structure
      addResult('Table Schema', 'running', 'Checking profiles table schema...');
      try {
        // Try to get table info by selecting with all expected columns
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, eventbrite_email, is_temp_account, account_expires_at, is_admin, created_at')
          .limit(1);
        if (error) throw error;
        addResult('Table Schema', 'success', 'All expected columns exist');
      } catch (error) {
        addResult('Table Schema', 'error', 'Schema check failed - missing columns?', error);
      }

      // Test 5: Test insert permissions
      addResult('Insert Test', 'running', 'Testing insert permissions with dummy data...');
      try {
        const testProfile = {
          id: crypto.randomUUID(),
          display_name: 'test_user_diagnostic',
          eventbrite_email: 'diagnostic@test.com',
          is_temp_account: true,
          account_expires_at: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
          is_admin: false,
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('profiles')
          .insert([testProfile])
          .select()
          .single();
        
        if (error) throw error;
        
        addResult('Insert Test', 'success', 'Insert permission confirmed', data);
        
        // Clean up test record
        await supabase.from('profiles').delete().eq('id', data.id);
        addResult('Cleanup', 'success', 'Test record cleaned up');
        
      } catch (error) {
        addResult('Insert Test', 'error', 'Insert permission denied', error);
      }

      // Test 6: Check RLS policies
      addResult('RLS Policies', 'running', 'Checking Row Level Security policies...');
      try {
        // This is a simplified check - in reality you'd need admin access to check policies
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('eventbrite_email', 'nonexistent@test.com')
          .maybeSingle();
        
        if (error && error.code === '42501') {
          addResult('RLS Policies', 'warning', 'RLS policies may be blocking access', error);
        } else {
          addResult('RLS Policies', 'success', 'RLS policies allow access');
        }
      } catch (error) {
        addResult('RLS Policies', 'warning', 'Could not check RLS policies', error);
      }

      // Test 7: Check tasting_events table
      addResult('Events Table', 'running', 'Testing tasting_events table access...');
      try {
        const { data, error } = await supabase
          .from('tasting_events')
          .select('id, event_name, event_code, access_type')
          .limit(3);
        if (error) throw error;
        addResult('Events Table', 'success', `Events table accessible. Found ${data.length} events.`, data);
      } catch (error) {
        addResult('Events Table', 'error', 'Events table access failed', error);
      }

    } catch (error) {
      addResult('General', 'error', 'Unexpected error during diagnostics', error);
    }

    setRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'running': return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'info': return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'running': return 'bg-blue-50 border-blue-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Database Diagnostic Tool</h1>
            <p className="text-gray-600">Check your Supabase configuration and permissions</p>
          </div>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={running}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2 mb-6"
        >
          {running ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              Run Diagnostics
            </>
          )}
        </button>

        {diagnostics.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Diagnostic Results:</h2>
            
            {diagnostics.map((result, index) => (
              <div key={index} className={`p-4 border rounded-lg ${getStatusColor(result.status)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(result.status)}
                  <div>
                    <h3 className="font-medium">{result.test}</h3>
                    <p className="text-sm text-gray-700">{result.message}</p>
                  </div>
                </div>
                
                {result.details && (
                  <div className="mt-3 p-3 bg-white bg-opacity-50 rounded text-xs font-mono overflow-x-auto">
                    <pre>{JSON.stringify(result.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}

            {/* Summary */}
            {!running && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Summary:</h3>
                <div className="text-sm space-y-1">
                  <div>✅ Successful: {diagnostics.filter(d => d.status === 'success').length}</div>
                  <div>❌ Errors: {diagnostics.filter(d => d.status === 'error').length}</div>
                  <div>⚠️ Warnings: {diagnostics.filter(d => d.status === 'warning').length}</div>
                  <div>ℹ️ Info: {diagnostics.filter(d => d.status === 'info').length}</div>
                </div>
                
                {diagnostics.some(d => d.status === 'error') && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
                    <strong>Action Required:</strong> There are database errors that need to be resolved. 
                    Check your Supabase project settings, RLS policies, and table permissions.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Common Issues & Solutions:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Insert permission denied:</strong> Check RLS policies on profiles table</li>
            <li>• <strong>Schema errors:</strong> Run database migrations to add missing columns</li>
            <li>• <strong>Connection failures:</strong> Verify Supabase URL and anon key</li>
            <li>• <strong>Auth issues:</strong> Check if anonymous access is enabled</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DatabaseDiagnostic;