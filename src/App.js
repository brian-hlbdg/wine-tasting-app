import React, { useState } from 'react';
import { Camera, Plus, Star, MapPin, Calendar, User, Wine, Search, Menu, X, ChevronDown } from 'lucide-react';

const WineTastingApp = () => {
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'entry', 'profile'
  const [showMenu, setShowMenu] = useState(false);
  
  const [formData, setFormData] = useState({
    wineName: '',
    producer: '',
    vintage: '',
    wineType: 'red',
    region: '',
    country: '',
    rating: 0,
    tastingDate: new Date().toISOString().split('T')[0],
    personalNotes: '',
    occasion: '',
    grapeVarietals: [],
    tags: [],
    // Expert fields - now using structured data
    alcoholContent: '',
    price: '',
    purchaseLocation: '',
    servingTemp: '',
    decantTime: '',
    appearanceDescriptors: [],
    aromaDescriptors: [],
    tasteDescriptors: [],
    finishDescriptors: [],
    structureAttributes: {},
    foodPairings: []
  });

  // Sample descriptor data - in real app, this would come from your database
  const descriptorData = {
    appearance: {
      color: {
        red: ['Deep Ruby', 'Garnet', 'Purple', 'Brick Red', 'Mahogany'],
        white: ['Pale Yellow', 'Golden', 'Straw', 'Amber', 'Green-tinged'],
        rosé: ['Pale Pink', 'Salmon', 'Copper', 'Deep Rose']
      },
      clarity: ['Clear', 'Brilliant', 'Hazy', 'Cloudy'],
      intensity: ['Light', 'Medium', 'Deep', 'Opaque']
    },
    aroma: {
      fruit: ['Blackberry', 'Cherry', 'Plum', 'Raspberry', 'Apple', 'Pear', 'Citrus', 'Tropical', 'Dried Fruit'],
      floral: ['Rose', 'Violet', 'Lavender', 'Jasmine', 'Orange Blossom'],
      spice: ['Black Pepper', 'White Pepper', 'Cinnamon', 'Clove', 'Nutmeg', 'Anise'],
      oak: ['Vanilla', 'Cedar', 'Toast', 'Smoke', 'Coconut'],
      earth: ['Mineral', 'Wet Stones', 'Forest Floor', 'Mushroom', 'Truffle'],
      other: ['Leather', 'Tobacco', 'Chocolate', 'Coffee', 'Herbs']
    },
    taste: {
      fruit: ['Dark Cherry', 'Black Currant', 'Green Apple', 'Lemon', 'Peach', 'Melon'],
      spice: ['Black Pepper', 'White Pepper', 'Ginger', 'Cardamom'],
      other: ['Dark Chocolate', 'Coffee', 'Honey', 'Caramel', 'Butter', 'Cream']
    },
    finish: {
      length: ['Short', 'Medium', 'Long', 'Very Long'],
      intensity: ['Light', 'Medium', 'Intense'],
      character: ['Smooth', 'Tannic', 'Crisp', 'Warming', 'Lingering']
    },
    structure: {
      body: ['Light', 'Medium-', 'Medium', 'Medium+', 'Full'],
      tannins: ['Low', 'Medium-', 'Medium', 'Medium+', 'High'],
      acidity: ['Low', 'Medium-', 'Medium', 'Medium+', 'High'],
      sweetness: ['Bone Dry', 'Dry', 'Off-Dry', 'Medium Sweet', 'Sweet']
    },
    foodPairings: [
      'Red Meat', 'White Meat', 'Game', 'Seafood', 'Shellfish',
      'Pasta', 'Pizza', 'Cheese', 'Charcuterie', 'Vegetables',
      'Spicy Food', 'Asian Cuisine', 'Mediterranean', 'Dessert'
    ]
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleStructureChange = (attribute, value) => {
    setFormData(prev => ({
      ...prev,
      structureAttributes: {
        ...prev.structureAttributes,
        [attribute]: value
      }
    }));
  };

  const handleRating = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const Navigation = () => (
    <nav className="bg-purple-900 text-white p-4 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wine className="w-6 h-6" />
          WineTaster
        </h1>
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-purple-800 rounded-lg"
        >
          {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      
      {showMenu && (
        <div className="absolute top-full left-0 right-0 bg-purple-900 border-t border-purple-700 z-50">
          <div className="p-4 space-y-2">
            <button 
              onClick={() => { setCurrentView('home'); setShowMenu(false); }}
              className="block w-full text-left p-2 hover:bg-purple-800 rounded"
            >
              Home
            </button>
            <button 
              onClick={() => { setCurrentView('entry'); setShowMenu(false); }}
              className="block w-full text-left p-2 hover:bg-purple-800 rounded"
            >
              Add Wine
            </button>
            <button 
              onClick={() => { setCurrentView('profile'); setShowMenu(false); }}
              className="block w-full text-left p-2 hover:bg-purple-800 rounded"
            >
              Profile
            </button>
            <div className="border-t border-purple-700 pt-2 mt-2">
              <label className="flex items-center gap-2 p-2">
                <input 
                  type="checkbox" 
                  checked={isExpertMode}
                  onChange={(e) => setIsExpertMode(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Expert Mode</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </nav>
  );

  const StarRating = ({ rating, onRate, size = 'w-8 h-8' }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button 
          key={star}
          onClick={() => onRate(star)}
          className={`${size} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
        >
          <Star className="w-full h-full fill-current" />
        </button>
      ))}
    </div>
  );

  const MultiSelectSection = ({ title, options, selected, onToggle, grouped = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
      <div className="border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <span className="font-medium">{title}</span>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                {selected.length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        {isExpanded && (
          <div className="border-t border-gray-200 p-3">
            {grouped ? (
              Object.entries(options).map(([category, items]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">{category}</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(item => (
                      <label key={item} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.includes(item)}
                          onChange={() => onToggle(item)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className={selected.includes(item) ? 'text-purple-700 font-medium' : ''}>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {options.map(item => (
                  <label key={item} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selected.includes(item)}
                      onChange={() => onToggle(item)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className={selected.includes(item) ? 'text-purple-700 font-medium' : ''}>{item}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const StructureRating = ({ attribute, value, onChange, options }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium capitalize">{attribute}</label>
      <div className="flex gap-1">
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(attribute, option)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              value === option 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  const HomeView = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
        <p className="opacity-90">Ready to record your next wine tasting?</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setCurrentView('entry')}
          className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <Plus className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <span className="font-medium">Add Wine</span>
        </button>
        
        <button className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
          <Search className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <span className="font-medium">Browse</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold mb-3">Recent Tastings</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Wine className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Château Example {i}</p>
                <p className="text-gray-500 text-xs">Bordeaux, 2018</p>
              </div>
              <StarRating rating={4} onRate={() => {}} size="w-4 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const WineEntryForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Add Wine Tasting</h2>
        <button className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200">
          <Camera className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-3 text-purple-700">Wine Details</h3>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Wine name"
              value={formData.wineName}
              onChange={(e) => handleInputChange('wineName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            
            <input
              type="text"
              placeholder="Producer/Winery"
              value={formData.producer}
              onChange={(e) => handleInputChange('producer', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.wineType}
                onChange={(e) => handleInputChange('wineType', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="red">Red</option>
                <option value="white">White</option>
                <option value="rosé">Rosé</option>
                <option value="sparkling">Sparkling</option>
                <option value="dessert">Dessert</option>
                <option value="fortified">Fortified</option>
              </select>
              
              <input
                type="number"
                placeholder="Vintage"
                min="1800"
                max="2025"
                value={formData.vintage}
                onChange={(e) => handleInputChange('vintage', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Region"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <input
                type="text"
                placeholder="Country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tasting Experience */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-3 text-purple-700">Your Experience</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <StarRating rating={formData.rating} onRate={handleRating} />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={formData.tastingDate}
                onChange={(e) => handleInputChange('tastingDate', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <input
                type="text"
                placeholder="Occasion"
                value={formData.occasion}
                onChange={(e) => handleInputChange('occasion', e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <textarea
              placeholder="Your tasting notes..."
              value={formData.personalNotes}
              onChange={(e) => handleInputChange('personalNotes', e.target.value)}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Expert Mode Fields */}
        {isExpertMode && (
          <div className="space-y-4">
            {/* Technical Details */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3 text-purple-700">Technical Details</h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    placeholder="ABV %"
                    step="0.1"
                    value={formData.alcoholContent}
                    onChange={(e) => handleInputChange('alcoholContent', e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  
                  <input
                    type="number"
                    placeholder="Price $"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  
                  <input
                    type="text"
                    placeholder="Serving °C"
                    value={formData.servingTemp}
                    onChange={(e) => handleInputChange('servingTemp', e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <input
                  type="text"
                  placeholder="Purchase location"
                  value={formData.purchaseLocation}
                  onChange={(e) => handleInputChange('purchaseLocation', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3 text-purple-700">Appearance</h3>
              <div className="space-y-3">
                <MultiSelectSection
                  title="Appearance Descriptors"
                  options={formData.wineType === 'red' ? {
                    color: descriptorData.appearance.color.red,
                    clarity: descriptorData.appearance.clarity,
                    intensity: descriptorData.appearance.intensity
                  } : formData.wineType === 'white' ? {
                    color: descriptorData.appearance.color.white,
                    clarity: descriptorData.appearance.clarity,
                    intensity: descriptorData.appearance.intensity
                  } : {
                    color: descriptorData.appearance.color.rosé || descriptorData.appearance.color.red,
                    clarity: descriptorData.appearance.clarity,
                    intensity: descriptorData.appearance.intensity
                  }}
                  selected={formData.appearanceDescriptors}
                  onToggle={(value) => handleMultiSelect('appearanceDescriptors', value)}
                  grouped={true}
                />
              </div>
            </div>

            {/* Aroma */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3 text-purple-700">Aroma</h3>
              <div className="space-y-3">
                <MultiSelectSection
                  title="Aroma Descriptors"
                  options={descriptorData.aroma}
                  selected={formData.aromaDescriptors}
                  onToggle={(value) => handleMultiSelect('aromaDescriptors', value)}
                  grouped={true}
                />
              </div>
            </div>

            {/* Taste */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3 text-purple-700">Taste</h3>
              <div className="space-y-3">
                <MultiSelectSection
                  title="Taste Descriptors"
                  options={descriptorData.taste}
                  selected={formData.tasteDescriptors}
                  onToggle={(value) => handleMultiSelect('tasteDescriptors', value)}
                  grouped={true}
                />
              </div>
            </div>

            {/* Finish */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3 text-purple-700">Finish</h3>
              <div className="space-y-3">
                <MultiSelectSection
                  title="Finish Descriptors"
                  options={descriptorData.finish}
                  selected={formData.finishDescriptors}
                  onToggle={(value) => handleMultiSelect('finishDescriptors', value)}
                  grouped={true}
                />
              </div>
            </div>

            {/* Wine Structure */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3 text-purple-700">Wine Structure</h3>
              <div className="space-y-4">
                {Object.entries(descriptorData.structure).map(([attribute, options]) => (
                  <StructureRating
                    key={attribute}
                    attribute={attribute}
                    value={formData.structureAttributes[attribute]}
                    onChange={handleStructureChange}
                    options={options}
                  />
                ))}
              </div>
            </div>

            {/* Food Pairings */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-3 text-purple-700">Food Pairings</h3>
              <div className="space-y-3">
                <MultiSelectSection
                  title="Food Pairing Suggestions"
                  options={descriptorData.foodPairings}
                  selected={formData.foodPairings}
                  onToggle={(value) => handleMultiSelect('foodPairings', value)}
                  grouped={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors">
            Save Wine
          </button>
          <button 
            onClick={() => setCurrentView('home')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const ProfileView = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
        <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <User className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold mb-2">Wine Enthusiast</h2>
        <p className="text-gray-600">Member since 2024</p>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-3">Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span>Expert Mode</span>
            <input 
              type="checkbox" 
              checked={isExpertMode}
              onChange={(e) => setIsExpertMode(e.target.checked)}
              className="rounded"
            />
          </label>
          <label className="flex items-center justify-between">
            <span>Enable Notifications</span>
            <input type="checkbox" className="rounded" />
          </label>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-3">Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-purple-600">42</p>
            <p className="text-sm text-gray-600">Wines Tasted</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">4.2</p>
            <p className="text-sm text-gray-600">Avg Rating</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="p-4 pb-20 max-w-md mx-auto">
        {currentView === 'home' && <HomeView />}
        {currentView === 'entry' && <WineEntryForm />}
        {currentView === 'profile' && <ProfileView />}
      </main>
    </div>
  );
};

export default WineTastingApp;