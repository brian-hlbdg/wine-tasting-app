import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import CreateEventForm from './CreateEventForm';
import UserInterface from './UserInterface';
import WineRatingForm from './WineRatingForm';
import JoinEventForm from './JoinEventForm';
import AppPreview from './AppPreview'; // Adjust path as needed

// Admin Login Component
const AdminLogin = ({ onAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Replace this with your actual admin authentication logic
    if (email === 'admin@winetasting.com' && password === 'admin123') {
      onAdminLogin({ id: 1, email, name: 'Admin User', is_admin: true });
    } else {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚙️</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-purple-200">Access the admin dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="admin@winetasting.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter password"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-300 text-sm text-center">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-3 px-6 rounded-xl font-semibold transition-all"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-purple-200">Demo credentials:</p>
          <p className="text-xs text-white">admin@winetasting.com / admin123</p>
        </div>
      </div>
    </div>
  );
};

function App() {
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

  const handleAdminLogin = (user) => {
    setAdminUser(user);
  };

  const handleLogout = () => {
    setAdminUser(null);
    setCurrentEvent(null);
    setSelectedWine(null);
    setShowCreateForm(false);
    setShowRatingForm(false);
  };

  // Admin Route Component
  const AdminRoute = () => {
    // If admin is logged in and showing create form
    if (showCreateForm) {
      return (
        <CreateEventForm 
          user={adminUser}
          onBack={backToAdmin}
          onEventCreated={backToAdmin}
        />
      );
    }

    // If admin is not logged in, show login screen
    if (!adminUser) {
      return <AdminLogin onAdminLogin={handleAdminLogin} />;
    }

    // Admin is logged in, show dashboard
    return <AdminDashboard onCreateEvent={goToCreateForm} onLogout={handleLogout} />;
  };

  // User Route Component  
  const UserRoute = () => {
    // If showing rating form
    if (showRatingForm) {
      return (
        <WineRatingForm 
          wine={selectedWine}
          onBack={backToUser}
          onRatingSaved={backToUser}
        />
      );
    }

    // If no current event, show join form
    if (!currentEvent) {
      return <JoinEventForm onEventJoined={handleEventJoined} />;
    }

    // Show user interface for current event
    return (
      <UserInterface
        event={currentEvent}
        onRateWine={goToRatingForm}
        onBackToJoin={backToJoin}
      />
    );
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/app_preview" element={<AppPreview />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/" element={<UserRoute />} />
          {/* Redirect any unknown routes to user interface */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;