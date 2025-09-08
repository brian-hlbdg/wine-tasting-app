import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Trash2, Plus, MapPin, Wine, GripVertical, Save, Shield, Users } from 'lucide-react';
import WineForm from './WineForm';

const EnhancedCreateEventForm = ({ user, onBack, onEventCreated, editingEvent = null }) => {
  const [eventForm, setEventForm] = useState({
    event_name: '',
    event_date: '',
    location: '',
    description: '',
    access_type: 'event_code', // New field for booth mode
    wines: []
  });
  
  const [locations, setLocations] = useState([]);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [showWineForm, setShowWineForm] = useState(false);
  const [editingWineIndex, setEditingWineIndex] = useState(null);
  const [saving, setSaving] = useState(false);

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
        access_type: editingEvent.access_type || 'event_code',
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
      id: `temp-${Date.now()}`,
      location_name: newLocationName.trim(),
      location_address: newLocationAddress.trim() || null,
      location_order: locations.length + 1,
      isNew: true
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

  const editWine = (wineIndex) => {
    setEditingWineIndex(wineIndex);
    setShowWineForm(true);
  };

  const removeWineFromEvent = (wineIndex) => {
    setEventForm(prev => ({
      ...prev,
      wines: prev.wines.filter((_, index) => index !== wineIndex)
    }));
  };

  const saveEvent = async () => {
    if (!eventForm.event_name || !eventForm.event_date) {
      alert('Please fill in event name and date');
      return;
    }

    setSaving(true);
    
    try {
      let eventId;
      
      if (editingEvent) {
        // Update existing event
        const { error: eventError } = await supabase
          .from('tasting_events')
          .update({
            event_name: eventForm.event_name,
            event_date: eventForm.event_date,
            location: eventForm.location,
            description: eventForm.description,
            access_type: eventForm.access_type
          })
          .eq('id', editingEvent.id);

        if (eventError) throw eventError;
        eventId = editingEvent.id;
        
      } else {
        // Create new event
        const eventData = {
          event_name: eventForm.event_name,
          event_date: eventForm.event_date,
          location: eventForm.location,
          description: eventForm.description,
          access_type: eventForm.access_type,
          admin_id: user.id,  // Add the admin_id
          is_active: true
        };

        // Generate event code only for event_code access type
        if (eventForm.access_type === 'event_code') {
          const { createEventWithCode } = await import('./supabaseHelpers');
          const { data: newEvent, error: eventError } = await createEventWithCode(eventData);
          
          if (eventError) throw eventError;
          eventId = newEvent.id;
        } else {
          // For email_only access type, create without event code
          const { data: newEvent, error: eventError } = await supabase
            .from('tasting_events')
            .insert([eventData])
            .select()
            .single();
            
          if (eventError) throw eventError;
          eventId = newEvent.id;
        }
      }

      // Save locations
      if (locations.length > 0) {
        // Delete existing locations if editing
        if (editingEvent) {
          await supabase
            .from('event_locations')
            .delete()
            .eq('event_id', eventId);
        }

        // Insert new/updated locations
        const locationsToSave = locations.map(location => ({
          event_id: eventId,
          location_name: location.location_name,
          location_address: location.location_address,
          location_order: location.location_order
        }));

        const { error: locationsError } = await supabase
          .from('event_locations')
          .insert(locationsToSave);

        if (locationsError) throw locationsError;
      }

      // Save wines
      if (eventForm.wines.length > 0) {
        // Delete existing wines if editing
        if (editingEvent) {
          await supabase
            .from('event_wines')
            .delete()
            .eq('event_id', eventId);
        }

        // Insert new/updated wines
        const winesToSave = eventForm.wines.map(wine => ({
          event_id: eventId,
          wine_name: wine.wine_name,
          producer: wine.producer,
          vintage: wine.vintage ? parseInt(wine.vintage) : null,
          wine_type: wine.wine_type,
          beverage_type: wine.beverage_type || 'Wine',
          region: wine.region,
          country: wine.country,
          price_point: wine.price_point,
          alcohol_content: wine.alcohol_content ? parseFloat(wine.alcohol_content) : null,
          sommelier_notes: wine.sommelier_notes,
          image_url: wine.image_url,
          grape_varieties: wine.grape_varieties,
          wine_style: wine.wine_style,
          food_pairings: wine.food_pairings,
          tasting_notes: wine.tasting_notes,
          winemaker_notes: wine.winemaker_notes,
          technical_details: wine.technical_details,
          awards: wine.awards,
          location_name: wine.location_name,
          tasting_order: wine.tasting_order || 999
        }));

        const { error: winesError } = await supabase
          .from('event_wines')
          .insert(winesToSave);

        if (winesError) throw winesError;
      }

      alert(`Event ${editingEvent ? 'updated' : 'created'} successfully!`);
      if (onEventCreated) onEventCreated();

    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Group wines by location for display
  const winesByLocation = locations.map(location => ({
    ...location,
    wines: eventForm.wines.filter(wine => wine.location_name === location.location_name)
  }));

  const unassignedWines = eventForm.wines.filter(wine => !wine.location_name);

  if (showWineForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <WineForm
          onAddWine={handleAddWine}
          onCancel={() => {
            setShowWineForm(false);
            setEditingWineIndex(null);
          }}
          wineData={editingWineIndex !== null ? eventForm.wines[editingWineIndex] : null}
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
          {editingEvent && editingEvent.event_code && (
            <p className="text-gray-600">Event Code: {editingEvent.event_code}</p>
          )}
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
          ← Back to Events
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Event Details & Access Type */}
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

          {/* Access Type Selection */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-4 text-orange-700">Access Type</h3>
            <div className="space-y-4">
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  eventForm.access_type === 'event_code' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setEventForm(prev => ({ ...prev, access_type: 'event_code' }))}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Standard Access (Event Code)</div>
                    <div className="text-sm text-gray-600">
                      Participants need an event code to join. Best for private events or remote tastings.
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  eventForm.access_type === 'email_only' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setEventForm(prev => ({ ...prev, access_type: 'email_only' }))}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Booth Mode (Email Only)</div>
                    <div className="text-sm text-gray-600">
                      Participants only need to enter their email. Perfect for trade shows, retail tastings, or walk-up events.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {eventForm.access_type === 'email_only' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800">
                  <strong>Booth Mode Features:</strong>
                  <ul className="mt-1 ml-4 list-disc">
                    <li>No event code required for users</li>
                    <li>Quick email-only registration</li>
                    <li>Perfect for in-person events</li>
                    <li>All ratings tracked by email address</li>
                    <li>Use this URL format: <code className="bg-green-100 px-1 rounded">yoursite.com/?boothCode=ABC123</code></li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Wine Crawl Locations */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-4 text-green-700">
              <MapPin className="w-5 h-5 inline mr-2" />
              Wine Crawl Locations (Optional)
            </h3>
            
            {/* Add New Location */}
            <div className="space-y-3 mb-4">
              <input
                type="text"
                placeholder="Location name (e.g., 'Vineyard A', 'Tasting Room B')"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <input
                type="text"
                placeholder="Address (optional)"
                value={newLocationAddress}
                onChange={(e) => setNewLocationAddress(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={addLocation}
                disabled={!newLocationName.trim()}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Location
              </button>
            </div>

            {/* Existing Locations */}
            {locations.length > 0 && (
              <div className="space-y-2">
                {locations.map((location, index) => (
                  <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{location.location_name}</div>
                      {location.location_address && (
                        <div className="text-sm text-gray-600">{location.location_address}</div>
                      )}
                    </div>
                    <button
                      onClick={() => removeLocation(index, location.location_name)}
                      className="text-red-600 hover:text-red-800"
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
              <h3 className="font-semibold text-amber-700">
                <Wine className="w-5 h-5 inline mr-2" />
                Event Wines ({eventForm.wines.length})
              </h3>
              <button
                onClick={() => setShowWineForm(true)}
                className="bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Wine
              </button>
            </div>

            {/* Unassigned Wines */}
            {unassignedWines.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Unassigned Wines</h4>
                <div className="space-y-2">
                  {unassignedWines.map((wine) => {
                    const actualIndex = eventForm.wines.indexOf(wine);
                    return (
                      <div key={actualIndex} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div>
                          <div className="font-medium">{wine.wine_name}</div>
                          <div className="text-sm text-gray-600">{wine.producer} • {wine.wine_type}</div>
                        </div>
                        <div className="flex gap-2">
                          {locations.length > 0 && (
                            <select
                              onChange={(e) => assignWineToLocation(actualIndex, e.target.value || null)}
                              className="text-xs border rounded px-2 py-1"
                              defaultValue=""
                            >
                              <option value="">Assign to location...</option>
                              {locations.map(location => (
                                <option key={location.id} value={location.location_name}>
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
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wines by Location */}
            {winesByLocation.map((location) => (
              <div key={location.id} className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-green-100 p-3 border-b border-gray-200">
                  <h4 className="font-medium text-green-800">📍 {location.location_name}</h4>
                  {location.location_address && (
                    <p className="text-sm text-green-700">{location.location_address}</p>
                  )}
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
            disabled={saving}
            className="w-full bg-purple-600 text-white py-4 px-6 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 font-semibold flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : (editingEvent ? 'Save Changes' : 'Create Event')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCreateEventForm;