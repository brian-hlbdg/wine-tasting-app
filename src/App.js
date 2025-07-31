import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import CreateEventForm from './CreateEventForm';
import UserInterface from './UserInterface';
import WineRatingForm from './WineRatingForm';

function App() {
  const [currentApp, setCurrentApp] = useState('user');
  const [adminUser, setAdminUser] = useState(null);
  const [selectedWine, setSelectedWine] = useState(null);

  const goToCreateForm = (user) => {
    setAdminUser(user);
    setCurrentApp('create-form');
  };

  const goToRatingForm = (wine) => {
    setSelectedWine(wine);
    setCurrentApp('rating-form');
  };

  const backToAdmin = () => setCurrentApp('admin');
  const backToUser = () => setCurrentApp('user');

  if (currentApp === 'create-form') {
    return (
      <div className="App">
        <CreateEventForm 
          user={adminUser}
          onBack={backToAdmin}
          onEventCreated={backToAdmin}
        />
      </div>
    );
  }

  if (currentApp === 'rating-form') {
    return (
      <div className="App">
        <WineRatingForm 
          wine={selectedWine}
          onBack={backToUser}
          onRatingSaved={backToUser}
        />
      </div>
    );
  }

  return (
    <div className="App">
      <div style={{position: 'fixed', top: '10px', left: '10px', zIndex: 9999}}>
        <button 
          onClick={() => setCurrentApp(currentApp === 'admin' ? 'user' : 'admin')}
          style={{
            background: currentApp === 'admin' ? '#dc2626' : '#7c3aed', 
            color: 'white', 
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        >
          {currentApp === 'admin' ? 'Switch to User' : 'Switch to Admin'}
        </button>
      </div>

      {currentApp === 'admin' ? 
        <AdminDashboard onCreateEvent={goToCreateForm} /> : 
        <UserInterface onRateWine={goToRatingForm} />
      }
    </div>
  );
}

export default App;