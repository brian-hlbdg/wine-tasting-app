import React, { useState, useEffect, useCallback } from 'react';
import { Wine, LogOut, Calendar, MapPin, Edit, Trash2, BarChart3, Plus, User, Lock, Settings } from 'lucide-react';
import AuthSystem from './AuthSystem';

const WineTastingApp = () => {
  const [authMode, setAuthMode] = useState('select'); // 'select', 'admin-login', 'user-login'
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side', 'admin-only', 'user-only'
  const [adminUser, setAdminUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showTestingMode, setShowTestingMode] = useState(false);

  // Mock authentication functions
  const signInAdmin = async (email, password) => {
    // Simulate admin login
    if (email === 'admin@winetasting.com' && password === 'admin123') {
      setAdminUser({ id: 1, email, name: 'Admin User', is_admin: true });
      setAuthMode('authenticated');
      return true;
    }
    return false;
  };

  const signInUser = async (phone) => {
    // Simulate user signup/login
    if (phone && phone.length >= 10) {
      setCurrentUser({ id: 2, phone, name: 'Guest User' });
      setAuthMode('authenticated');
      return true;
    }
    return false;
  };

  const signOut = () => {
    setAdminUser(null);
    setCurrentUser(null);
    setAuthMode('select');
    setShowTestingMode(false);
  };

  const enableTestingMode = () => {
    // Enable testing mode with mock users
    setAdminUser({ id: 1, email: 'admin@test.com', name: 'Test Admin', is_admin: true });
    setCurrentUser({ id: 2, phone: '1234567890', name: 'Test User' });
    setCurrentEvent({
      id: 1,
      event_name: 'Sample Wine Tasting',
      location: 'Napa Valley',
      event_date: '2025-08-25',
      event_code: 'WINE25',
      event_wines: [
        { id: 1, name: 'Cabernet Sauvignon 2020', type: 'Red', region: 'Napa Valley' },
        { id: 2, name: 'Chardonnay 2022', type: 'White', region: 'Sonoma Coast' }
      ]
    });
    setShowTestingMode(true);
    setAuthMode('authenticated');
  };

  // Authentication Selection Screen
  const AuthSelectionScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <Wine className="w-20 h-20 text-white mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">Wine Tasting</h1>
          <p className="text-purple-200">Choose your access level</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => setAuthMode('admin-login')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all transform hover:scale-105"
          >
            <Settings className="w-5 h-5" />
            Admin Login
          </button>
          
          <button
            onClick={() => setAuthMode('user-login')}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all transform hover:scale-105"
          >
            <User className="w-5 h-5" />
            Join Event
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-purple-200">Development</span>
            </div>
          </div>
          
          <button
            onClick={enableTestingMode}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-3 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            Testing Mode
          </button>
        </div>
      </div>
    </div>
  );

  // Admin Login Screen
  const AdminLoginScreen = () => {
    const [email, setEmail] = useState('admin@winetasting.com');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
      setLoading(true);
      setError('');
      
      const success = await signInAdmin(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
      setLoading(false);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <Settings className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-purple-200">Access the admin dashboard</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="admin@winetasting.com"
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
              />
            </div>
            
            {error && (
              <div className="text-red-300 text-sm text-center">{error}</div>
            )}
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-3 px-6 rounded-xl font-semibold transition-all"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setAuthMode('select')}
              className="text-purple-200 hover:text-white text-sm"
            >
              ← Back to options
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-purple-200">Demo credentials:</p>
            <p className="text-xs text-white">admin@winetasting.com / admin123</p>
          </div>
        </div>
      </div>
    );
  };

  // User Login Screen (Join Event)
  const UserLoginScreen = () => {
    const [eventCode, setEventCode] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
      setLoading(true);
      setError('');
      
      // Mock event validation
      if (eventCode.toUpperCase() === 'WINE25') {
        const success = await signInUser(phone);
        if (success) {
          setCurrentEvent({
            id: 1,
            event_name: 'Summer Wine Tasting',
            location: 'Napa Valley Vineyard',
            event_date: '2025-08-25',
            event_code: 'WINE25',
            event_wines: [
              { id: 1, name: 'Cabernet Sauvignon 2020', type: 'Red', region: 'Napa Valley' },
              { id: 2, name: 'Chardonnay 2022', type: 'White', region: 'Sonoma Coast' }
            ]
          });
        } else {
          setError('Please enter a valid phone number');
        }
      } else {
        setError('Invalid event code');
      }
      setLoading(false);
    };

    return (
    <form className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
            <div className="text-center mb-8">
                <Wine className="w-16 h-16 text-white mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Join Wine Tasting</h1>
                <p className="text-green-200">Enter the event code to get started</p>
            </div>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-white mb-2">Event Code</label>
                    <input
                        type="text"
                        value={eventCode}
                        onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 text-center text-lg font-mono bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="ABC123"
                        maxLength="6"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-white mb-2">Phone Number</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="(555) 123-4567"
                        required
                    />
                </div>
                
                {error && (
                    <div className="text-red-300 text-sm text-center">{error}</div>
                )}
                
                <button
                    type="submit"
                    disabled={loading || eventCode.length < 6}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 px-6 rounded-xl font-semibold transition-all"
                >
                    {loading ? 'Joining...' : 'Join Event'}
                </button>
            </div>
        </div>
    </form>
    );
  };

  // Mock Admin Dashboard
  const AdminDashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wine className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-bold">Wine Tasting Admin</h1>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>
      
      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Events</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wines Rated</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
              <Wine className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Events</h2>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Summer Wine Tasting</h3>
                  <p className="text-sm text-gray-600">Napa Valley • Aug 25, 2025</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  // Mock User Interface
  const UserInterface = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={signOut}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Leave Event
            </button>
            <div>
              <h1 className="text-xl font-bold">{currentEvent?.event_name}</h1>
              <p className="text-sm text-gray-600">{currentEvent?.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              {currentEvent?.event_code}
            </span>
          </div>
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-semibold mb-6">Tonight's Wines</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentEvent?.event_wines?.map((wine) => (
            <div key={wine.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center gap-4 mb-4">
                <Wine className="w-8 h-8 text-red-600" />
                <div>
                  <h3 className="font-semibold">{wine.name}</h3>
                  <p className="text-sm text-gray-600">{wine.type} • {wine.region}</p>
                </div>
              </div>
              
              <button className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium">
                Rate This Wine
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );

  // Testing Mode Interface
  const TestingModeInterface = () => {
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
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          {viewMode === 'side-by-side' ? '📊 Testing Mode' : 
           viewMode === 'admin-only' ? '👨‍💼 Admin Only' : 
           '👤 User Only'}
        </button>
      </div>
    );

    if (viewMode === 'side-by-side') {
      return (
        <div>
          <ModeToggle />
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <div style={{ width: '60%', borderRight: '2px solid #e5e7eb' }}>
              <div style={{ padding: '8px', background: '#7c3aed', color: 'white', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                ADMIN PANEL (TESTING)
              </div>
              <AdminDashboard />
            </div>
            
            <div style={{ width: '40%' }}>
              <div style={{ padding: '8px', background: '#059669', color: 'white', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                USER EXPERIENCE (TESTING)
              </div>
              <UserInterface />
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === 'admin-only') {
      return (
        <div>
          <ModeToggle />
          <AdminDashboard />
        </div>
      );
    }

    return (
      <div>
        <ModeToggle />
        <UserInterface />
      </div>
    );
  };

  // Main render logic
  if (authMode === 'select') {
    return <AuthSelectionScreen />;
  }

  if (authMode === 'admin-login') {
    return <AdminLoginScreen />;
  }

  if (authMode === 'user-login') {
    return <UserLoginScreen />;
  }

  if (authMode === 'authenticated') {
    if (showTestingMode) {
      return <TestingModeInterface />;
    }
    
    if (adminUser && !currentUser) {
      return <AdminDashboard />;
    }
    
    if (currentUser && !adminUser) {
      return <UserInterface />;
    }
  }

  return <AuthSelectionScreen />;
};

export default WineTastingApp;