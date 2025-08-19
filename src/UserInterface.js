import React, { useState } from 'react';
import { Wine, User, MapPin, Calendar, Star, Award, Grape } from 'lucide-react';
import UserProfile from './UserProfile';

const UserInterface = ({ event, onRateWine, onBackToJoin }) => {
  const [currentView, setCurrentView] = useState('event');

  // if (!event) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
  //       <div className="text-center">
  //         <Wine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  //         <h2 className="text-xl font-bold text-gray-700 mb-2">No Event Selected</h2>
  //         <p className="text-gray-500 mb-4">Please join an event first</p>
  //         <button 
  //           onClick={() => {
  //             console.log('Back to Join clicked, onBackToJoin function:', onBackToJoin);
  //             if (onBackToJoin) {
  //               onBackToJoin();
  //             } else {
  //               console.error('onBackToJoin function not provided');
  //             }
  //           }}
  //           className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-all duration-200"
  //         >
  //           ← Leave
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }
    // Instead, if no event, just redirect back
    if (!event) {
      onBackToJoin && onBackToJoin();
      return <div>Redirecting...</div>;
    }


  const EventWinesScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBackToJoin}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-all duration-200"
              >
                ← Leave
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {event?.event_name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  {event?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  )}
                  {event?.event_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setCurrentView('profile')}
              className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 rounded-xl hover:from-purple-200 hover:to-pink-200 transition-all duration-200"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
          
          {/* Event Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-purple-600">
              <Wine className="w-4 h-4" />
              <span className="font-medium">{event?.event_wines?.length || 0} wines to discover</span>
            </div>
            <div className="text-gray-500">Tap any wine to begin tasting</div>
          </div>
        </div>
      </div>

      {/* Enhanced Wine Grid */}
      <div className="p-6">
        <div className="grid gap-6">
          {(event.event_wines || []).map((wine, index) => (
            <div 
              key={wine.id} 
              className="group bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:bg-white/80"
              onClick={() => onRateWine && onRateWine(wine)}
            >
              <div className="flex items-start gap-4">
                {/* Wine Number & Type Badge */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-purple-600">#{index + 1}</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                      {wine.wine_type}
                    </div>
                  </div>
                </div>
                
                {/* Wine Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">
                        {wine.wine_name}
                      </h3>
                      {wine.producer && (
                        <p className="text-gray-600 font-medium">{wine.producer}</p>
                      )}
                    </div>
                    <div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">
                      🍷
                    </div>
                  </div>
                  
                  {/* Wine Attributes */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {wine.vintage && (
                      <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        <Calendar className="w-3 h-3" />
                        {wine.vintage}
                      </div>
                    )}
                    {wine.region && (
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                        <MapPin className="w-3 h-3" />
                        {wine.region}
                      </div>
                    )}
                    {wine.price_point && (
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        <Award className="w-3 h-3" />
                        {wine.price_point}
                      </div>
                    )}
                  </div>
                  
                  {/* Sommelier Notes */}
                  {wine.sommelier_notes && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-l-4 border-purple-200">
                      <div className="flex items-start gap-2">
                        <Grape className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-700 mb-1">Sommelier Notes</p>
                          <p className="text-sm text-gray-700 italic">"{wine.sommelier_notes}"</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Tasting Call-to-Action */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Ready to taste?</span>
                      <div className="flex items-center gap-2 text-purple-600 group-hover:text-purple-700">
                        <Star className="w-4 h-4" />
                        <span className="text-sm font-medium">Rate & Review</span>
                        <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No wines message */}
        {(!event.event_wines || event.event_wines.length === 0) && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Wine className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Wines Added Yet</h3>
            <p className="text-gray-500">The event organizer is still curating the wine selection.</p>
          </div>
        )}
      </div>
    </div>
  );

  const ProfileScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('event')}
            className="p-2 hover:bg-white/50 rounded-lg transition-all duration-200"
          >
            ← Back to Event
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Wine Profile
          </h1>
        </div>
      </div>
      <UserProfile />
    </div>
  );

  return (
    <div>
      {currentView === 'event' && <EventWinesScreen />}
      {currentView === 'profile' && <ProfileScreen />}
    </div>
  );
};

export default UserInterface;