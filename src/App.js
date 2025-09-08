import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import EnhancedCreateEventForm from './EnhancedCreateEventForm'; // Updated import
import UserInterface from './UserInterface';
import WineRatingForm from './WineRatingForm';
import BoothModeDetector from './BoothModeDetector'; // New import
import AppPreview from './AppPreview';
import { supabase } from './supabaseClient';

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
    
    try {
      // Use Supabase authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError || !profile?.is_admin) {
        setError('Access denied. Admin privileges required.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      onAdminLogin(profile);
      
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-purple-200">Sign in to manage wine events</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
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
  const [userSession, setUserSession] = useState(null);
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

  const handleEventJoined = (event, session) => {
    console.log('Event joined:', event, 'Session:', session);
    setCurrentEvent(event);
    setUserSession(session);
  };

  const backToAdmin = () => setShowCreateForm(false);
  const backToUser = () => setShowRatingForm(false);
  
  const backToJoin = () => {
    console.log('backToJoin called - resetting to join form');
    setCurrentEvent(null);
    setUserSession(null);
    localStorage.removeItem('wineAppSession');
  };

  const handleAdminLogin = (user) => {
    setAdminUser(user);
  };

  const handleLogout = () => {
    setAdminUser(null);
    setCurrentEvent(null);
    setUserSession(null);
    setSelectedWine(null);
    setShowCreateForm(false);
    setShowRatingForm(false);
    localStorage.removeItem('wineAppSession');
  };

  // Admin Route Component
  const AdminRoute = () => {
    // If admin is logged in and showing create form
    if (showCreateForm) {
      return (
        <EnhancedCreateEventForm 
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
          userSession={userSession}
        />
      );
    }

    // If no current event, show booth mode detector (which handles both modes)
    if (!currentEvent) {
      return <BoothModeDetector onEventJoined={handleEventJoined} />;
    }

    // Show user interface for current event
    return (
      <UserInterface
        event={currentEvent}
        userSession={userSession}
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