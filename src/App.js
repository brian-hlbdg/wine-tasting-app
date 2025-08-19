import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import CreateEventForm from './CreateEventForm';
import UserInterface from './UserInterface';
import WineRatingForm from './WineRatingForm';
import JoinEventForm from './JoinEventForm';

function App() {
  const [viewMode, setViewMode] = useState('side-by-side');
  const [adminUser, setAdminUser] = useState(null);
  const [selectedWine, setSelectedWine] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const goToCreateForm = (user) => {
    setAdminUser(user);
    setShowCreateForm(true);
  };

  const goToRatingForm = (wine) => {
    setSelectedWine(wine);
    setShowRatingForm(true);
  };

  const handleEventJoined = (event) => {
    setCurrentEvent(event);
  };

  const backToAdmin = () => setShowCreateForm(false);
  const backToUser = () => setShowRatingForm(false);
  
  const backToJoin = () => {
    console.log('backToJoin called - resetting to join form');
    setCurrentEvent(null);
  };

  const nextViewMode = () => {
    if (viewMode === 'side-by-side') setViewMode('admin-only');
    else if (viewMode === 'admin-only') setViewMode('user-only');
    else setViewMode('side-by-side');
  };

  const ModeToggle = () => (
    <div style={{position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999}}>
      <button 
        onClick={nextViewMode}
        style={{
          background: viewMode === 'side-by-side' ? '#7c3aed' : viewMode === 'admin-only' ? '#dc2626' : '#059669',
          color: 'white', 
          padding: '12px 20px',
          borderRadius: '50px',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {viewMode === 'side-by-side' ? '📊 Testing Mode' : 
         viewMode === 'admin-only' ? '👨‍💼 Admin Only' : 
         '👤 User Only'}
      </button>
    </div>
  );

  // Handle full-screen forms
  if (showCreateForm) {
    return (
      <div className="App">
        <ModeToggle />
        <CreateEventForm 
          user={adminUser}
          onBack={backToAdmin}
          onEventCreated={backToAdmin}
        />
      </div>
    );
  }

  if (showRatingForm) {
    return (
      <div className="App">
        <ModeToggle />
        <WineRatingForm 
          wine={selectedWine}
          onBack={backToUser}
          onRatingSaved={backToUser}
        />
      </div>
    );
  }

  // Side-by-Side Testing Mode
  if (viewMode === 'side-by-side') {
    return (
      <div className="App">
        <ModeToggle />
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Admin Side */}
          <div style={{ width: '60%', borderRight: '2px solid #e5e7eb' }}>
            <div style={{ padding: '8px', background: '#7c3aed', color: 'white', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
              ADMIN PANEL
            </div>
            <AdminDashboard onCreateEvent={goToCreateForm} />
          </div>
          
          {/* User Side - CONSISTENT LOGIC */}
          <div style={{ width: '40%' }}>
            <div style={{ padding: '8px', background: '#059669', color: 'white', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
              USER EXPERIENCE
            </div>
            {!currentEvent ? (
              <JoinEventForm onEventJoined={handleEventJoined} />
            ) : (
              <UserInterface
                event={currentEvent}
                onRateWine={goToRatingForm}
                onBackToJoin={backToJoin}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin Only Mode
  if (viewMode === 'admin-only') {
    return (
      <div className="App">
        <ModeToggle />
        <AdminDashboard onCreateEvent={goToCreateForm} />
      </div>
    );
  }

  // User Only Mode
  if (viewMode === 'user-only') {
    return (
      <div className="App">
        <ModeToggle />
        {!currentEvent ? (
          <JoinEventForm onEventJoined={handleEventJoined} />
        ) : (
          <UserInterface
            event={currentEvent}
            onRateWine={goToRatingForm}
            onBackToJoin={backToJoin}
          />
        )}
      </div>
    );
  }
}

export default App;