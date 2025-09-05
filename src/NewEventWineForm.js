import React, { useState } from 'react';
import WineFormFields from './WineFormFields';

const NewEventWineForm = ({ onWineAdded, locations = [], initialWine = null, onCancel }) => {
  const initialWineState = {
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
    awards: [],
    location_name: '' // For new events with locations
  };

  const [wineForm, setWineForm] = useState(initialWine || initialWineState);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [newGrapeVariety, setNewGrapeVariety] = useState({ name: '', percentage: '' });
  const [newWineStyle, setNewWineStyle] = useState('');
  const [newAward, setNewAward] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!wineForm.wine_name.trim()) {
      alert('Please enter a wine name');
      return;
    }

    // Pass the wine data back to the parent component
    // This will be stored in memory until the event is created
    onWineAdded(wineForm);
    
    // Reset the form for adding another wine
    resetForm();
  };

  const resetForm = () => {
    setWineForm(initialWineState);
    setShowAdvancedFields(false);
    setNewGrapeVariety({ name: '', percentage: '' });
    setNewWineStyle('');
    setNewAward('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-purple-800">Add Wine to New Event</h2>
          <p className="text-gray-600">This wine will be saved when you create the event</p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <WineFormFields
          wineForm={wineForm}
          setWineForm={setWineForm}
          showAdvancedFields={showAdvancedFields}
          setShowAdvancedFields={setShowAdvancedFields}
          newGrapeVariety={newGrapeVariety}
          setNewGrapeVariety={setNewGrapeVariety}
          newWineStyle={newWineStyle}
          setNewWineStyle={setNewWineStyle}
          newAward={newAward}
          setNewAward={setNewAward}
          locations={locations}
        />

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 font-semibold"
          >
            Add Wine to Event
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Clear Form
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Wine will be saved with event
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Wines added here are stored temporarily until you save the event. 
                They will be permanently saved to the database when the event is created.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewEventWineForm;