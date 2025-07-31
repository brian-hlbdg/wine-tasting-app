import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Trash2 } from 'lucide-react';

const CreateEventForm = ({ user, onBack, onEventCreated }) => {
  console.log('CreateEventForm is rendering!', Date.now());
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

  const createEvent = async () => {
    if (!eventForm.event_name || !eventForm.event_date) {
      alert('Please fill in event name and date');
      return;
    }

    console.log('Creating event with wines:', eventForm.wines);

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

      const { error: winesError } = await supabase
        .from('event_wines')
        .insert(winesForDB);

      if (winesError) {
        console.error('Error creating wines:', winesError);
        alert('Event created but error adding wines: ' + winesError.message);
      }
    }

    alert('Event created successfully!');
    setEventForm({ event_name: '', event_date: '', location: '', description: '', wines: [] });
    onEventCreated();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Create New Event</h2>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
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
            value={eventForm.event_name || ''}
            onChange={(e) => {
                const value = e.target.value;
                setEventForm(prev => ({ ...prev, event_name: value }));
              }}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={eventForm.event_date || ''}
              onChange={(e) => {
                const value = e.target.value;
                setEventForm(prev => ({ ...prev, event_date: value }));
              }}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Location"
              value={eventForm.location || ''}
              onChange={(e) => {
                const value = e.target.value;
                setEventForm(prev => ({ ...prev, location: value }));
              }}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <textarea
            placeholder="Event description"
            value={eventForm.description || ''}
            onChange={(e) => {
                const value = e.target.value;
                setEventForm(prev => ({ ...prev, description: value }));
            }}
            rows="3"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Add Wines */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold mb-4 text-purple-700">Add Wines</h3>
        
        <div className="grid gap-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Wine name *"
              value={wineForm.wine_name || ''}
                onChange={(e) => {
                    const value = e.target.value;
                    setWineForm(prev => ({ ...prev, wine_name: value }));
                }}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Producer"
              value={wineForm.producer || ''}
              onChange={(e) => {
                const value = e.target.value;
                setWineForm(prev => ({ ...prev, producer: value }));
              }}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
          <select
            value={wineForm.wine_type}
            onChange={(e) => {
                const value = e.target.value;
                setWineForm(prev => ({ ...prev, wine_type: value }));
            }}
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
              value={wineForm.vintage || ''}
              onChange={(e) => {
                const value = e.target.value;
                setWineForm(prev => ({ ...prev, vintage: value }));
              }}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={wineForm.price_point}
              onChange={(e) => {
                const value = e.target.value;
                setWineForm(prev => ({ ...prev, price_point: value }));
              }}
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
              value={wineForm.region || ''}
              onChange={(e) => {
                const value = e.target.value;
                setWineForm(prev => ({ ...prev, region: value }));
              }}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Country"
              value={wineForm.country || ''}
              onChange={(e) => {
                const value = e.target.value;
                setWineForm(prev => ({ ...prev, country: value }));
              }}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <textarea
            placeholder="Sommelier notes"
            value={wineForm.sommelier_notes || ''}
            onChange={(e) => {
              const value = e.target.value;
              setWineForm(prev => ({ ...prev, sommelier_notes: value }));
            }}
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
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default React.memo(CreateEventForm);