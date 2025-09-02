import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Plus, X } from 'lucide-react';

const AddWineToEventForm = ({ eventId, eventName, onBack, onWineAdded }) => {
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
  const [saving, setSaving] = useState(false);

  const handleAddWineToEvent = async () => {
    if (!wineForm.wine_name) {
      alert('Please enter wine name');
      return;
    }

    if (!eventId) {
      alert('Error: No event selected');
      return;
    }

    setSaving(true);

    try {
      // Get the next tasting order for this event
      const { data: existingWines } = await supabase
        .from('event_wines')
        .select('tasting_order')
        .eq('event_id', eventId)
        .order('tasting_order', { ascending: false })
        .limit(1);

      const nextTastingOrder = existingWines && existingWines.length > 0 
        ? (existingWines[0].tasting_order || 0) + 1 
        : 1;

      // Prepare wine data for database
      const wineForDB = {
        event_id: eventId,
        wine_name: wineForm.wine_name,
        producer: wineForm.producer || null,
        vintage: wineForm.vintage ? parseInt(wineForm.vintage) : null,
        wine_type: wineForm.wine_type,
        beverage_type: wineForm.beverage_type || 'Wine',
        region: wineForm.region || null,
        country: wineForm.country || null,
        price_point: wineForm.price_point,
        alcohol_content: wineForm.alcohol_content ? parseFloat(wineForm.alcohol_content) : null,
        sommelier_notes: wineForm.sommelier_notes || null,
        image_url: wineForm.image_url || null,
        grape_varieties: wineForm.grape_varieties.length > 0 ? wineForm.grape_varieties : null,
        wine_style: wineForm.wine_style.length > 0 ? wineForm.wine_style : null,
        food_pairings: wineForm.food_pairings.length > 0 ? wineForm.food_pairings : null,
        tasting_notes: (wineForm.tasting_notes.appearance || wineForm.tasting_notes.aroma || wineForm.tasting_notes.taste || wineForm.tasting_notes.finish) ? wineForm.tasting_notes : null,
        winemaker_notes: wineForm.winemaker_notes || null,
        technical_details: (wineForm.technical_details.ph || wineForm.technical_details.residual_sugar || wineForm.technical_details.total_acidity || wineForm.technical_details.aging || wineForm.technical_details.production) ? wineForm.technical_details : null,
        awards: wineForm.awards.length > 0 ? wineForm.awards : null,
        tasting_order: nextTastingOrder
      };

      // Save directly to database
      const { error } = await supabase
        .from('event_wines')
        .insert([wineForDB]);

      if (error) {
        throw error;
      }

      alert(`✅ Wine "${wineForm.wine_name}" added successfully to ${eventName}!`);
      
      // Reset form
      resetForm();
      
      // Notify parent component if callback provided
      if (onWineAdded) {
        onWineAdded();
      }

    } catch (error) {
      console.error('Error adding wine to event:', error);
      alert('Error adding wine: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ← Back to Event
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Add Wine</h1>
              <p className="text-slate-600 text-sm">Adding to: {eventName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wine Form */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          
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

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6 pt-6 border-t">
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Clear Form
            </button>
            <button
              onClick={handleAddWineToEvent}
              disabled={saving || !wineForm.wine_name}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              {saving ? 'Adding Wine...' : 'Add Wine to Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWineToEventForm;