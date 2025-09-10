import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Wine, User, ArrowLeft, MapPin, Navigation } from 'lucide-react';
import UserProfile from './UserProfile';
import WineDetailsInterface from './WineDetailsInterface';

const UserInterface = ({ event, onRateWine, onBackToJoin }) => {
  const [currentView, setCurrentView] = useState('join');
  const [eventCode, setEventCode] = useState('');
  const [currentEvent, setCurrentEvent] = useState(event);
  const [selectedWine, setSelectedWine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [winesByLocation, setWinesByLocation] = useState([]);
  const [unassignedWines, setUnassignedWines] = useState([]);

  useEffect(() => {
    if (event || currentEvent) {
      setCurrentEvent(event || currentEvent);
      setCurrentView('event');
      organizeWinesByLocation(event || currentEvent);
    }
  }, [event]);

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
          event_wines (*),
          event_locations (*)
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

      setCurrentEvent(data);
      setCurrentView('event');
      organizeWinesByLocation(data);
      
    } catch (error) {
      console.error('Error joining event:', error);
      alert('Error joining event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const organizeWinesByLocation = (eventData) => {
    if (!eventData || !eventData.event_wines) return;

    // Group wines by location
    const locationGroups = {};
    const unassigned = [];

    eventData.event_wines.forEach(wine => {
      if (wine.location_name) {
        if (!locationGroups[wine.location_name]) {
          locationGroups[wine.location_name] = [];
        }
        locationGroups[wine.location_name].push(wine);
      } else {
        unassigned.push(wine);
      }
    });

    // Convert to array and sort by location order if available
    const locations = Object.entries(locationGroups).map(([locationName, wines]) => {
      // Find location order from event_locations
      const locationInfo = eventData.event_locations?.find(loc => loc.location_name === locationName);
      
      return {
        locationName,
        locationOrder: locationInfo?.location_order || 999,
        locationAddress: locationInfo?.location_address,
        wines: wines.sort((a, b) => (a.location_order || a.tasting_order || 0) - (b.location_order || b.tasting_order || 0))
      };
    });

    // Sort locations by order
    locations.sort((a, b) => a.locationOrder - b.locationOrder);

    setWinesByLocation(locations);
    setUnassignedWines(unassigned);
  };

  const handleWineClick = (wine) => {
    setSelectedWine(wine);
    setCurrentView('wineDetails');
  };

  const handleBackFromWineDetails = () => {
    setSelectedWine(null);
    setCurrentView('event');
  };

  const handleRatingSaved = () => {
    setSelectedWine(null);
    setCurrentView('event');
    // Could refresh event data here if needed
  };

  // Join Event Screen
  const JoinEventScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
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
            />
          </div>
          
          <button
            onClick={joinEvent}
            disabled={loading || !eventCode.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 px-6 rounded-xl font-semibold transition-all"
          >
            {loading ? 'Joining...' : 'Join Event'}
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm text-green-200">
          <p>Don't have an event code?</p>
          <p>Contact your event organizer</p>
        </div>
      </div>
    </div>
  );

  // Event Wines Screen with Location Organization
  const EventWinesScreen = () => {
    // Determine if this is a wine crawl by checking if there are multiple locations
    // If there are multiple locations OR wine-location assignments, it's a wine crawl
    // Otherwise, it's a booth event
    const hasMultipleLocations = winesByLocation.length > 1;
    const hasLocationAssignments = winesByLocation.length > 0;
    
    // For now, assume if there are no location assignments, it's a booth event
    const isBoothEvent = !hasLocationAssignments;
    const isWineCrawl = hasLocationAssignments;

    // Get all wines for booth events (combine location wines + unassigned)
    const allWines = isBoothEvent ? [
      ...winesByLocation.flatMap(location => location.wines),
      ...unassignedWines
    ] : [];

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-5 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{currentEvent?.event_name}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                {currentEvent?.event_date && (
                  <span>{new Date(currentEvent.event_date).toLocaleDateString()}</span>
                )}
                
                {/* Show different location info based on event type */}
                {isBoothEvent && currentEvent?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{currentEvent.location}</span>
                  </div>
                )}
                
                {isWineCrawl && (
                  <div className="flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    <span>Wine Crawl • {winesByLocation.length} stops</span>
                  </div>
                )}
              </div>
              
              {/* Show event description for booth events */}
              {isBoothEvent && currentEvent?.description && (
                <p className="text-sm text-slate-600 mt-2 max-w-md">
                  {currentEvent.description}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              {/* Only show profile button for wine crawls, not booth events */}
              {isWineCrawl && (
                <button 
                  onClick={() => setCurrentView('profile')}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Your Profile"
                >
                  <User size={20} className="text-slate-700" />
                </button>
              )}
              
              {onBackToJoin && (
                <button 
                  onClick={onBackToJoin}
                  className="text-slate-600 hover:text-slate-800 text-sm"
                >
                  ← Leave Event
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Wine Crawl Layout */}
          {isWineCrawl ? (
            <div className="space-y-6">
              {winesByLocation.map((location) => (
                <div key={location.locationName} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  {/* Location Header */}
                  <div className="bg-green-600 text-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white text-green-600 rounded-full flex items-center justify-center font-bold">
                        {location.locationOrder}
                      </div>
                      <div>
                        <h2 className="font-bold text-lg">{location.locationName}</h2>
                        {location.locationAddress && (
                          <p className="text-green-100">{location.locationAddress}</p>
                        )}
                        <p className="text-green-200 text-sm">{location.wines.length} wines to taste</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Wines at this location */}
                  <div className="divide-y divide-slate-100">
                    {location.wines.map((wine) => (
                      <div 
                        key={wine.id} 
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => handleWineClick(wine)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-medium">
                              {wine.tasting_order || wine.location_order || '•'}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{wine.wine_name}</h3>
                              <p className="text-slate-600 text-sm">
                                {wine.producer} • {wine.vintage} • {wine.wine_type}
                              </p>
                              <p className="text-slate-500 text-sm">{wine.price_point}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl mb-1">
                              {wine.wine_type === 'sparkling' ? '🥂' : 
                              wine.wine_type === 'white' ? '🥂' : 
                              wine.wine_type === 'rosé' ? '🌹' : '🍷'}
                            </div>
                            <div className="text-xs text-gray-500">Tap to rate</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Unassigned wines for wine crawl */}
              {unassignedWines.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="bg-slate-600 text-white p-4">
                    <h2 className="font-bold text-lg">Additional Wines</h2>
                    <p className="text-slate-200 text-sm">{unassignedWines.length} wines</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {unassignedWines.map((wine) => (
                      <div 
                        key={wine.id} 
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => handleWineClick(wine)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{wine.wine_name}</h3>
                            <p className="text-slate-600 text-sm">
                              {wine.producer} • {wine.vintage} • {wine.wine_type}
                            </p>
                            <p className="text-slate-500 text-sm">{wine.price_point}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl mb-1">
                              {wine.wine_type === 'sparkling' ? '🥂' : 
                              wine.wine_type === 'white' ? '🥂' : 
                              wine.wine_type === 'rosé' ? '🌹' : '🍷'}
                            </div>
                            <div className="text-xs text-gray-500">Tap to rate</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Booth Event Layout - Simple grid, no numbers or order */
            <div>
              <h2 className="text-lg font-semibold mb-4 text-slate-900">
                Available Wines ({allWines.length})
              </h2>
              
              {allWines.length === 0 ? (
                <div className="text-center py-12">
                  <Wine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Wines Yet</h3>
                  <p className="text-gray-500">The event organizer hasn't added any wines yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {allWines.map((wine) => (
                    <div 
                      key={wine.id} 
                      className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md cursor-pointer transition-all"
                      onClick={() => handleWineClick(wine)}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">
                          {wine.wine_type === 'sparkling' ? '🥂' : 
                          wine.wine_type === 'white' ? '🥂' : 
                          wine.wine_type === 'rosé' ? '🌹' : '🍷'}
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">{wine.wine_name}</h3>
                        <p className="text-slate-600 text-sm mb-1">
                          {wine.producer} {wine.vintage && `• ${wine.vintage}`}
                        </p>
                        <p className="text-slate-500 text-sm capitalize">{wine.wine_type}</p>
                        <p className="text-slate-500 text-xs mt-2">{wine.price_point}</p>
                        
                        {/* Show sommelier notes preview for booth events */}
                        {wine.sommelier_notes && (
                          <p className="text-slate-600 text-xs mt-2 line-clamp-2">
                            {wine.sommelier_notes.length > 80 
                              ? wine.sommelier_notes.substring(0, 80) + '...'
                              : wine.sommelier_notes
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

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

  // Wine Details Screen
  const WineDetailsScreen = () => (
    <WineDetailsInterface 
      wine={selectedWine}
      onBack={handleBackFromWineDetails}
      onRatingSaved={handleRatingSaved}
    />
  );

  // Main render
  if (currentView === 'join') {
    return <JoinEventScreen />;
  }

  if (currentView === 'event') {
    return <EventWinesScreen />;
  }

  if (currentView === 'profile') {
    return <ProfileScreen />;
  }

  if (currentView === 'wineDetails') {
    return <WineDetailsScreen />;
  }

  return <JoinEventScreen />;
};

export default UserInterface;