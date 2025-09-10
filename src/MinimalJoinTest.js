import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const MinimalJoinTest = () => {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testProfileCreation = async () => {
    setLoading(true);
    setResult('');

    try {
      // Skip RLS by using a simple approach
      const profileData = {
        id: crypto.randomUUID(),
        display_name: email.split('@')[0],
        eventbrite_email: email.toLowerCase(),
        is_temp_account: true,
        account_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_admin: false
      };

      // Try just the essential fields first
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select();

      if (error) {
        setResult(`❌ Error: ${error.message}\nCode: ${error.code}\nDetails: ${JSON.stringify(error.details)}`);
      } else {
        setResult(`✅ Success! Profile created: ${JSON.stringify(data, null, 2)}`);
        
        // Clean up test profile
        await supabase.from('profiles').delete().eq('id', data[0].id);
      }
    } catch (error) {
      setResult(`💥 Unexpected error: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Profile Creation Test</h2>
      
      <input
        type="email"
        placeholder="Test email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      
      <button
        onClick={testProfileCreation}
        disabled={loading || !email}
        className="w-full bg-blue-600 text-white p-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Testing...' : 'Test Profile Creation'}
      </button>
      
      {result && (
        <pre className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto">
          {result}
        </pre>
      )}
    </div>
  );
};

export default MinimalJoinTest;