import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Plus, Wine, LogOut, Calendar, MapPin, Edit, Trash2, BarChart3, ExternalLink, Eye, EyeOff, Clock, AlertTriangle } from 'lucide-react';
import AdminAnalytics from './AdminAnalytics';
import EnhancedCreateEventForm from './EnhancedCreateEventForm';

const EnhancedAdminDashboard = ({ onCreateEvent, onLogout }) => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('events');
  const [events, setEvents] = useState([]);
  const [deletedEvents, setDeletedEvents] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEventForAnalytics, setSelectedEventForAnalytics] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadEvents();
      loadDeletedEvents();
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
        // Update last login tracking
        await updateLoginTracking(profile.id);
        setUser(profile);
      }
    }
    setLoading(false);
  };

  const updateLoginTracking = async (userId) => {
    try {
      await supabase
        .from('profiles')
        .update({
          last_login: new Date().toISOString(),
          login_count: supabase.raw('login_count + 1')
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating login tracking:', error);
    }
  };

  const loadEvents = async () => {
    // Only load active events created by this admin
    const { data, error } = await supabase
      .from('tasting_events')
      .select(`
        *,
        event_wines (*),
        event_locations (*)
      `)
      .eq('admin_id', user.id)
      .eq('is_deleted', false)
      .order('event_date', { ascending: false });
    
    if (error) {
      console.error('Error loading events:', error);
    } else {
      setEvents(data || []);
    }
  };

  const loadDeletedEvents = async () => {
    // Load soft-deleted events for recovery option
    const { data, error } = await supabase
      .from('tasting_events')
      .select(`
        *,
        event_wines (*),
        event_locations (*)
      `)
      .eq('admin_id', user.id)
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false });
    
    if (error) {
      console.error('Error loading deleted events:', error);
    } else {
      setDeletedEvents(data || []);
    }
  };

  const softDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? It will be moved to trash and permanently deleted after 30 days.')) {
      return;
    }
    
    const { error } = await supabase
      .from('tasting_events')
      .update({ 
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        is_active: false // Also deactivate the event
      })
      .eq('id', eventId);
      
    if (error) {
      alert('Error deleting event: ' + error.message);
    } else {
      alert('Event moved to trash. It will be permanently deleted in 30 days.');
      loadEvents();
      loadDeletedEvents();
    }
  };

  const restoreEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to restore this event?')) {
      return;
    }
    
    const { error } = await supabase
      .from('tasting_events')
      .update({ 
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        is_active: true // Reactivate the event
      })
      .eq('id', eventId);
      
    if (error) {
      alert('Error restoring event: ' + error.message);
    } else {
      alert('Event restored successfully!');
      loadEvents();
      loadDeletedEvents();
    }
  };

  const permanentDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this event? This cannot be undone!')) {
      return;
    }
    
    const { error } = await supabase
      .from('tasting_events')
      .delete()
      .eq('id', eventId);
      
    if (error) {
      alert('Error permanently deleting event: ' + error.message);
    } else {
      alert('Event permanently deleted.');
      loadDeletedEvents();
    }
  };

  const getBoothUrl = (event) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?boothCode=${event.event_code}`;
  };

  const copyBoothUrl = async (event) => {
    const url = getBoothUrl(event);
    try {
      await navigator.clipboard.writeText(url);
      alert('Booth URL copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Booth URL copied to clipboard!');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    if (onLogout) {
      onLogout();
    }
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  const getDaysUntilDeletion = (deletedAt) => {
    const deleted = new Date(deletedAt);
    const deleteDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffDays = Math.ceil((deleteDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Wine className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Wine className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Wine Admin</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Welcome back, {user.display_name || user.eventbrite_email}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last login: {formatLastLogin(user.last_login)}
                  </span>
                  {user.login_count && (
                    <span>Login #{user.login_count}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('events')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentView === 'events' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Events
              </button>
              
              <button
                onClick={() => setCurrentView('analytics')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentView === 'analytics' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
              </button>
              
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'events' && (
          <div className="space-y-6">
            {/* Events Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {showDeleted ? 'Deleted Events' : 'Your Events'} ({showDeleted ? deletedEvents.length : events.length})
                </h2>
                <button
                  onClick={() => setShowDeleted(!showDeleted)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${
                    showDeleted 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showDeleted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showDeleted ? 'Show Active' : 'Show Deleted'}
                  {deletedEvents.length > 0 && !showDeleted && (
                    <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                      {deletedEvents.length}
                    </span>
                  )}
                </button>
              </div>
              
              {!showDeleted && (
                <button
                  onClick={() => setCurrentView('create-event')}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </button>
              )}
            </div>

            {/* Events List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(showDeleted ? deletedEvents : events).map(event => (
                <div key={event.id} className={`bg-white rounded-lg shadow-md border ${
                  showDeleted ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{event.event_name}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.event_date).toLocaleDateString()}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {showDeleted && (
                        <div className="text-right">
                          <div className="text-xs text-red-600 font-medium">
                            Deleted {formatLastLogin(event.deleted_at)}
                          </div>
                          <div className="text-xs text-red-500">
                            {getDaysUntilDeletion(event.deleted_at)} days until permanent deletion
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Event Code & Access Type */}
                    <div className="mb-4 space-y-2">
                      {event.event_code && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {event.event_code}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            event.access_type === 'email_only' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {event.access_type === 'email_only' ? 'Booth Mode' : 'Standard'}
                          </span>
                        </div>
                      )}
                      
                      {/* Booth Mode URL */}
                      {event.access_type === 'email_only' && !showDeleted && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="text-xs text-green-700 font-medium mb-1">Booth URL:</div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-white px-2 py-1 rounded border flex-1 truncate">
                              {getBoothUrl(event)}
                            </code>
                            <button
                              onClick={() => window.open(getBoothUrl(event), '_blank')}
                              className="text-green-600 hover:text-green-800"
                              title="Open booth URL"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => copyBoothUrl(event)}
                              className="text-green-600 hover:text-green-800 text-xs px-2 py-1 bg-green-100 rounded"
                              title="Copy URL"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-sm text-gray-600 mb-4">
                      <div>Wines: {event.event_wines?.length || 0}</div>
                      <div>Locations: {event.event_locations?.length || 0}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {showDeleted ? (
                        <>
                          <button
                            onClick={() => restoreEvent(event.id)}
                            className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => permanentDeleteEvent(event.id)}
                            className="bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {/* Edit logic */}}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {/* Analytics logic */}}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => softDeleteEvent(event.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty States */}
            {!showDeleted && events.length === 0 && (
              <div className="text-center py-12">
                <Wine className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600 mb-6">Create your first wine tasting event to get started.</p>
                <button
                  onClick={() => setCurrentView('create-event')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium"
                >
                  Create Your First Event
                </button>
              </div>
            )}

            {showDeleted && deletedEvents.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted events</h3>
                <p className="text-gray-600">Deleted events will appear here and be permanently removed after 30 days.</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'create-event' && (
          <EnhancedCreateEventForm 
            user={user}
            onBack={() => setCurrentView('events')}
            onEventCreated={() => {
              setCurrentView('events');
              loadEvents();
            }}
          />
        )}

        {currentView === 'analytics' && (
          <AdminAnalytics 
            user={user}
            events={events}
            onBack={() => setCurrentView('events')}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;