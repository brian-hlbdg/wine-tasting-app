import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Trash2 } from 'lucide-react';
import WineForm from './WineForm';
import { createEventWithCode } from './supabaseHelpers';

const CreateEventForm = ({ user, onBack, onEventCreated }) => {
  // Add debugging to see if this component is actually rendering
  console.log('🔍 CreateEventForm RENDERED with props:', { 
    user: user?.id, 
    onBack: typeof onBack, 
    onEventCreated: typeof onEventCreated 
  });

  const [eventForm, setEventForm] = useState({
    event_name: '',
    event_date: '',
    location: '',
    description: '',
    wines: []
  });

  // Add useEffect to log when component mounts
  useEffect(() => {
    console.log('✅ CreateEventForm component MOUNTED');
    return () => {
      console.log('❌ CreateEventForm component UNMOUNTED');
    };
  }, []);

  const createEvent = async () => {
    if (!eventForm.event_name || !eventForm.event_date) {
      alert('Please fill in event name and date');
      return;
    }

    console.log('Creating event with wines:', eventForm.wines);

    try {
      // Fixed: No more dynamic import - using static import from top of file
      const { data: eventData, error: eventError, eventCode } = await createEventWithCode({
        admin_id: user.id,
        event_name: eventForm.event_name,
        event_date: eventForm.event_date,
        location: eventForm.location,
        description: eventForm.description
      });

      if (eventError) {
        console.error('Error creating event:', eventError);
        alert('Error creating event: ' + eventError.message);
        return;
      }

      // Add wines to the event
      if (eventForm.wines.length > 0) {
        const winesForDB = eventForm.wines.map((wine, index) => ({
          event_id: eventData.id,
          wine_name: wine.wine_name,
          producer: wine.producer || null,
          vintage: wine.vintage ? parseInt(wine.vintage) : null,
          wine_type: wine.wine_type,
          beverage_type: wine.beverage_type || 'Wine',
          region: wine.region || null,
          country: wine.country || null,
          price_point: wine.price_point,
          alcohol_content: wine.alcohol_content ? parseFloat(wine.alcohol_content) : null,
          sommelier_notes: wine.sommelier_notes || null,
          image_url: wine.image_url || null,
          grape_varieties: wine.grape_varieties.length > 0 ? wine.grape_varieties : null,
          wine_style: wine.wine_style.length > 0 ? wine.wine_style : null,
          food_pairings: wine.food_pairings.length > 0 ? wine.food_pairings : null,
          tasting_notes: (wine.tasting_notes.appearance || wine.tasting_notes.aroma || wine.tasting_notes.taste || wine.tasting_notes.finish) ? wine.tasting_notes : null,
          winemaker_notes: wine.winemaker_notes || null,
          technical_details: (wine.technical_details.ph || wine.technical_details.residual_sugar || wine.technical_details.total_acidity || wine.technical_details.aging || wine.technical_details.production) ? wine.technical_details : null,
          awards: wine.awards.length > 0 ? wine.awards : null,
          tasting_order: index + 1
        }));

        const { error: winesError } = await supabase
          .from('event_wines')
          .insert(winesForDB);

        if (winesError) {
          console.error('Error creating wines:', winesError);
          alert('Event created but error adding wines: ' + winesError.message);
        }
      }

      alert(`Event created successfully!\nEvent Code: ${eventCode}\n\nShare this code with your attendees.`);
      setEventForm({ event_name: '', event_date: '', location: '', description: '', wines: [] });
      onEventCreated();
      
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event. Please try again.');
    }
  };

  // Fixed: Use useCallback and add extensive debugging
  const handleAddWine = useCallback((wineData) => {
    console.log('🍷 handleAddWine called with:', wineData);
    console.log('🍷 Current wines:', eventForm.wines.length);
    setEventForm(prev => {
      const newState = {
        ...prev,
        wines: [...prev.wines, wineData]
      };
      console.log('🍷 New wines count:', newState.wines.length);
      return newState;
    });
  }, [eventForm.wines.length]);

  const removeWineFromEvent = useCallback((index) => {
    setEventForm(prev => ({
      ...prev,
      wines: prev.wines.filter((_, i) => i !== index)
    }));
  }, []);

  // Add debugging for the render
  console.log('🔄 About to render. handleAddWine type:', typeof handleAddWine);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Add prominent debug info at top */}
      <div className="bg-yellow-100 p-4 rounded border-2 border-yellow-300">
        <h3 className="font-bold text-yellow-800">🐛 DEBUG INFO</h3>
        <p className="text-yellow-700">CreateEventForm is rendering</p>
        <p className="text-yellow-700">User ID: {user?.id}</p>
        <p className="text-yellow-700">handleAddWine type: {typeof handleAddWine}</p>
        <p className="text-yellow-700">Current wines: {eventForm.wines.length}</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Create New Event</h2>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
          ← Back to Events
        </button>
      </div>

      {/* Event Details */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold mb-4 text-amber-700">Event Details</h3>
        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Event name"
            value={eventForm.event_name || ''}
            onChange={(e) => setEventForm(prev => ({ ...prev, event_name: e.target.value }))}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={eventForm.event_date || ''}
              onChange={(e) => setEventForm(prev => ({ ...prev, event_date: e.target.value }))}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="text"
              placeholder="Location"
              value={eventForm.location || ''}
              onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          <textarea
            placeholder="Event description"
            value={eventForm.description || ''}
            onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
            rows="3"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Wine Form Component */}
      <WineForm 
        onAddWine={handleAddWine}
        key="wine-form"
      />
      {/* Debug info */}
      <div className="text-xs text-gray-500 p-2">
        Debug: handleAddWine type: {typeof handleAddWine}
      </div>

      {/* Wine List */}
      {eventForm.wines.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-medium mb-4">Wines for this event ({eventForm.wines.length}):</h4>
          <div className="space-y-3">
            {eventForm.wines.map((wine, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{wine.wine_name}</span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                      {wine.beverage_type}
                    </span>
                    {wine.wine_style.length > 0 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {wine.wine_style[0]}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {wine.producer && <span>{wine.producer}</span>}
                    {wine.vintage && <span> • {wine.vintage}</span>}
                    {wine.region && <span> • {wine.region}</span>}
                  </div>
                  {wine.grape_varieties.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Grapes: {wine.grape_varieties.map(g => `${g.name} (${g.percentage}%)`).join(', ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeWineFromEvent(index)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors ml-4"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Event Button */}
      <div className="bg-white p-6 rounded-lg border">
        <button
          onClick={createEvent}
          disabled={!eventForm.event_name || !eventForm.event_date}
          className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors"
        >
          Create Event with {eventForm.wines.length} Wine{eventForm.wines.length !== 1 ? 's' : ''}
        </button>
        
        {eventForm.wines.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-2">
            Add at least one wine to create your event
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateEventForm;