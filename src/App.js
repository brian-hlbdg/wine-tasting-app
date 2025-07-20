import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import UserInterface from './UserInterface';

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);

  return (
    <div className="App">
      {/* Mode Toggle */}
      <div style={{position: 'fixed', top: '10px', left: '10px', zIndex: 9999}}>
        <button 
          onClick={() => setIsAdminMode(!isAdminMode)}
          style={{
            background: isAdminMode ? '#dc2626' : '#7c3aed', 
            color: 'white', 
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        >
          {isAdminMode ? 'Switch to User' : 'Switch to Admin'}
        </button>
      </div>

      {isAdminMode ? <AdminDashboard /> : <UserInterface />}
    </div>
  );
}

export default App;