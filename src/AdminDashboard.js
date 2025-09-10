import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Plus, Wine, LogOut, Calendar, MapPin, Edit, Trash2, BarChart3 } from 'lucide-react';
import AdminAnalytics from './AdminAnalytics';
import EnhancedCreateEventForm from './EnhancedCreateEventForm';

const AdminDashboard = ({ onCreateEvent, onLogout }) => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('events');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventForAnalytics, setSelectedEventForAnalytics] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.is_admin) {
        setUser(profile);
      }
    }
    setLoading(false);
  };

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('tasting_events')
      .select(`
        *,
        event_wines (*),
        event_locations (*)
      `)
      .order('event_date', { ascending: false });
    
    if (error) {
      console.error('Error loading events:', error);
    } else {
      setEvents(data || []);
    }
  };

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    
    if (error) {
      alert('Error: ' + error.message);
    } else {
      checkUser();
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    if (onLogout) {
      onLogout(); // This will redirect back to /admin login
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    const { error } = await supabase
      .from('tasting_events')
      .delete()
      .eq('id', eventId);
      
    if (error) {
      alert('Error deleting event: ' + error.message);
    } else {
      alert('Event deleted successfully');
      loadEvents();
    }
  };

  const toggleEventActive = async (eventId, currentStatus) => {
    const { error } = await supabase
      .from('tasting_events')
      .update({ is_active: !currentStatus })
      .eq('id', eventId);
      
    if (error) {
      alert('Error updating event: ' + error.message);
    } else {
      loadEvents();
    }
  };

  // Event management functions
  const startEditingEvent = (event) => {
    setEditingEvent(event);
    setCurrentView('edit-event');
  };

  const startCreatingEvent = () => {
    setEditingEvent(null);
    setCurrentView('create-event');
  };

  const handleEventUpdated = () => {
    setEditingEvent(null);
    setCurrentView('events');
    loadEvents(); // Refresh the events list
  };

  // Login Form Component
  const LoginForm = () => {
    const [email, setEmail] = useState('admin@winetasting.com');
    const [password, setPassword] = useState('admin123');

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-6">
            <Wine className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-600">Sign in to manage wine events</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => signInWithEmail(email, password)}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium"
            >
              Sign In
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
            <p><strong>Demo Credentials:</strong></p>
            <p>Email: admin@winetasting.com</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>
    );
  };

  // Events List Component
  const EventsList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Events</h2>
        <button
          onClick={startCreatingEvent}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Wine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-4">Create your first wine tasting event</p>
          <button
            onClick={startCreatingEvent}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.event_name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{event.event_date ? new Date(event.event_date).toLocaleDateString() : 'No date'}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                  {/* Show if it's a wine crawl */}
                  {event.event_locations && event.event_locations.length > 0 && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        <MapPin className="w-3 h-3" />
                        Wine Crawl • {event.event_locations.length} locations
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    event.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {event.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {event.event_code && (
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                      Code: {event.event_code}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Wine className="w-4 h-4 text-purple-600" />
                    <span>{event.event_wines?.length || 0} wines</span>
                  </div>
                  {event.event_locations && event.event_locations.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span>{event.event_locations.length} stops</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => startEditingEvent(event)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                    title="Edit Event & Manage Locations"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedEventForAnalytics(event);
                      setCurrentView('analytics');
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="View Analytics"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => toggleEventActive(event.id, event.is_active)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title={event.is_active ? "Deactivate Event" : "Activate Event"}
                  >
                    {event.is_active ? <Trash2 className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => deleteEvent(event.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Main component render
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wine className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-bold">Palate Collectif Admin</h1>
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
      
      <main className="max-w-6xl mx-auto p-4">
        {/* Events List View */}
        {currentView === 'events' && <EventsList />}
        
        {/* Create Event View */}
        {currentView === 'create-event' && (
          <EnhancedCreateEventForm 
            user={user}
            onBack={() => setCurrentView('events')}
            onEventCreated={handleEventUpdated}
          />
        )}
        
        {/* Edit Event View */}
        {currentView === 'edit-event' && editingEvent && (
          <EnhancedCreateEventForm 
            user={user}
            onBack={() => setCurrentView('events')}
            onEventCreated={handleEventUpdated}
            editingEvent={editingEvent}
          />
        )}
        
        {/* Analytics View */}
        {currentView === 'analytics' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setCurrentView('events')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Events
              </button>
              <h2 className="text-xl font-bold">
                Analytics: {selectedEventForAnalytics?.event_name}
              </h2>
            </div>
            <AdminAnalytics event={selectedEventForAnalytics} />
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;