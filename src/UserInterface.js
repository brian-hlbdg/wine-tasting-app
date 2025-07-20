import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Star, Wine, User, ArrowLeft, Plus } from 'lucide-react';
import UserProfile from './UserProfile';

const UserInterface = () => {
  const [currentView, setCurrentView] = useState('join'); // 'join', 'event', 'rating'
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [wines, setWines] = useState([]);
  const [selectedWine, setSelectedWine] = useState(null);
  const [eventCode, setEventCode] = useState('');
  
  // Rating form states
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [selectedDescriptors, setSelectedDescriptors] = useState([]);
  const [isExpertMode, setIsExpertMode] = useState(false);

  // Wine descriptors data
  const descriptorData = {
    aroma: {
      fruit: ['Blackberry', 'Cherry', 'Raspberry', 'Apple', 'Citrus', 'Tropical'],
      floral: ['Rose', 'Violet', 'Jasmine'],
      spice: ['Black Pepper', 'Cinnamon', 'Clove'],
      oak: ['Vanilla', 'Cedar', 'Toast'],
      earth: ['Mineral', 'Forest Floor', 'Mushroom'],
      other: ['Leather', 'Chocolate', 'Coffee']
    },
    taste: {
      fruit: ['Dark Cherry', 'Black Currant', 'Green Apple', 'Lemon'],
      other: ['Dark Chocolate', 'Coffee', 'Honey', 'Butter']
    },
    finish: {
      length: ['Short', 'Medium', 'Long'],
      character: ['Smooth', 'Tannic', 'Crisp', 'Warming']
    }
  };

  // Join event by code
  const joinEvent = async (code) => {
    console.log('Joining event with code:', code);
    
    const { data: eventData, error: eventError } = await supabase
      .from('tasting_events')
      .select(`
        *,
        event_wines (*)
      `)
      .eq('event_code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (eventError) {
      console.error('Error finding event:', eventError);
      alert('Event not found. Please check the code.');
      return;
    }

    console.log('Event found:', eventData);
    setEvent(eventData);
    setWines(eventData.event_wines || []);
    setCurrentView('event');
  };

  // Simple user signup/signin
  const createUser = async (phone) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone
    });
    
    if (error) {
      // For demo, create a simple user profile
      const tempUser = {
        id: 'demo-' + Date.now(),
        phone: phone,
        display_name: 'Wine Lover'
      };
      setUser(tempUser);
      console.log('Demo user created:', tempUser);
    }
  };

  // Toggle descriptor selection
  const toggleDescriptor = (descriptor) => {
    setSelectedDescriptors(prev => 
      prev.includes(descriptor) 
        ? prev.filter(d => d !== descriptor)
        : [...prev, descriptor]
    );
  };

  const saveRating = async () => {
    if (!rating) {
      alert('Please select a rating');
      return;
    }
  
    console.log('Saving rating to database...');
    
    try {
      // For demo, let's use your existing admin user ID
      // Go to Supabase dashboard → Authentication → Users and copy your admin user ID
      // OR we can create a simple demo approach
      
      let userId = user?.id;
      
      // If no user, let's use a known admin user for demo
      if (!userId) {
        // Option 1: Use your admin user ID (get it from Supabase dashboard → Authentication → Users)
        // Replace this with your actual admin user ID:
        userId = '7b7479ec-1424-4ff1-8612-da550a0e682f';
        
        // Option 2: Or let's try to get any existing user from profiles
        const { data: existingUsers } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (existingUsers && existingUsers.length > 0) {
          userId = existingUsers[0].id;
          console.log('Using existing user ID:', userId);
        } else {
          alert('No users found. Please create an admin user first.');
          return;
        }
      }
  
      console.log('Using user ID for rating:', userId);
  
      // Save the rating (this should work now)
      const { data: ratingData, error: ratingError } = await supabase
        .from('user_wine_ratings')
        .insert([{
          user_id: userId,
          event_wine_id: selectedWine.id,
          rating: rating,
          personal_notes: notes || null,
          would_buy: rating >= 4
        }])
        .select()
        .single();
  
      if (ratingError) {
        console.error('Error saving rating:', ratingError);
        alert('Error saving rating: ' + ratingError.message);
        return;
      }
  
      console.log('Rating saved successfully:', ratingData);
      console.log('Saving rating with user ID:', userId);
      console.log('Current user object:', user);
  
      // Save descriptors if any were selected
      if (selectedDescriptors.length > 0) {
        const { data: descriptorIds, error: descriptorError } = await supabase
          .from('descriptors')
          .select('id, name')
          .in('name', selectedDescriptors);
  
        if (!descriptorError && descriptorIds.length > 0) {
          const descriptorInserts = descriptorIds.map(desc => ({
            user_rating_id: ratingData.id,
            descriptor_id: desc.id,
            intensity: 3
          }));
  
          const { error: descError } = await supabase
            .from('user_wine_descriptors')
            .insert(descriptorInserts);
  
          if (descError) {
            console.error('Error saving descriptors:', descError);
          } else {
            console.log('Descriptors saved:', selectedDescriptors);
          }
        }
      }
  
      alert(`Rating saved successfully!\n${selectedWine?.wine_name}: ${rating}/5 stars`);
      
      // Reset form
      setRating(0);
      setNotes('');
      setSelectedDescriptors([]);
      setCurrentView('event');
  
    } catch (error) {
      console.error('Unexpected error saving rating:', error);
      alert('Error saving rating. Please try again.');
    }
  };

  // Join Event Screen
  const JoinEventScreen = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <Wine className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Join Wine Tasting</h1>
          <p className="text-gray-600">Enter the event code to get started</p>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Event Code (e.g. ABC123)"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value.toUpperCase())}
            className="w-full p-4 text-center text-lg font-mono border rounded-lg focus:ring-2 focus:ring-purple-500"
            maxLength="6"
          />
          
          <button
            onClick={() => joinEvent(eventCode)}
            disabled={eventCode.length < 6}
            className="w-full bg-purple-600 text-white py-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Join Event
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-600 text-center mb-3">First time? Quick signup:</p>
          <input
            type="tel"
            placeholder="Phone number"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-3"
          />
          <button
            onClick={() => setUser({id: 'demo', phone: '+1234567890', display_name: 'Demo User'})}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );

  // Event Wines Screen
  const EventWinesScreen = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Wine className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-bold">{event?.event_name}</h1>
          </div>
          <button
            onClick={() => setCurrentView('profile')}
            className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{event?.location}</span>
          <span>{wines.length} wines to taste</span>
        </div>
      </div>
      
      {/* Rest of your wine grid stays the same */}
      <div className="p-4">
        <div className="grid gap-4">
          {wines.map((wine, index) => (
            <div 
              key={wine.id} 
              className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedWine(wine);
                setCurrentView('rating');
              }}
            >
              {/* Your existing wine card content */}
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
      </div>
    </div>
  );

  // Wine Rating Screen
  const WineRatingScreen = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('event')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold">{selectedWine?.wine_name}</h1>
              <p className="text-sm text-gray-600">{selectedWine?.producer}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpertMode(!isExpertMode)}
            className={`text-xs px-3 py-1 rounded-full ${
              isExpertMode 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isExpertMode ? 'Simple' : 'Expert'}
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Wine Info Card */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {selectedWine?.vintage && <span>{selectedWine.vintage}</span>}
            {selectedWine?.region && <span>{selectedWine.region}</span>}
            <span className="capitalize">{selectedWine?.wine_type}</span>
            {selectedWine?.price_point && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {selectedWine.price_point}
              </span>
            )}
          </div>
          
          {selectedWine?.sommelier_notes && (
            <p className="text-sm text-gray-700 mt-3 italic">
              Sommelier Notes: "{selectedWine.sommelier_notes}"
            </p>
          )}
        </div>

        {/* Rating */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">Your Rating</h3>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button 
                key={star}
                onClick={() => setRating(star)}
                className={`w-12 h-12 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
              >
                <Star className="w-full h-full fill-current" />
              </button>
            ))}
          </div>
          
          <textarea
            placeholder="Your tasting notes... (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Expert Mode Descriptors */}
        {isExpertMode && (
          <div className="space-y-4">
            {Object.entries(descriptorData).map(([category, subcategories]) => (
              <div key={category} className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-3 capitalize text-purple-700">{category}</h4>
                {Object.entries(subcategories).map(([subcat, descriptors]) => (
                  <div key={subcat} className="mb-3 last:mb-0">
                    <p className="text-sm font-medium text-gray-600 mb-2 capitalize">{subcat}</p>
                    <div className="flex flex-wrap gap-2">
                      {descriptors.map(descriptor => (
                        <button
                          key={descriptor}
                          onClick={() => toggleDescriptor(descriptor)}
                          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                            selectedDescriptors.includes(descriptor)
                              ? 'bg-purple-100 text-purple-700 border-purple-300'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                          }`}
                        >
                          {descriptor}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={saveRating}
            className="flex-1 bg-purple-600 text-white py-4 rounded-lg font-medium hover:bg-purple-700 text-lg"
          >
            Save Rating
          </button>
          <button 
            onClick={() => setCurrentView('event')}
            className="px-6 py-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div>
      {currentView === 'join' && <JoinEventScreen />}
      {currentView === 'event' && <EventWinesScreen />}
      {currentView === 'rating' && <WineRatingScreen />}
      {currentView === 'profile' && (
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
          <UserProfile userId="7b7479ec-1424-4ff1-8612-da550a0e682f" />
        </div>
      )}
    </div>
  );
};

export default UserInterface;