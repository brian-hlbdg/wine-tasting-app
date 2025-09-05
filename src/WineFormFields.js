import React from 'react';
import { Plus, X } from 'lucide-react';

const WineFormFields = ({ 
  wineForm, 
  setWineForm, 
  showAdvancedFields, 
  setShowAdvancedFields,
  newGrapeVariety,
  setNewGrapeVariety,
  newWineStyle,
  setNewWineStyle,
  newAward,
  setNewAward,
  locations = []
}) => {
  
  const addGrapeVariety = () => {
    if (newGrapeVariety.name && newGrapeVariety.percentage) {
      setWineForm(prev => ({
        ...prev,
        grape_varieties: [...prev.grape_varieties, { 
          ...newGrapeVariety, 
          percentage: parseInt(newGrapeVariety.percentage) 
        }]
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

  const addFoodPairing = () => {
    const pairing = document.getElementById('food-pairing-input').value.trim();
    if (pairing && !wineForm.food_pairings.includes(pairing)) {
      setWineForm(prev => ({
        ...prev,
        food_pairings: [...prev.food_pairings, pairing]
      }));
      document.getElementById('food-pairing-input').value = '';
    }
  };

  const removeFoodPairing = (index) => {
    setWineForm(prev => ({
      ...prev,
      food_pairings: prev.food_pairings.filter((_, i) => i !== index)
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
    <div className="space-y-6">
      {/* Basic Wine Information */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold mb-4 text-purple-700">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Wine name *"
              value={wineForm.wine_name}
              onChange={(e) => setWineForm(prev => ({ ...prev, wine_name: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          
          <input
            type="text"
            placeholder="Producer/Winery"
            value={wineForm.producer}
            onChange={(e) => setWineForm(prev => ({ ...prev, producer: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          
          <input
            type="number"
            placeholder="Vintage year"
            value={wineForm.vintage}
            onChange={(e) => setWineForm(prev => ({ ...prev, vintage: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          
          <select
            value={wineForm.wine_type}
            onChange={(e) => setWineForm(prev => ({ ...prev, wine_type: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="red">Red Wine</option>
            <option value="white">White Wine</option>
            <option value="rosé">Rosé</option>
            <option value="sparkling">Sparkling</option>
            <option value="dessert">Dessert Wine</option>
            <option value="fortified">Fortified</option>
          </select>
          
          <select
            value={wineForm.beverage_type}
            onChange={(e) => setWineForm(prev => ({ ...prev, beverage_type: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="Wine">Wine</option>
            <option value="Beer">Beer</option>
            <option value="Spirits">Spirits</option>
            <option value="Cocktail">Cocktail</option>
            <option value="Non-alcoholic">Non-alcoholic</option>
          </select>
          
          <input
            type="text"
            placeholder="Region"
            value={wineForm.region}
            onChange={(e) => setWineForm(prev => ({ ...prev, region: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          
          <input
            type="text"
            placeholder="Country"
            value={wineForm.country}
            onChange={(e) => setWineForm(prev => ({ ...prev, country: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          
          <select
            value={wineForm.price_point}
            onChange={(e) => setWineForm(prev => ({ ...prev, price_point: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="Budget-friendly">Budget-friendly</option>
            <option value="Mid-range">Mid-range</option>
            <option value="Premium">Premium</option>
            <option value="Luxury">Luxury</option>
          </select>
          
          <input
            type="number"
            step="0.1"
            placeholder="Alcohol content (%)"
            value={wineForm.alcohol_content}
            onChange={(e) => setWineForm(prev => ({ ...prev, alcohol_content: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Location assignment for new events */}
        {locations && locations.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Location (optional)
            </label>
            <select
              value={wineForm.location_name || ''}
              onChange={(e) => setWineForm(prev => ({ ...prev, location_name: e.target.value }))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">No specific location</option>
              {locations.map((location, index) => (
                <option key={index} value={location.location_name}>
                  {location.location_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4">
          <textarea
            placeholder="Sommelier notes"
            value={wineForm.sommelier_notes}
            onChange={(e) => setWineForm(prev => ({ ...prev, sommelier_notes: e.target.value }))}
            rows="3"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="mt-4">
          <input
            type="url"
            placeholder="Image URL (optional)"
            value={wineForm.image_url}
            onChange={(e) => setWineForm(prev => ({ ...prev, image_url: e.target.value }))}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Advanced Fields Toggle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowAdvancedFields(!showAdvancedFields)}
          className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50"
        >
          {showAdvancedFields ? 'Hide Advanced Fields' : 'Show Advanced Fields'}
        </button>
      </div>

      {/* Advanced Fields */}
      {showAdvancedFields && (
        <>
          {/* Grape Varieties */}
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-medium mb-4 text-green-700">Grape Varieties</h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Grape variety"
                value={newGrapeVariety.name}
                onChange={(e) => setNewGrapeVariety(prev => ({ ...prev, name: e.target.value }))}
                className="flex-1 p-2 border rounded"
              />
              <input
                type="number"
                placeholder="%"
                value={newGrapeVariety.percentage}
                onChange={(e) => setNewGrapeVariety(prev => ({ ...prev, percentage: e.target.value }))}
                className="w-20 p-2 border rounded"
              />
              <button
                type="button"
                onClick={addGrapeVariety}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {wineForm.grape_varieties.map((variety, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span>{variety.name} ({variety.percentage}%)</span>
                  <button
                    type="button"
                    onClick={() => removeGrapeVariety(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Wine Style */}
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-medium mb-4 text-blue-700">Wine Style</h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Wine style (e.g., Bold, Elegant, Fresh)"
                value={newWineStyle}
                onChange={(e) => setNewWineStyle(e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <button
                type="button"
                onClick={addWineStyle}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {wineForm.wine_style.map((style, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {style}
                  <button
                    type="button"
                    onClick={() => removeWineStyle(index)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Food Pairings */}
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-medium mb-4 text-orange-700">Food Pairings</h4>
            <div className="flex gap-2 mb-3">
              <input
                id="food-pairing-input"
                type="text"
                placeholder="Food pairing"
                className="flex-1 p-2 border rounded"
              />
              <button
                type="button"
                onClick={addFoodPairing}
                className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {wineForm.food_pairings.map((pairing, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                >
                  {pairing}
                  <button
                    type="button"
                    onClick={() => removeFoodPairing(index)}
                    className="text-orange-500 hover:text-orange-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <textarea
              placeholder="Additional food pairing notes"
              value={wineForm.food_pairing_notes}
              onChange={(e) => setWineForm(prev => ({ ...prev, food_pairing_notes: e.target.value }))}
              rows="2"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Tasting Notes */}
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-medium mb-4 text-red-700">Tasting Notes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                placeholder="Appearance"
                value={wineForm.tasting_notes.appearance}
                onChange={(e) => setWineForm(prev => ({
                  ...prev,
                  tasting_notes: { ...prev.tasting_notes, appearance: e.target.value }
                }))}
                rows="2"
                className="p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <textarea
                placeholder="Aroma"
                value={wineForm.tasting_notes.aroma}
                onChange={(e) => setWineForm(prev => ({
                  ...prev,
                  tasting_notes: { ...prev.tasting_notes, aroma: e.target.value }
                }))}
                rows="2"
                className="p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <textarea
                placeholder="Taste"
                value={wineForm.tasting_notes.taste}
                onChange={(e) => setWineForm(prev => ({
                  ...prev,
                  tasting_notes: { ...prev.tasting_notes, taste: e.target.value }
                }))}
                rows="2"
                className="p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <textarea
                placeholder="Finish"
                value={wineForm.tasting_notes.finish}
                onChange={(e) => setWineForm(prev => ({
                  ...prev,
                  tasting_notes: { ...prev.tasting_notes, finish: e.target.value }
                }))}
                rows="2"
                className="p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Winemaker Notes */}
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-medium mb-4 text-indigo-700">Winemaker Notes</h4>
            <textarea
              placeholder="Winemaker's notes about the wine"
              value={wineForm.winemaker_notes}
              onChange={(e) => setWineForm(prev => ({ ...prev, winemaker_notes: e.target.value }))}
              rows="3"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Technical Details */}
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-medium mb-4 text-gray-700">Technical Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                step="0.01"
                placeholder="pH"
                value={wineForm.technical_details.ph}
                onChange={(e) => setWineForm(prev => ({
                  ...prev,
                  technical_details: { ...prev.technical_details, ph: e.target.value }
                }))}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-gray-500"
              />
              <input
                type="text"
                placeholder="Residual sugar"
                value={wineForm.technical_details.residual_sugar}
                onChange={(e) => setWineForm(prev => ({
                  ...prev,
                  technical_details: { ...prev.technical_details, residual_sugar: e.target.value }
                }))}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-gray-500"
              />
              <input
                type="text"
                placeholder="Total acidity"
                value={wineForm.technical_details.total_acidity}
                onChange={(e) => setWineForm(prev => ({
                  ...prev,
                  technical_details: { ...prev.technical_details, total_acidity: e.target.value }
                }))}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-gray-500"
              />
              <input
                type="text"
                placeholder="Aging process"
                value={wineForm.technical_details.aging}
                onChange={(e) => setWineForm(prev => ({
                  ...prev,
                  technical_details: { ...prev.technical_details, aging: e.target.value }
                }))}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-gray-500"
              />
              <div className="md:col-span-2">
                <textarea
                  placeholder="Production methods"
                  value={wineForm.technical_details.production}
                  onChange={(e) => setWineForm(prev => ({
                    ...prev,
                    technical_details: { ...prev.technical_details, production: e.target.value }
                  }))}
                  rows="2"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Awards */}
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-medium mb-4 text-yellow-700">Awards & Recognition</h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Award or recognition"
                value={newAward}
                onChange={(e) => setNewAward(e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <button
                type="button"
                onClick={addAward}
                className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {wineForm.awards.map((award, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span>{award}</span>
                  <button
                    type="button"
                    onClick={() => removeAward(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WineFormFields;