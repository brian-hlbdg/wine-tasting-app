import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import { supabase } from './supabaseClient';

function App() {
  const [isAdminMode, setIsAdminMode] = useState(true); // Start with admin mode for testing

  return (
    <div className="App">
      {isAdminMode ? (
        <AdminDashboard />
      ) : (
        <div className="p-4">
          <button 
            onClick={() => setIsAdminMode(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Switch to Admin
          </button>
          {/* User interface will go here later */}
        </div>
      )}
    </div>
  );
}

export default App;