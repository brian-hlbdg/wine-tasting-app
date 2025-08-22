import React, { useState } from 'react';
import { Wine, User } from 'lucide-react';
import UserProfile from './UserProfile';
import WineDetailsInterface from './WineDetailsInterface';

const UserInterface = ({ event, onRateWine, onBackToJoin }) => {
  const [currentView, setCurrentView] = useState('event');
  const [selectedWine, setSelectedWine] = useState(null);

  const handleWineSelect = (wine) => {
    setSelectedWine(wine);
    setCurrentView('wineDetails');
  };

  const handleBackFromWineDetails = () => {
    setSelectedWine(null);
    setCurrentView('event');
  };

  const handleRatingSaved = () => {
    setCurrentView('event');
    setSelectedWine(null);
  };

  // Event Wines Screen
  const EventWinesScreen = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{event?.event_name}</h1>
            <span className="text-gray-600 text-sm">
              {event?.event_date ? new Date(event.event_date).toLocaleDateString() : ''}
              {event?.event_wines?.length ? ` • ${event.event_wines.length} wines to taste` : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {onBackToJoin && (
              <button 
                onClick={onBackToJoin}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ← Back
              </button>
            )}
            <button 
              onClick={() => setCurrentView('profile')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <User size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Wine Grid */}
      <div className="p-4">
        {event?.event_wines && event.event_wines.length > 0 ? (
          <div className="grid gap-4">
            {event.event_wines.map((wine, index) => (
              <div 
                key={wine.id} 
                className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleWineSelect(wine)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-medium">
                        #{index + 1}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{wine.wine_type}</span>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{wine.wine_name}</h3>
                    
                    {wine.producer && (
                      <p className="text-gray-600 mb-1">{wine.producer}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {wine.vintage && <span>{wine.vintage}</span>}
                      {wine.region && <span>{wine.region}</span>}
                      {wine.price_point && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {wine.price_point}
                        </span>
                      )}
                    </div>
                    
                    {wine.sommelier_notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        "{wine.sommelier_notes}"
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl">🍷</div>
                    <div className="text-xs text-gray-500 mt-1">Tap to rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Wine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Wines Yet</h3>
            <p className="text-gray-500">The event organizer hasn't added any wines yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Profile Screen
  const ProfileScreen = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('event')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ← Back to Event
          </button>
          <h1 className="text-xl font-bold">Wine Profile</h1>
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
  return (
    <div>
      {currentView === 'event' && <EventWinesScreen />}
      {currentView === 'profile' && <ProfileScreen />}
      {currentView === 'wineDetails' && <WineDetailsScreen />}
    </div>
  );
};

export default UserInterface;