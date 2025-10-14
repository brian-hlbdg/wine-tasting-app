import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import WineNameInput from './WineNameInput';
import LocationInput from './LocationInput';

const WineForm = ({ onAddWine }) => {
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
    tasting_notes: { appearance: '', aroma: '', taste: '', finish: '' },
    winemaker_notes: '',
    technical_details: { ph: '', residual_sugar: '', total_acidity: '', aging: '', production: '' },
    awards: []
  });

  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [newGrapeVariety, setNewGrapeVariety] = useState({ name: '', percentage: '' });
  const [newWineStyle, setNewWineStyle] = useState('');
  const [newAward, setNewAward] = useState('');
  const [locationName, setLocationName] = useState('');
  const [selectedWine, setSelectedWine] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Auto-fill form when wine is selected from database
  const handleWineSelected = (wine) => {
    console.log('Wine selected from database:', wine);
    setSelectedWine(wine);
    
    // Auto-fill form fields with wine data
    setWineForm(prev => ({
      ...prev,
      wine_name: wine.wine_name || prev.wine_name,
      producer: wine.producer || prev.producer,
      vintage: wine.vintage?.toString() || prev.vintage,
      wine_type: wine.wine_type || prev.wine_type,
      region: wine.region || prev.region,
      country: wine.country || prev.country,
      price_point: wine.price_point || prev.price_point,
      alcohol_content: wine.alcohol_content?.toString() || prev.alcohol_content,
      sommelier_notes: wine.sommelier_notes || prev.sommelier_notes,
      image_url: wine.image_url || prev.image_url,
      // Advanced fields from database if available
      grape_varieties: wine.grape_varieties || prev.grape_varieties,
      wine_style: wine.wine_style || prev.wine_style,
      food_pairings: wine.food_pairings || prev.food_pairings,
      food_pairing_notes: wine.food_pairing_notes || prev.food_pairing_notes,
      tasting_notes: wine.tasting_notes || prev.tasting_notes,
      winemaker_notes: wine.winemaker_notes || prev.winemaker_notes,
      technical_details: wine.technical_details || prev.technical_details,
      awards: wine.awards || prev.awards
    }));
    
    // If wine has advanced data, show advanced fields
    if (wine.grape_varieties?.length || wine.wine_style?.length || wine.tasting_notes) {
      setShowAdvancedFields(true);
    }
  };

  const handleLocationSelected = (location) => {
    console.log('Location selected from database:', location);
    setSelectedLocation(location);
  };

  const handleSubmit = () => {
    if (!wineForm.wine_name) {
      alert('Please enter wine name');
      return;
    }

    // Include location in wine data if selected
    const wineData = {
      ...wineForm,
      location_name: locationName || null
    };

    if (!onAddWine) {
      // Emergency fallback logic from your existing code
      console.log('No onAddWine prop provided, attempting direct database save...');
      // Add your existing emergency logic here
      return;
    }

    try {
      onAddWine(wineData);
      resetForm();
    } catch (error) {
      console.error('Error adding wine:', error);
      alert('Error adding wine. Please try again.');
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
    setLocationName('');
    setSelectedWine(null);
    setSelectedLocation(null);
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
      
      {/* Auto-fill Status Indicators */}
      {selectedWine && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-sm text-amber-700">
            ✅ <strong>Auto-filled from database:</strong> {selectedWine.wine_name} 
            {selectedWine.producer && ` by ${selectedWine.producer}`}
          </div>
        </div>
      )}
      
      {selectedLocation && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-700">
            ✅ <strong>Location selected:</strong> {selectedLocation.location_name}
          </div>
        </div>
      )}
      
      {/* Basic Wine Info - Enhanced with type-ahead */}
      <div className="grid gap-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* ENHANCED: Wine Name Input with type-ahead search */}
          <WineNameInput
            value={wineForm.wine_name}
            onChange={(value) => setWineForm(prev => ({ ...prev, wine_name: value }))}
            onWineSelected={handleWineSelected}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
            placeholder="Wine name (start typing to search)"
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

      {/* ENHANCED: Location Section with type-ahead */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Event Location (Optional)</h4>
        <LocationInput
          value={locationName}
          onChange={setLocationName}
          onLocationSelected={handleLocationSelected}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          placeholder="Location (start typing to search)"
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
            <h4 className="font-medium mb-3">Wine Style</h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Style descriptor (e.g., Full-bodied, Elegant)"
                value={newWineStyle}
                onChange={(e) => setNewWineStyle(e.target.value)}
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
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
                <span key={index} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
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
            <h4 className="font-medium mb-3">Tasting Notes</h4>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Appearance (e.g., Deep ruby red)"
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
              rows="2"
              className="w-full p-3 border rounded focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Technical Details */}
          <div>
            <h4 className="font-medium mb-3">Technical Details</h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <input
                type="number"
                step="0.01"
                placeholder="pH (e.g., 3.5)"
                value={wineForm.technical_details.ph}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  technical_details: { ...prev.technical_details, ph: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Residual Sugar (g/L)"
                value={wineForm.technical_details.residual_sugar}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  technical_details: { ...prev.technical_details, residual_sugar: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Total Acidity (g/L)"
                value={wineForm.technical_details.total_acidity}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  technical_details: { ...prev.technical_details, total_acidity: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <input
                type="text"
                placeholder="Production (e.g., Hand-harvested, wild fermentation)"
                value={wineForm.technical_details.production}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  technical_details: { ...prev.technical_details, production: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Food Pairings */}
          <div>
            <h4 className="font-medium mb-3">Food Pairings</h4>
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
                placeholder="Award or recognition (e.g., '90 Points - Wine Spectator')"
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
                <span key={index} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {award}
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

      {/* Submit Button */}
      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 bg-amber-600 text-white py-3 px-6 rounded-lg hover:bg-amber-700 transition-colors"
        >
          Add Wine
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default WineForm;