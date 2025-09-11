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

  // Complete updated EventWinesScreen component with fixed allWines references
  // This removes the user profile button and updates the header content for booth events

  const EventWinesScreen = () => {
    const isWineCrawl = winesByLocation.length > 0;
    // Fix: Use currentEvent.event_wines instead of undefined allWines
    const allWines = currentEvent?.event_wines || [];

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Updated Header */}
        <div className="bg-white border-b border-slate-200 p-5 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{currentEvent?.event_name}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                {/* Always show the date */}
                {currentEvent?.event_date && (
                  <span>{new Date(currentEvent.event_date).toLocaleDateString()}</span>
                )}
                
                {/* For Wine Crawl events - show navigation info */}
                {isWineCrawl && (
                  <div className="flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    <span>Wine Crawl • {winesByLocation.length} stops</span>
                  </div>
                )}
                
                {/* For Booth events - show description/tagline instead of location */}
                {!isWineCrawl && currentEvent?.description && (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-700 italic">{currentEvent.description}</span>
                  </div>
                )}
                
                {/* Fallback: show location only if no description and not a wine crawl */}
                {!isWineCrawl && !currentEvent?.description && currentEvent?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{currentEvent.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side - only Leave Event button, no user profile button */}
            <div className="flex gap-2">
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
            <div>
              {winesByLocation.map((location, locationIndex) => (
                <div key={location.locationName} className="mb-8 bg-white rounded-lg shadow-sm border">
                  {/* Location Header */}
                  <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {locationIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{location.locationName}</h3>
                        {location.locationAddress && (
                          <p className="text-green-100 text-sm">{location.locationAddress}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-green-100 text-sm">
                      <p>
                        {location.wines.length} wine{location.wines.length !== 1 ? 's' : ''} to taste
                      </p>
                    </div>
                  </div>

                  {/* Wines at this location */}
                  <div className="p-4">
                    {location.wines.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        No wines at this location yet
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {location.wines.map((wine, wineIndex) => (
                          <div 
                            key={wine.id} 
                            onClick={() => handleWineClick(wine)}
                            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="bg-green-100 text-green-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                                  {wineIndex + 1}
                                </div>
                                <div>
                                  <div className="font-medium">{wine.wine_name}</div>
                                  <div className="text-sm text-gray-600">
                                    {wine.producer}
                                    {wine.vintage && ` • ${wine.vintage}`}
                                    {wine.wine_type && ` • ${wine.wine_type}`}
                                  </div>
                                  {wine.price_point && (
                                    <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      {wine.price_point}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl">
                                  {wine.wine_type === 'sparkling' ? '🥂' : 
                                  wine.wine_type === 'white' ? '🥂' : 
                                  wine.wine_type === 'rosé' ? '🌹' : '🍷'}
                                </div>
                                <div className="text-xs text-gray-500">Tap to rate</div>
                              </div>
                            </div>
                            
                            {wine.sommelier_notes && (
                              <div className="mt-3 p-3 bg-amber-50 rounded text-sm text-amber-800 border-l-4 border-amber-300">
                                <strong>Notes:</strong> {wine.sommelier_notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Unassigned wines (if any) */}
              {unassignedWines.length > 0 && (
                <div className="bg-gray-50 rounded-lg border p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Wine className="w-5 h-5" />
                    Additional Wines
                  </h3>
                  <div className="grid gap-3">
                    {unassignedWines.map((wine) => (
                      <div 
                        key={wine.id} 
                        onClick={() => handleWineClick(wine)}
                        className="border rounded-lg p-3 hover:bg-white cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{wine.wine_name}</div>
                            <div className="text-sm text-gray-600">
                              {wine.producer}
                              {wine.vintage && ` • ${wine.vintage}`}
                              {wine.wine_type && ` • ${wine.wine_type}`}
                            </div>
                          </div>
                          <div className="text-2xl">
                            {wine.wine_type === 'sparkling' ? '🥂' : 
                            wine.wine_type === 'white' ? '🥂' : 
                            wine.wine_type === 'rosé' ? '🌹' : '🍷'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Regular Single-Location Layout (Booth Events) */
            <div>
              <h2 className="text-lg font-semibold mb-4">Event Wines ({allWines.length})</h2>
              
              {allWines.length === 0 ? (
                <div className="text-center py-12">
                  <Wine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Wines Yet</h3>
                  <p className="text-gray-500">The event organizer hasn't added any wines yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {allWines.map((wine, index) => (
                    <div 
                      key={wine.id} 
                      onClick={() => handleWineClick(wine)}
                      className="bg-white border rounded-lg p-4 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-medium text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{wine.wine_name}</div>
                            <div className="text-sm text-gray-600">
                              {wine.producer}
                              {wine.vintage && ` • ${wine.vintage}`}
                              {wine.wine_type && ` • ${wine.wine_type}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl">
                            {wine.wine_type === 'sparkling' ? '🥂' : 
                            wine.wine_type === 'white' ? '🥂' : 
                            wine.wine_type === 'rosé' ? '🌹' : '🍷'}
                          </div>
                          <div className="text-xs text-gray-500">Tap to rate</div>
                        </div>
                      </div>

                      {wine.sommelier_notes && (
                        <div className="mt-3 p-3 bg-amber-50 rounded text-sm text-amber-800 border-l-4 border-amber-300">
                          <strong>Notes:</strong> {wine.sommelier_notes}
                        </div>
                      )}
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