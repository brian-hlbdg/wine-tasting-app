import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Wine, User, ArrowLeft } from 'lucide-react';
import UserProfile from './UserProfile';
import WineDetailsInterface from './WineDetailsInterface'; // Your new component

const UserInterface = () => {
  const [currentView, setCurrentView] = useState('join');
  const [eventCode, setEventCode] = useState('');
  const [event, setEvent] = useState(null);
  const [selectedWine, setSelectedWine] = useState(null);
  const [loading, setLoading] = useState(false);

  const joinEvent = async () => {
    if (!eventCode.trim()) {
      alert('Please enter an event code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasting_events')
        .select(`
          *,
          event_wines (
            *
          )
        `)
        .eq('event_code', eventCode.trim().toUpperCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          alert('Event not found. Please check your code.');
        } else {
          console.error('Error finding event:', error);
          alert('Error finding event: ' + error.message);
        }
        return;
      }

      setEvent(data);
      setCurrentView('event');
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Error joining event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWineSelect = (wine) => {
    setSelectedWine(wine);
    setCurrentView('wineDetails');
  };

  const handleBackFromWineDetails = () => {
    setSelectedWine(null);
    setCurrentView('event');
  };

  const handleRatingSaved = () => {
    // Optionally refresh event data or show success message
    setCurrentView('event');
    setSelectedWine(null);
  };

  // Join Event Screen
  const JoinEventScreen = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍷</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Join Wine Event</h1>
          <p className="text-slate-600">Enter your event code to start tasting</p>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter event code"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value.toUpperCase())}
            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-center text-lg font-medium"
            maxLength={8}
          />
          
          <button
            onClick={joinEvent}
            disabled={loading || !eventCode.trim()}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? 'Finding Event...' : 'Join Event'}
          </button>
        </div>
      </div>
    </div>
  );

  // Event Wines Screen
  const EventWinesScreen = () => (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{event?.event_name}</h1>
            <p className="text-slate-600 text-sm">
              {event?.event_date ? new Date(event.event_date).toLocaleDateString() : ''}
              {event?.event_wines?.length ? ` • ${event.event_wines.length} wines to taste` : ''}
            </p>
          </div>
          
          <button 
            onClick={() => setCurrentView('profile')}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <User size={20} className="text-slate-700" />
          </button>
        </div>
      </div>

      {/* Wine Grid */}
      <div className="p-5">
        <div className="space-y-4">
          {(event.event_wines || []).map((wine, index) => (
            <div 
              key={wine.id} 
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.01]"
              onClick={() => handleWineSelect(wine)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-medium">
                      #{index + 1}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">
                      {wine.beverage_type || wine.wine_type}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1 text-slate-900">{wine.wine_name}</h3>
                  
                  {wine.producer && (
                    <p className="text-slate-600 mb-2">{wine.producer}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                    {wine.vintage && <span>{wine.vintage}</span>}
                    {wine.region && <span>{wine.region}</span>}
                    {wine.price_point && (
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs">
                        {wine.price_point}
                      </span>
                    )}
                  </div>
                  
                  {wine.sommelier_notes && (
                    <p className="text-sm text-slate-600 italic line-clamp-2">
                      "{wine.sommelier_notes}"
                    </p>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  <div className="text-3xl mb-2">
                    {wine.beverage_type === 'Champagne' || 
                     wine.beverage_type === 'Sparkling Wine' || 
                     wine.beverage_type === 'Cava' || 
                     wine.beverage_type === 'Prosecco' ? '🥂' : '🍷'}
                  </div>
                  <div className="text-xs text-slate-500">Tap to explore</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No wines message */}
        {(!event.event_wines || event.event_wines.length === 0) && (
          <div className="text-center py-12">
            <Wine className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Wines Yet</h3>
            <p className="text-slate-500">The event organizer hasn't added any wines yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Profile Screen
  const ProfileScreen = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('event')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Wine Profile</h1>
        </div>
      </div>
      <UserProfile />
    </div>
  );

  // Wine Details Screen (New!)
  const WineDetailsScreen = () => (
    <WineDetailsInterface 
      wine={selectedWine}
      onBack={handleBackFromWineDetails}
      onRatingSaved={handleRatingSaved}
    />
  );

  // Main render
  return (
    <div>
      {currentView === 'join' && <JoinEventScreen />}
      {currentView === 'event' && <EventWinesScreen />}
      {currentView === 'profile' && <ProfileScreen />}
      {currentView === 'wineDetails' && <WineDetailsScreen />}
    </div>
  );
};

export default UserInterface;