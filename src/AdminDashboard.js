import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Plus, Wine, LogOut, Calendar, MapPin, Edit, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('events');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) loadEvents();
  }, [user]);

  const checkUser = async () => {
    console.log('checkUser called');
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

  const handleEventFormChange = (field, value) => {
    setEventForm(prev => ({ ...prev, [field]: value }));
  };

  // Add these handler functions to your AdminDashboard component:
const updateEventField = (field, value) => {
  setEventForm(prev => ({ ...prev, [field]: value }));
};

const updateWineField = (field, value) => {
  setWineForm(prev => ({ ...prev, [field]: value }));
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

  const loadEvents = async () => {
    console.log('Loading events with wines...');
    
    const { data, error } = await supabase
      .from('tasting_events')
      .select(`
        *,
        event_wines (*)
      `)
      .order('event_date', { ascending: false });
    
    if (error) {
      console.error('Error loading events:', error);
    } else {
      console.log('Events with wines loaded:', data);
      setEvents(data || []);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Login Form Component
  const LoginForm = () => {
    const [email, setEmail] = useState('admin@winetasting.com');
    const [password, setPassword] = useState('password123');
    
    return (
      <div style={{padding: '20px', maxWidth: '400px', margin: '50px auto'}}>
        <h1>Admin Login</h1>
        <div style={{marginBottom: '10px'}}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{width: '100%', padding: '10px', marginBottom: '10px'}}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{width: '100%', padding: '10px', marginBottom: '10px'}}
          />
          <button
            onClick={() => signInWithEmail(email, password)}
            style={{width: '100%', padding: '10px', background: 'purple', color: 'white'}}
          >
            Sign In
          </button>
        </div>
        <p style={{fontSize: '12px', color: 'gray'}}>
          Demo: admin@winetasting.com / password123
        </p>
      </div>
    );
  };

  // EventsList Component
  const EventsList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Wine Tasting Events</h2>
        <button
          onClick={() => {
            console.log('New Event button clicked in EventsList');
            setCurrentView('create-event');
            console.log('setCurrentView called in EventsList');
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No events yet. Create your first event!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map(event => (
            <div key={event.id} className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{event.event_name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
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
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    event.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {event.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Wine className="w-4 h-4 text-purple-600" />
                    <span>{event.event_wines?.length || 0} wines</span>
                  </div>
                  <div className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                    Code: {event.event_code}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded">
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
  

  // Add these form states at the top with your other useState declarations
const [eventForm, setEventForm] = useState({
  event_name: '',
  event_date: '',
  location: '',
  description: '',
  wines: []
});

const [wineForm, setWineForm] = useState({
  wine_name: '',
  producer: '',
  vintage: '',
  wine_type: 'red',
  region: '',
  country: '',
  price_point: 'Mid-range',
  alcohol_content: '',
  sommelier_notes: ''
});

// Add these functions after your existing functions
const createEvent = async () => {
  if (!eventForm.event_name || !eventForm.event_date) {
    alert('Please fill in event name and date');
    return;
  }

  console.log('Creating event with wines:', eventForm.wines);

  // First, create the event
  const { data: eventData, error: eventError } = await supabase
    .from('tasting_events')
    .insert([{
      admin_id: user.id,
      event_name: eventForm.event_name,
      event_date: eventForm.event_date,
      location: eventForm.location,
      description: eventForm.description
    }])
    .select()
    .single();

  if (eventError) {
    console.error('Error creating event:', eventError);
    alert('Error creating event: ' + eventError.message);
    return;
  }

  console.log('Event created:', eventData);

  // Then, add wines to the event
  if (eventForm.wines.length > 0) {
    const winesForDB = eventForm.wines.map((wine, index) => ({
      event_id: eventData.id,
      wine_name: wine.wine_name,
      producer: wine.producer || null,
      vintage: wine.vintage ? parseInt(wine.vintage) : null,
      wine_type: wine.wine_type,
      region: wine.region || null,
      country: wine.country || null,
      price_point: wine.price_point,
      alcohol_content: wine.alcohol_content ? parseFloat(wine.alcohol_content) : null,
      sommelier_notes: wine.sommelier_notes || null,
      tasting_order: index + 1
    }));

    console.log('Inserting wines:', winesForDB);

    const { data: winesData, error: winesError } = await supabase
      .from('event_wines')
      .insert(winesForDB)
      .select();

    if (winesError) {
      console.error('Error creating wines:', winesError);
      alert('Event created but error adding wines: ' + winesError.message);
    } else {
      console.log('Wines created successfully:', winesData);
    }
  }

  alert('Event created successfully!');
  setEventForm({ event_name: '', event_date: '', location: '', description: '', wines: [] });
  setCurrentView('events');
  loadEvents();
};

const addWineToEvent = () => {
  if (!wineForm.wine_name) {
    alert('Please enter wine name');
    return;
  }

  setEventForm(prev => ({
    ...prev,
    wines: [...prev.wines, { ...wineForm }]
  }));

  setWineForm({
    wine_name: '',
    producer: '',
    vintage: '',
    wine_type: 'red',
    region: '',
    country: '',
    price_point: 'Mid-range',
    alcohol_content: '',
    sommelier_notes: ''
  });
};

const removeWineFromEvent = (index) => {
  setEventForm(prev => ({
    ...prev,
    wines: prev.wines.filter((_, i) => i !== index)
  }));
};

// Add the CreateEventForm component
const CreateEventForm = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold">Create New Event</h2>
      <button
        onClick={() => setCurrentView('events')}
        className="text-gray-600 hover:text-gray-800"
      >
        ← Back to Events
      </button>
    </div>

    {/* Event Details */}
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="font-semibold mb-4 text-purple-700">Event Details</h3>
      <div className="grid gap-4">
      <input
  type="text"
  placeholder="Event name"
  value={eventForm.event_name}
  onChange={(e) => handleEventFormChange('event_name', e.target.value)}
  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
/>

{/* Add Wines Section */}
<div className="bg-white p-6 rounded-lg border">
  <h3 className="font-semibold mb-4 text-purple-700">Add Wines</h3>
  
  <div className="grid gap-4 mb-4">
    <div className="grid grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Wine name *"
        value={wineForm.wine_name}
        onChange={(e) => setWineForm(prev => ({ ...prev, wine_name: e.target.value }))}
        className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
      />
      <input
        type="text"
        placeholder="Producer"
        value={wineForm.producer}
        onChange={(e) => setWineForm(prev => ({ ...prev, producer: e.target.value }))}
        className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
      />
    </div>
    
    <div className="grid grid-cols-3 gap-4">
      <select
        value={wineForm.wine_type}
        onChange={(e) => setWineForm(prev => ({ ...prev, wine_type: e.target.value }))}
        className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
      >
        <option value="red">Red</option>
        <option value="white">White</option>
        <option value="rosé">Rosé</option>
        <option value="sparkling">Sparkling</option>
        <option value="dessert">Dessert</option>
      </select>
      <input
        type="number"
        placeholder="Vintage"
        value={wineForm.vintage}
        onChange={(e) => setWineForm(prev => ({ ...prev, vintage: e.target.value }))}
        className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
      />
      <select
        value={wineForm.price_point}
        onChange={(e) => setWineForm(prev => ({ ...prev, price_point: e.target.value }))}
        className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
      >
        <option value="Budget">Budget</option>
        <option value="Mid-range">Mid-range</option>
        <option value="Premium">Premium</option>
        <option value="Luxury">Luxury</option>
      </select>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <input
        type="text"
        placeholder="Region"
        value={wineForm.region}
        onChange={(e) => setWineForm(prev => ({ ...prev, region: e.target.value }))}
        className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
      />
      <input
        type="text"
        placeholder="Country"
        value={wineForm.country}
        onChange={(e) => setWineForm(prev => ({ ...prev, country: e.target.value }))}
        className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
      />
    </div>
    
    <textarea
      placeholder="Sommelier notes"
      value={wineForm.sommelier_notes}
      onChange={(e) => setWineForm(prev => ({ ...prev, sommelier_notes: e.target.value }))}
      rows="2"
      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
    />
  </div>
  
  <button
    onClick={addWineToEvent}
    className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 mb-4"
  >
    Add Wine to Event
  </button>

  {/* Wine List */}
  {eventForm.wines.length > 0 && (
    <div className="space-y-2">
      <h4 className="font-medium">Wines for this event:</h4>
      {eventForm.wines.map((wine, index) => (
        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
          <div>
            <span className="font-medium">{wine.wine_name}</span>
            {wine.producer && <span className="text-gray-600"> - {wine.producer}</span>}
            {wine.vintage && <span className="text-gray-600"> ({wine.vintage})</span>}
          </div>
          <button
            onClick={() => removeWineFromEvent(index)}
            className="text-red-600 hover:bg-red-50 p-1 rounded"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )}
</div>

<input
  type="date"
  value={eventForm.event_date}
  onChange={(e) => handleEventFormChange('event_date', e.target.value)}
  className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
/>

<input
  type="text"
  placeholder="Location"
  value={eventForm.location}
  onChange={(e) => handleEventFormChange('location', e.target.value)}
  className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
/>

<textarea
  placeholder="Event description"
  value={eventForm.description}
  onChange={(e) => handleEventFormChange('description', e.target.value)}
  rows="3"
  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
/>
      </div>
    </div>

    {/* Create Event Button */}
    <div className="flex gap-4">
      <button
        onClick={createEvent}
        className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium"
      >
        Create Event
      </button>
      <button
        onClick={() => setCurrentView('events')}
        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  </div>
);

  if (loading) {
    return <div>Loading...</div>;
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
      
      <main className="max-w-6xl mx-auto p-4">
        {currentView === 'events' && <EventsList />}
        {currentView === 'create-event' && <CreateEventForm />}
      </main>
    </div>
  );
};


export default AdminDashboard;