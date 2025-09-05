import React, { useState } from 'react';
import { MapPin, Wine, Plus, Save, Edit, Trash2 } from 'lucide-react';
import { NewEventWineForm } from './WineForms'; // Import the new component

const UpdatedEnhancedCreateEventForm = ({ onBack, onEventCreated, editingEvent = null }) => {
  const [eventForm, setEventForm] = useState({
    event_name: editingEvent?.event_name || '',
    event_date: editingEvent?.event_date || '',
    location: editingEvent?.location || '',
    description: editingEvent?.description || '',
    wines: editingEvent?.wines || []
  });

  const [locations, setLocations] = useState(editingEvent?.locations || []);
  const [newLocation, setNewLocation] = useState({
    location_name: '',
    address: '',
    notes: ''
  });

  // Wine form state
  const [showWineForm, setShowWineForm] = useState(false);
  const [editingWineIndex, setEditingWineIndex] = useState(null);

  // Add location to the wine crawl
  const addLocation = () => {
    if (newLocation.location_name.trim()) {
      setLocations(prev => [...prev, { 
        ...newLocation, 
        location_order: prev.length + 1 
      }]);
      setNewLocation({ location_name: '', address: '', notes: '' });
    }
  };

  const removeLocation = (locationIndex) => {
    const locationName = locations[locationIndex].location_name;
    
    if (eventForm.wines.some(wine => wine.location_name === locationName)) {
      if (!window.confirm(`This location has wines assigned to it. Remove anyway? Wines will be unassigned.`)) {
        return;
      }
      
      // Unassign wines from this location
      setEventForm(prev => ({
        ...prev,
        wines: prev.wines.map(wine => 
          wine.location_name === locationName 
            ? { ...wine, location_name: null }
            : wine
        )
      }));
    }

    setLocations(prev => prev.filter((_, index) => index !== locationIndex));
  };

  // Wine management functions
  const handleAddWine = (wineData) => {
    if (editingWineIndex !== null) {
      // Editing existing wine
      setEventForm(prev => ({
        ...prev,
        wines: prev.wines.map((wine, index) => 
          index === editingWineIndex ? wineData : wine
        )
      }));
      setEditingWineIndex(null);
    } else {
      // Adding new wine
      setEventForm(prev => ({
        ...prev,
        wines: [...prev.wines, wineData]
      }));
    }
    setShowWineForm(false);
  };

  const editWine = (wineIndex) => {
    setEditingWineIndex(wineIndex);
    setShowWineForm(true);
  };

  const removeWineFromEvent = (wineIndex) => {
    if (window.confirm('Are you sure you want to remove this wine?')) {
      setEventForm(prev => ({
        ...prev,
        wines: prev.wines.filter((_, index) => index !== wineIndex)
      }));
    }
  };

  const assignWineToLocation = (wineIndex, locationName) => {
    setEventForm(prev => ({
      ...prev,
      wines: prev.wines.map((wine, index) => 
        index === wineIndex 
          ? { ...wine, location_name: locationName }
          : wine
      )
    }));
  };

  const saveEvent = async () => {
    if (!eventForm.event_name || !eventForm.event_date) {
      alert('Please fill in event name and date');
      return;
    }

    try {
      const { supabase } = await import('./supabaseClient');

      let eventId;
      let eventCode;

      if (editingEvent) {
        // Update existing event
        const { error: eventError } = await supabase
          .from('tasting_events')
          .update({
            event_name: eventForm.event_name,
            event_date: eventForm.event_date,
            location: eventForm.location,
            description: eventForm.description
          })
          .eq('id', editingEvent.id);

        if (eventError) throw eventError;
        
        eventId = editingEvent.id;
        eventCode = editingEvent.event_code;

        // Delete existing wines and locations for this event
        await supabase.from('event_wines').delete().eq('event_id', eventId);
        await supabase.from('wine_crawl_locations').delete().eq('event_id', eventId);
      } else {
        // Create new event
        eventCode = Math.random().toString(36).substr(2, 8).toUpperCase();
        
        const { data: eventData, error: eventError } = await supabase
          .from('tasting_events')
          .insert([{
            event_name: eventForm.event_name,
            event_date: eventForm.event_date,
            location: eventForm.location,
            description: eventForm.description,
            event_code: eventCode,
            created_by: 'admin' // You might want to get this from auth context
          }])
          .select()
          .single();

        if (eventError) throw eventError;
        eventId = eventData.id;
      }

      // Save locations
      if (locations.length > 0) {
        const locationsForDB = locations.map((location, index) => ({
          event_id: eventId,
          location_name: location.location_name,
          address: location.address || null,
          notes: location.notes || null,
          location_order: index + 1
        }));

        const { error: locationsError } = await supabase
          .from('wine_crawl_locations')
          .insert(locationsForDB);

        if (locationsError) throw locationsError;
      }

      // Save wines
      if (eventForm.wines.length > 0) {
        const winesForDB = eventForm.wines.map((wine, index) => ({
          event_id: eventId,
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
          grape_varieties: wine.grape_varieties?.length > 0 ? wine.grape_varieties : null,
          wine_style: wine.wine_style?.length > 0 ? wine.wine_style : null,
          food_pairings: wine.food_pairings?.length > 0 ? wine.food_pairings : null,
          food_pairing_notes: wine.food_pairing_notes || null,
          tasting_notes: (wine.tasting_notes?.appearance || wine.tasting_notes?.aroma || 
                         wine.tasting_notes?.taste || wine.tasting_notes?.finish) ? 
                         wine.tasting_notes : null,
          winemaker_notes: wine.winemaker_notes || null,
          technical_details: (wine.technical_details?.ph || wine.technical_details?.residual_sugar || 
                             wine.technical_details?.total_acidity || wine.technical_details?.aging || 
                             wine.technical_details?.production) ? wine.technical_details : null,
          awards: wine.awards?.length > 0 ? wine.awards : null,
          location_name: wine.location_name || null,
          location_order: wine.location_order || 1,
          tasting_order: index + 1
        }));

        const { error: winesError } = await supabase
          .from('event_wines')
          .insert(winesForDB);

        if (winesError) throw winesError;
      }

      const message = editingEvent 
        ? 'Event updated successfully!' 
        : `Event created successfully!\nEvent Code: ${eventCode}\n\nShare this code with your attendees.`;
      
      alert(message);
      
      if (!editingEvent) {
        setEventForm({ event_name: '', event_date: '', location: '', description: '', wines: [] });
        setLocations([]);
      }
      
      onEventCreated();

    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event: ' + error.message);
    }
  };

  // Group wines by location for display
  const organizeWinesByLocation = () => {
    const unassigned = eventForm.wines.filter(wine => !wine.location_name);
    const byLocation = locations.map(location => ({
      ...location,
      wines: eventForm.wines.filter(wine => wine.location_name === location.location_name)
    }));
    return { unassigned, byLocation };
  };

  const { unassigned, byLocation } = organizeWinesByLocation();

  // Show wine form if requested
  if (showWineForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <NewEventWineForm
          onWineAdded={handleAddWine}
          locations={locations}
          initialWine={editingWineIndex !== null ? eventForm.wines[editingWineIndex] : null}
          onCancel={() => {
            setShowWineForm(false);
            setEditingWineIndex(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </h1>
          {editingEvent && (
            <p className="text-gray-600">Event Code: {editingEvent.event_code}</p>
          )}
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
          ← Back to Events
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Event Details & Locations */}
        <div className="space-y-6">
          {/* Event Details */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-4 text-purple-700">Event Details</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Event name"
                value={eventForm.event_name}
                onChange={(e) => setEventForm(prev => ({ ...prev, event_name: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm(prev => ({ ...prev, event_date: e.target.value }))}
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="Main location/venue"
                  value={eventForm.location}
                  onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                  className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <textarea
                placeholder="Event description"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Wine Crawl Locations */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-4 text-green-700">
              <MapPin className="w-5 h-5 inline mr-2" />
              Wine Crawl Locations
            </h3>
            
            {/* Add New Location */}
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Location name"
                value={newLocation.location_name}
                onChange={(e) => setNewLocation(prev => ({ ...prev, location_name: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Address (optional)"
                value={newLocation.address}
                onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <textarea
                placeholder="Notes (optional)"
                value={newLocation.notes}
                onChange={(e) => setNewLocation(prev => ({ ...prev, notes: e.target.value }))}
                rows="2"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={addLocation}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Location
              </button>
            </div>

            {/* Existing Locations */}
            {locations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Locations ({locations.length})</h4>
                {locations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div>
                      <div className="font-medium">{location.location_name}</div>
                      {location.address && <div className="text-sm text-gray-600">{location.address}</div>}
                    </div>
                    <button
                      onClick={() => removeLocation(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Wines */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-700">
                <Wine className="w-5 h-5 inline mr-2" />
                Event Wines ({eventForm.wines.length})
              </h3>
              <button
                onClick={() => setShowWineForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Wine
              </button>
            </div>

            {/* Unassigned Wines */}
            {unassigned.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  Unassigned Wines ({unassigned.length})
                </h4>
                <div className="space-y-2">
                  {unassigned.map((wine) => {
                    const actualIndex = eventForm.wines.indexOf(wine);
                    return (
                      <div key={actualIndex} className="p-3 bg-gray-50 rounded border-l-4 border-gray-400">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{wine.wine_name}</div>
                            <div className="text-sm text-gray-600">{wine.producer} • {wine.wine_type}</div>
                          </div>
                          <div className="flex gap-1">
                            {locations.length > 0 && (
                              <select
                                onChange={(e) => assignWineToLocation(actualIndex, e.target.value)}
                                className="text-xs bg-white border rounded px-2 py-1"
                              >
                                <option value="">Assign to location</option>
                                {locations.map((location, locIndex) => (
                                  <option key={locIndex} value={location.location_name}>
                                    {location.location_name}
                                  </option>
                                ))}
                              </select>
                            )}
                            <button
                              onClick={() => editWine(actualIndex)}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeWineFromEvent(actualIndex)}
                              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wines by Location */}
            {byLocation.map((location, locationIndex) => (
              <div key={locationIndex} className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  {location.location_name} ({location.wines.length} wines)
                </h4>
                {location.wines.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No wines assigned to this location yet
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {location.wines.map((wine) => {
                      const actualIndex = eventForm.wines.indexOf(wine);
                      return (
                        <div key={actualIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium text-sm">{wine.wine_name}</div>
                            <div className="text-xs text-gray-600">{wine.producer} • {wine.wine_type}</div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => editWine(actualIndex)}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => assignWineToLocation(actualIndex, null)}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                            >
                              Unassign
                            </button>
                            <button
                              onClick={() => removeWineFromEvent(actualIndex)}
                              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {eventForm.wines.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Wine className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No wines added yet</p>
                <p className="text-sm">Click "Add Wine" to get started</p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={saveEvent}
            className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 font-semibold flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {editingEvent ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatedEnhancedCreateEventForm;