import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Trash2, Plus, MapPin, Wine, GripVertical, Save } from 'lucide-react';
import WineForm from './WineForm';

const EnhancedCreateEventForm = ({ user, onBack, onEventCreated, editingEvent = null }) => {
  const [eventForm, setEventForm] = useState({
    event_name: '',
    event_date: '',
    location: '', // This becomes the main event location
    description: '',
    wines: []
  });
  
  const [locations, setLocations] = useState([]);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [showWineForm, setShowWineForm] = useState(false);
  const [editingWineIndex, setEditingWineIndex] = useState(null);

  // Load existing event data if editing
  useEffect(() => {
    if (editingEvent) {
      loadEventForEditing();
    }
  }, [editingEvent]);

  const loadEventForEditing = async () => {
    try {
      // Load event details
      setEventForm({
        event_name: editingEvent.event_name,
        event_date: editingEvent.event_date,
        location: editingEvent.location || '',
        description: editingEvent.description || '',
        wines: []
      });

      // Load locations for this event
      const { data: locationsData } = await supabase
        .from('event_locations')
        .select('*')
        .eq('event_id', editingEvent.id)
        .order('location_order');

      // Load wines for this event
      const { data: winesData } = await supabase
        .from('event_wines')
        .select('*')
        .eq('event_id', editingEvent.id)
        .order('location_name, tasting_order');

      setLocations(locationsData || []);
      setEventForm(prev => ({ ...prev, wines: winesData || [] }));

    } catch (error) {
      console.error('Error loading event for editing:', error);
    }
  };

  const addLocation = () => {
    if (!newLocationName.trim()) return;

    const newLocation = {
      id: `temp-${Date.now()}`, // Temporary ID for new locations
      location_name: newLocationName.trim(),
      location_address: newLocationAddress.trim() || null,
      location_order: locations.length + 1,
      isNew: true // Flag to track new locations
    };

    setLocations(prev => [...prev, newLocation]);
    setNewLocationName('');
    setNewLocationAddress('');
  };

  const removeLocation = (locationIndex, locationName) => {
    // Check if any wines are assigned to this location
    const winesAtLocation = eventForm.wines.filter(wine => wine.location_name === locationName);
    
    if (winesAtLocation.length > 0) {
      if (!window.confirm(`This will unassign ${winesAtLocation.length} wines from "${locationName}". Continue?`)) {
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

  const removeWineFromEvent = (index) => {
    setEventForm(prev => ({
      ...prev,
      wines: prev.wines.filter((_, i) => i !== index)
    }));
  };

  const editWine = (index) => {
    setEditingWineIndex(index);
    setShowWineForm(true);
  };

  const saveEvent = async () => {
    if (!eventForm.event_name || !eventForm.event_date) {
      alert('Please fill in event name and date');
      return;
    }

    try {
      let eventData;
      let eventCode;

      if (editingEvent) {
        // Update existing event
        const { data, error: eventError } = await supabase
          .from('tasting_events')
          .update({
            event_name: eventForm.event_name,
            event_date: eventForm.event_date,
            location: eventForm.location,
            description: eventForm.description
          })
          .eq('id', editingEvent.id)
          .select()
          .single();

        if (eventError) throw eventError;
        eventData = data;
        eventCode = editingEvent.event_code;

        // Clear existing locations and wines
        await supabase.from('event_locations').delete().eq('event_id', editingEvent.id);
        await supabase.from('event_wines').delete().eq('event_id', editingEvent.id);

      } else {
        // Create new event
        const { createEventWithCode } = await import('./supabaseHelpers');
        const result = await createEventWithCode({
          admin_id: user.id,
          event_name: eventForm.event_name,
          event_date: eventForm.event_date,
          location: eventForm.location,
          description: eventForm.description
        });

        if (result.error) throw result.error;
        eventData = result.data;
        eventCode = result.eventCode;
      }

      // Save locations
      if (locations.length > 0) {
        const locationsForDB = locations.map((location, index) => ({
          event_id: eventData.id,
          location_name: location.location_name,
          location_address: location.location_address,
          location_notes: location.location_notes || null,
          location_order: index + 1
        }));

        const { error: locationsError } = await supabase
          .from('event_locations')
          .insert(locationsForDB);

        if (locationsError) throw locationsError;
      }

      // Save wines
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
          grape_varieties: wine.grape_varieties?.length > 0 ? wine.grape_varieties : null,
          wine_style: wine.wine_style?.length > 0 ? wine.wine_style : null,
          food_pairings: wine.food_pairings?.length > 0 ? wine.food_pairings : null,
          tasting_notes: (wine.tasting_notes?.appearance || wine.tasting_notes?.aroma || wine.tasting_notes?.taste || wine.tasting_notes?.finish) ? wine.tasting_notes : null,
          winemaker_notes: wine.winemaker_notes || null,
          technical_details: (wine.technical_details?.ph || wine.technical_details?.residual_sugar || wine.technical_details?.total_acidity || wine.technical_details?.aging || wine.technical_details?.production) ? wine.technical_details : null,
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

  if (showWineForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <button 
            onClick={() => {
              setShowWineForm(false);
              setEditingWineIndex(null);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Event
          </button>
        </div>
        <WineForm 
          onWineAdded={handleAddWine}
          locations={locations}
          initialWine={editingWineIndex !== null ? eventForm.wines[editingWineIndex] : null}
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
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Location name (e.g., Downtown Wine Bar)"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Address (optional)"
                    value={newLocationAddress}
                    onChange={(e) => setNewLocationAddress(e.target.value)}
                    className="flex-1 p-3 border rounded focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={addLocation}
                    className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Location List */}
            {locations.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No crawl locations added yet</p>
                <p className="text-sm">Add locations above to organize wines by venue</p>
              </div>
            ) : (
              <div className="space-y-3">
                {locations.map((location, index) => (
                  <div key={location.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{location.location_name}</div>
                        {location.location_address && (
                          <div className="text-sm text-gray-600">{location.location_address}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {eventForm.wines.filter(w => w.location_name === location.location_name).length} wines
                      </span>
                      <button
                        onClick={() => removeLocation(index, location.location_name)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Wines Management */}
        <div className="space-y-6">
          {/* Add Wine Button */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-amber-700">
                <Wine className="w-5 h-5 inline mr-2" />
                Event Wines ({eventForm.wines.length})
              </h3>
              <button
                onClick={() => setShowWineForm(true)}
                className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Wine
              </button>
            </div>

            {/* Unassigned Wines */}
            {unassigned.length > 0 && (
              <div className="mb-4 p-4 bg-amber-50 rounded border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-3">Unassigned Wines</h4>
                <div className="space-y-2">
                  {unassigned.map((wine, wineIndex) => {
                    const actualIndex = eventForm.wines.indexOf(wine);
                    return (
                      <div key={actualIndex} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <div className="font-medium text-sm">{wine.wine_name}</div>
                          <div className="text-xs text-gray-600">{wine.producer}</div>
                        </div>
                        <div className="flex gap-1">
                          {locations.map(location => (
                            <button
                              key={location.id}
                              onClick={() => assignWineToLocation(actualIndex, location.location_name)}
                              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                            >
                              → {location.location_name.substring(0, 8)}...
                            </button>
                          ))}
                          <button
                            onClick={() => editWine(actualIndex)}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
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
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wines by Location */}
            {byLocation.map(location => (
              <div key={location.id} className="mb-4 border rounded-lg overflow-hidden">
                <div className="bg-purple-100 p-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-800">{location.location_name}</span>
                    </div>
                    <span className="text-sm text-purple-600">
                      {location.wines.length} wines
                    </span>
                  </div>
                </div>
                
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

export default EnhancedCreateEventForm;