import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const WineForm = ({ onAddWine }) => {
  console.log('WineForm rendered. onAddWine:', onAddWine, 'Type:', typeof onAddWine);
  
  const [wineForm, setWineForm] = useState({
    wine_name: '',
    producer: '',
    vintage: '',
    wine_type: 'red',
    beverage_type: 'Wine',
    region: '',
    country: '',
    price_point: 'Mid-range',
    alcohol_content: '',
    sommelier_notes: '',
    image_url: '',
    // New advanced fields
    grape_varieties: [],
    wine_style: [],
    food_pairings: [],
    food_pairing_notes: '',
    tasting_notes: {
      appearance: '',
      aroma: '',
      taste: '',
      finish: ''
    },
    winemaker_notes: '',
    technical_details: {
      ph: '',
      residual_sugar: '',
      total_acidity: '',
      aging: '',
      production: ''
    },
    awards: []
  });

  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [newGrapeVariety, setNewGrapeVariety] = useState({ name: '', percentage: '' });
  const [newWineStyle, setNewWineStyle] = useState('');
  const [newAward, setNewAward] = useState('');

  const handleAddWine = () => {
    if (!wineForm.wine_name) {
      alert('Please enter wine name');
      return;
    }

    // Enhanced debugging and fallback handling
    console.log('🔍 handleAddWine triggered');
    console.log('🔍 onAddWine prop:', onAddWine);
    console.log('🔍 onAddWine type:', typeof onAddWine);

    // Fixed: Add prop validation AND fallback behavior
    if (typeof onAddWine !== 'function') {
      console.error('❌ onAddWine is not a function:', onAddWine);
      
      // Emergency fallback: Try to add wine directly to database if we can identify the event
      console.log('🆘 Attempting emergency fallback...');
      
      // Check if we're in an event context (look for event data in window or try to get from URL)
      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get('eventId') || 
                    urlParams.get('event') || 
                    window.eventId || 
                    window.currentEventId ||
                    sessionStorage.getItem('currentEventId') ||
                    localStorage.getItem('currentEventId');
      
      // Also try to find event data in React context or global state
      const eventFromGlobal = window.currentEvent || window.event || window.selectedEvent;
      const eventIdFromGlobal = eventFromGlobal?.id;
      
      const finalEventId = eventId || eventIdFromGlobal;
      
      console.log('🔍 Event ID search results:', {
        urlEventId: urlParams.get('eventId'),
        windowEventId: window.eventId,
        sessionEventId: sessionStorage.getItem('currentEventId'),
        localEventId: localStorage.getItem('currentEventId'),
        globalEvent: eventFromGlobal,
        finalEventId
      });
      
      if (finalEventId) {
        console.log('🆘 Found eventId:', finalEventId, 'Attempting direct wine addition...');
        addWineDirectlyToDatabase(finalEventId, wineForm);
      } else {
        // If no event ID found, let's try a different approach - ask user for event code
        const eventCode = prompt('Unable to determine which event to add wine to.\n\nPlease enter the event code:');
        if (eventCode) {
          addWineToEventByCode(eventCode.toUpperCase(), wineForm);
        } else {
          alert('Error: Unable to add wine. Please refresh the page and try again.\n\nTechnical details: onAddWine prop is missing and no event context found.');
        }
      }
      return;
    }

    try {
      onAddWine(wineForm);

      // Reset form only after successful call
      setWineForm({
        wine_name: '',
        producer: '',
        vintage: '',
        wine_type: 'red',
        beverage_type: 'Wine',
        region: '',
        country: '',
        price_point: 'Mid-range',
        alcohol_content: '',
        sommelier_notes: '',
        image_url: '',
        grape_varieties: [],
        wine_style: [],
        food_pairings: [],
        food_pairing_notes: '',
        tasting_notes: { appearance: '', aroma: '', taste: '', finish: '' },
        winemaker_notes: '',
        technical_details: { ph: '', residual_sugar: '', total_acidity: '', aging: '', production: '' },
        awards: []
      });
      setShowAdvancedFields(false);
    } catch (error) {
      console.error('Error adding wine:', error);
      alert('Error adding wine. Please try again.');
    }
  };

  // Emergency fallback function to add wine directly to database
  const addWineDirectlyToDatabase = async (eventId, wineData) => {
    try {
      console.log('🆘 Emergency: Adding wine directly to database for event:', eventId);
      
      const { supabase } = await import('./supabaseClient');
      
      const wineForDB = {
        event_id: eventId,
        wine_name: wineData.wine_name,
        producer: wineData.producer || null,
        vintage: wineData.vintage ? parseInt(wineData.vintage) : null,
        wine_type: wineData.wine_type,
        beverage_type: wineData.beverage_type || 'Wine',
        region: wineData.region || null,
        country: wineData.country || null,
        price_point: wineData.price_point,
        alcohol_content: wineData.alcohol_content ? parseFloat(wineData.alcohol_content) : null,
        sommelier_notes: wineData.sommelier_notes || null,
        image_url: wineData.image_url || null,
        grape_varieties: wineData.grape_varieties.length > 0 ? wineData.grape_varieties : null,
        wine_style: wineData.wine_style.length > 0 ? wineData.wine_style : null,
        food_pairings: wineData.food_pairings.length > 0 ? wineData.food_pairings : null,
        tasting_notes: (wineData.tasting_notes.appearance || wineData.tasting_notes.aroma || wineData.tasting_notes.taste || wineData.tasting_notes.finish) ? wineData.tasting_notes : null,
        winemaker_notes: wineData.winemaker_notes || null,
        technical_details: (wineData.technical_details.ph || wineData.technical_details.residual_sugar || wineData.technical_details.total_acidity || wineData.technical_details.aging || wineData.technical_details.production) ? wineData.technical_details : null,
        awards: wineData.awards.length > 0 ? wineData.awards : null,
        tasting_order: 999 // Will be updated by admin later
      };

      const { error } = await supabase
        .from('event_wines')
        .insert([wineForDB]);

      if (error) {
        throw error;
      }

      alert('✅ Wine added successfully!\n\nNote: This was added using emergency mode. Please refresh the page to see the updated wine list.');
      
      // Reset form
      resetForm();

    } catch (error) {
      console.error('🆘 Emergency fallback failed:', error);
      alert('Unable to add wine. Please contact support or refresh the page and try again.');
    }
  };

  // Emergency function to add wine by event code
  const addWineToEventByCode = async (eventCode, wineData) => {
    try {
      console.log('🆘 Emergency: Finding event by code:', eventCode);
      
      const { supabase } = await import('./supabaseClient');
      
      // Find event by code
      const { data: event, error: eventError } = await supabase
        .from('tasting_events')
        .select('id')
        .eq('event_code', eventCode)
        .single();

      if (eventError || !event) {
        throw new Error('Event not found with that code');
      }

      // Use the found event ID to add the wine
      await addWineDirectlyToDatabase(event.id, wineData);

    } catch (error) {
      console.error('🆘 Emergency event code lookup failed:', error);
      alert('Unable to find event with that code. Please check the event code and try again.');
    }
  };

  // Helper function to reset form
  const resetForm = () => {
    setWineForm({
      wine_name: '',
      producer: '',
      vintage: '',
      wine_type: 'red',
      beverage_type: 'Wine',
      region: '',
      country: '',
      price_point: 'Mid-range',
      alcohol_content: '',
      sommelier_notes: '',
      image_url: '',
      grape_varieties: [],
      wine_style: [],
      food_pairings: [],
      food_pairing_notes: '',
      tasting_notes: { appearance: '', aroma: '', taste: '', finish: '' },
      winemaker_notes: '',
      technical_details: { ph: '', residual_sugar: '', total_acidity: '', aging: '', production: '' },
      awards: []
    });
    setShowAdvancedFields(false);
  };

  const addGrapeVariety = () => {
    if (newGrapeVariety.name && newGrapeVariety.percentage) {
      setWineForm(prev => ({
        ...prev,
        grape_varieties: [...prev.grape_varieties, { ...newGrapeVariety, percentage: parseInt(newGrapeVariety.percentage) }]
      }));
      setNewGrapeVariety({ name: '', percentage: '' });
    }
  };

  const removeGrapeVariety = (index) => {
    setWineForm(prev => ({
      ...prev,
      grape_varieties: prev.grape_varieties.filter((_, i) => i !== index)
    }));
  };

  const addWineStyle = () => {
    if (newWineStyle && !wineForm.wine_style.includes(newWineStyle)) {
      setWineForm(prev => ({
        ...prev,
        wine_style: [...prev.wine_style, newWineStyle]
      }));
      setNewWineStyle('');
    }
  };

  const removeWineStyle = (index) => {
    setWineForm(prev => ({
      ...prev,
      wine_style: prev.wine_style.filter((_, i) => i !== index)
    }));
  };

  const addAward = () => {
    if (newAward && !wineForm.awards.includes(newAward)) {
      setWineForm(prev => ({
        ...prev,
        awards: [...prev.awards, newAward]
      }));
      setNewAward('');
    }
  };

  const removeAward = (index) => {
    setWineForm(prev => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="font-semibold mb-4 text-amber-700">Add Wine</h3>
      
      {/* Basic Wine Info */}
      <div className="grid gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Wine name"
            value={wineForm.wine_name}
            onChange={(e) => setWineForm(prev => ({ ...prev, wine_name: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
          <input
            type="text"
            placeholder="Producer"
            value={wineForm.producer}
            onChange={(e) => setWineForm(prev => ({ ...prev, producer: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <input
            type="number"
            placeholder="Vintage year"
            value={wineForm.vintage}
            onChange={(e) => setWineForm(prev => ({ ...prev, vintage: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
          
          <select
            value={wineForm.wine_type}
            onChange={(e) => setWineForm(prev => ({ ...prev, wine_type: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="red">Red Wine</option>
            <option value="white">White Wine</option>
            <option value="rosé">Rosé Wine</option>
            <option value="sparkling">Sparkling Wine</option>
            <option value="dessert">Dessert Wine</option>
            <option value="fortified">Fortified Wine</option>
          </select>
          
          <select
            value={wineForm.beverage_type}
            onChange={(e) => setWineForm(prev => ({ ...prev, beverage_type: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="Wine">Wine</option>
            <option value="Spirits">Spirits</option>
            <option value="Beer">Beer</option>
            <option value="Sake">Sake</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Region"
            value={wineForm.region}
            onChange={(e) => setWineForm(prev => ({ ...prev, region: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
          <input
            type="text"
            placeholder="Country"
            value={wineForm.country}
            onChange={(e) => setWineForm(prev => ({ ...prev, country: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <select
            value={wineForm.price_point}
            onChange={(e) => setWineForm(prev => ({ ...prev, price_point: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="Budget">Budget</option>
            <option value="Mid-range">Mid-range</option>
            <option value="Premium">Premium</option>
            <option value="Ultra-Premium">Ultra-Premium</option>
          </select>
          
          <input
            type="number"
            step="0.1"
            placeholder="ABV %"
            value={wineForm.alcohol_content}
            onChange={(e) => setWineForm(prev => ({ ...prev, alcohol_content: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />

          <input
            type="url"
            placeholder="Image URL"
            value={wineForm.image_url}
            onChange={(e) => setWineForm(prev => ({ ...prev, image_url: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <textarea
          placeholder="Sommelier notes"
          value={wineForm.sommelier_notes}
          onChange={(e) => setWineForm(prev => ({ ...prev, sommelier_notes: e.target.value }))}
          rows="2"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Advanced Fields Toggle */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowAdvancedFields(!showAdvancedFields)}
          className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
        >
          {showAdvancedFields ? 'Hide' : 'Show'} Advanced Fields
        </button>
      </div>

      {/* Advanced Fields */}
      {showAdvancedFields && (
        <div className="space-y-6 border-t pt-6">
          
          {/* Grape Varieties */}
          <div>
            <h4 className="font-medium mb-3">Grape Varieties</h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Grape name"
                value={newGrapeVariety.name}
                onChange={(e) => setNewGrapeVariety(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="number"
                placeholder="% (e.g., 85)"
                value={newGrapeVariety.percentage}
                onChange={(e) => setNewGrapeVariety(prev => ({ ...prev, percentage: e.target.value }))}
                className="w-24 p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={addGrapeVariety}
                className="px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {wineForm.grape_varieties.map((grape, index) => (
                <span key={index} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {grape.name} ({grape.percentage}%)
                  <button
                    type="button"
                    onClick={() => removeGrapeVariety(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Wine Style Tags */}
          <div>
            <h4 className="font-medium mb-3">Wine Style Tags</h4>
            <div className="flex gap-2 mb-3">
              <select
                value={newWineStyle}
                onChange={(e) => setNewWineStyle(e.target.value)}
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select style...</option>
                <option value="Full-bodied">Full-bodied</option>
                <option value="Medium-bodied">Medium-bodied</option>
                <option value="Light-bodied">Light-bodied</option>
                <option value="Elegant">Elegant</option>
                <option value="Complex">Complex</option>
                <option value="Structured">Structured</option>
                <option value="Crisp">Crisp</option>
                <option value="Dry">Dry</option>
                <option value="Off-dry">Off-dry</option>
                <option value="Sweet">Sweet</option>
                <option value="Brut">Brut</option>
                <option value="Extra Dry">Extra Dry</option>
              </select>
              <button
                type="button"
                onClick={addWineStyle}
                className="px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {wineForm.wine_style.map((style, index) => (
                <span key={index} className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                  {style}
                  <button
                    type="button"
                    onClick={() => removeWineStyle(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tasting Notes */}
          <div>
            <h4 className="font-medium mb-3">Detailed Tasting Notes</h4>
            <div className="grid gap-3">
              <input
                type="text"
                placeholder="Appearance (e.g., Deep ruby red with hints of purple)"
                value={wineForm.tasting_notes.appearance}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  tasting_notes: { ...prev.tasting_notes, appearance: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Aroma (e.g., Blackberry, vanilla, tobacco)"
                value={wineForm.tasting_notes.aroma}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  tasting_notes: { ...prev.tasting_notes, aroma: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Taste (e.g., Full-bodied with firm tannins)"
                value={wineForm.tasting_notes.taste}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  tasting_notes: { ...prev.tasting_notes, taste: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Finish (e.g., Long and elegant with spicy notes)"
                value={wineForm.tasting_notes.finish}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  tasting_notes: { ...prev.tasting_notes, finish: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Winemaker Notes */}
          <div>
            <h4 className="font-medium mb-3">Winemaker Notes</h4>
            <textarea
              placeholder="Notes from the winemaker about production, philosophy, etc."
              value={wineForm.winemaker_notes}
              onChange={(e) => setWineForm(prev => ({ ...prev, winemaker_notes: e.target.value }))}
              rows="3"
              className="w-full p-3 border rounded focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Technical Details */}
          <div>
            <h4 className="font-medium mb-3">Technical Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.01"
                placeholder="pH (e.g., 3.6)"
                value={wineForm.technical_details.ph}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  technical_details: { ...prev.technical_details, ph: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Residual Sugar (e.g., 2.1 g/L)"
                value={wineForm.technical_details.residual_sugar}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  technical_details: { ...prev.technical_details, residual_sugar: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Total Acidity (e.g., 5.8 g/L)"
                value={wineForm.technical_details.total_acidity}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  technical_details: { ...prev.technical_details, total_acidity: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Aging (e.g., 18 months in French oak)"
                value={wineForm.technical_details.aging}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  technical_details: { ...prev.technical_details, aging: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <input
              type="text"
              placeholder="Production (e.g., Limited production of 130,000 bottles)"
              value={wineForm.technical_details.production}
              onChange={(e) => setWineForm(prev => ({ 
                ...prev, 
                technical_details: { ...prev.technical_details, production: e.target.value }
              }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 mt-3"
            />
          </div>

          {/* Food Pairings */}
          <div>
            <h4 className="font-medium mb-3">Food Pairings</h4>
            <p className="text-sm text-gray-600 mb-3">Add food pairing notes (structured pairings can be added later)</p>
            <textarea
              placeholder="Food pairing notes (e.g., 'Pairs well with red meat, aged cheeses, and game')"
              value={wineForm.food_pairing_notes || ''}
              onChange={(e) => setWineForm(prev => ({ ...prev, food_pairing_notes: e.target.value }))}
              rows="2"
              className="w-full p-3 border rounded focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Awards */}
          <div>
            <h4 className="font-medium mb-3">Awards & Recognition</h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Award (e.g., 98 pts - Wine Spectator)"
                value={newAward}
                onChange={(e) => setNewAward(e.target.value)}
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={addAward}
                className="px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {wineForm.awards.map((award, index) => (
                <span key={index} className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                  🏆 {award}
                  <button
                    type="button"
                    onClick={() => removeAward(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleAddWine}
        className="w-full mt-6 bg-amber-600 text-white px-4 py-3 rounded-lg hover:bg-amber-700 font-medium transition-colors"
      >
        Add Wine to Event
      </button>
      
      {/* Debug info */}
      <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
        Debug: onAddWine prop type: {typeof onAddWine} | Value: {String(onAddWine)}
      </div>
    </div>
  );
};

export default WineForm;