import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Star, ArrowLeft } from 'lucide-react';

const WineRatingForm = ({ wine, onBack, onRatingSaved }) => {
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
      let userId = crypto.randomUUID();
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          display_name: 'Demo Wine Taster',
          phone_number: '+1-demo-' + Date.now().toString().slice(-6),
          is_admin: false
        }])
        .select()
        .single();
      
      if (profileError) {
        const { data: existingUsers } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
      
        if (existingUsers && existingUsers.length > 0) {
          userId = existingUsers[0].id;
        }
      }

      const { data: ratingData, error: ratingError } = await supabase
        .from('user_wine_ratings')
        .insert([{
          user_id: userId,
          event_wine_id: wine.id,
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

      if (selectedDescriptors.length > 0) {
        const { data: descriptorIds } = await supabase
          .from('descriptors')
          .select('id, name')
          .in('name', selectedDescriptors);

        if (descriptorIds && descriptorIds.length > 0) {
          const descriptorInserts = descriptorIds.map(desc => ({
            user_rating_id: ratingData.id,
            descriptor_id: desc.id,
            intensity: 3
          }));

          await supabase.from('user_wine_descriptors').insert(descriptorInserts);
        }
      }

      alert(`Rating saved successfully!\n${wine?.wine_name}: ${rating}/5 stars`);
      
      // Reset form
      setRating(0);
      setNotes('');
      setSelectedDescriptors([]);
      onRatingSaved();

    } catch (error) {
      console.error('Unexpected error saving rating:', error);
      alert('Error saving rating. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold">{wine?.wine_name}</h1>
              <p className="text-sm text-gray-600">{wine?.producer}</p>
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
            {wine?.vintage && <span>{wine.vintage}</span>}
            {wine?.region && <span>{wine.region}</span>}
            <span className="capitalize">{wine?.wine_type}</span>
            {wine?.price_point && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {wine.price_point}
              </span>
            )}
          </div>
          
          {wine?.sommelier_notes && (
            <p className="text-sm text-gray-700 mt-3 italic">
              Sommelier Notes: "{wine.sommelier_notes}"
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
            onClick={onBack}
            className="px-6 py-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default WineRatingForm;