import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

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

    onAddWine(wineForm);

    // Reset form
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
          <select
            value={wineForm.beverage_type}
            onChange={(e) => setWineForm(prev => ({ ...prev, beverage_type: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="Wine">Wine</option>
            <option value="Champagne">Champagne</option>
            <option value="Sparkling Wine">Sparkling Wine</option>
            <option value="Cava">Cava</option>
            <option value="Prosecco">Prosecco</option>
          </select>
          
          <select
            value={wineForm.wine_type}
            onChange={(e) => setWineForm(prev => ({ ...prev, wine_type: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
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
            value={wineForm.vintage}
            onChange={(e) => setWineForm(prev => ({ ...prev, vintage: e.target.value }))}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
          />
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
                placeholder="Aroma (e.g., Blackcurrant, cedar, tobacco, dark chocolate)"
                value={wineForm.tasting_notes.aroma}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  tasting_notes: { ...prev.tasting_notes, aroma: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Taste (e.g., Rich dark fruits, well-integrated tannins)"
                value={wineForm.tasting_notes.taste}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  tasting_notes: { ...prev.tasting_notes, taste: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Finish (e.g., Long and persistent with notes of spice)"
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
              placeholder="Production details, philosophy, aging process, etc."
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
                type="text"
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
                placeholder="Residual Sugar (e.g., < 2 g/L)"
                value={wineForm.technical_details.residual_sugar}
                onChange={(e) => setWineForm(prev => ({ 
                  ...prev, 
                  technical_details: { ...prev.technical_details, residual_sugar: e.target.value }
                }))}
                className="p-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="text"
                placeholder="Total Acidity (e.g., 6.2 g/L)"
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
    </div>
  );
};

export default WineForm;