import React, { useState, useEffect } from 'react';
import WineFormFields from './WineFormFields';

const ExistingEventWineForm = ({ 
  eventId, 
  eventName, 
  onWineAdded, 
  onCancel, 
  initialWine = null,
  isEditing = false 
}) => {
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
    awards: []
  };

  const [wineForm, setWineForm] = useState(initialWine || initialWineState);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [newGrapeVariety, setNewGrapeVariety] = useState({ name: '', percentage: '' });
  const [newWineStyle, setNewWineStyle] = useState('');
  const [newAward, setNewAward] = useState('');
  const [saving, setSaving] = useState(false);
  const [nextTastingOrder, setNextTastingOrder] = useState(1);

  // Get next tasting order when component mounts
  useEffect(() => {
    const getNextTastingOrder = async () => {
      try {
        const { supabase } = await import('./supabaseClient');
        
        const { data, error } = await supabase
          .from('event_wines')
          .select('tasting_order')
          .eq('event_id', eventId)
          .order('tasting_order', { ascending: false })
          .limit(1);

        if (error) throw error;

        const maxOrder = data && data.length > 0 ? data[0].tasting_order : 0;
        setNextTastingOrder(maxOrder + 1);
      } catch (error) {
        console.error('Error getting next tasting order:', error);
        setNextTastingOrder(1); // Default fallback
      }
    };

    if (eventId && !isEditing) {
      getNextTastingOrder();
    }
  }, [eventId, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!wineForm.wine_name.trim()) {
      alert('Please enter a wine name');
      return;
    }

    if (!eventId) {
      alert('Error: No event ID provided');
      return;
    }

    setSaving(true);

    try {
      const { supabase } = await import('./supabaseClient');

      // Prepare wine data for database - using only fields that exist in your schema
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
        tasting_notes: (wineForm.tasting_notes.appearance || wineForm.tasting_notes.aroma || 
                       wineForm.tasting_notes.taste || wineForm.tasting_notes.finish) ? 
                       wineForm.tasting_notes : null,
        winemaker_notes: wineForm.winemaker_notes || null,
        technical_details: (wineForm.technical_details.ph || wineForm.technical_details.residual_sugar || 
                           wineForm.technical_details.total_acidity || wineForm.technical_details.aging || 
                           wineForm.technical_details.production) ? wineForm.technical_details : null,
        awards: wineForm.awards.length > 0 ? wineForm.awards : null,
        tasting_order: isEditing ? wineForm.tasting_order : nextTastingOrder
      };

      let error;
      
      if (isEditing && initialWine?.id) {
        // Update existing wine
        const { error: updateError } = await supabase
          .from('event_wines')
          .update(wineForDB)
          .eq('id', initialWine.id);
        error = updateError;
      } else {
        // Insert new wine
        const { error: insertError } = await supabase
          .from('event_wines')
          .insert([wineForDB]);
        error = insertError;
      }

      if (error) {
        throw error;
      }

      const successMessage = isEditing 
        ? `✅ Wine "${wineForm.wine_name}" updated successfully!`
        : `✅ Wine "${wineForm.wine_name}" added successfully to ${eventName || 'the event'}!`;
      
      alert(successMessage);
      
      // Reset form for adding another wine (only if not editing)
      if (!isEditing) {
        resetForm();
      }
      
      // Notify parent component
      if (onWineAdded) {
        onWineAdded();
      }

    } catch (error) {
      console.error('Error saving wine to event:', error);
      alert('Error saving wine: ' + error.message);
    } finally {
      setSaving(false);
    }
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
          <h2 className="text-2xl font-bold text-green-800">
            {isEditing ? 'Edit Wine' : 'Add Wine to Event'}
          </h2>
          {eventName && (
            <p className="text-gray-600">
              {isEditing ? 'Editing wine in' : 'Adding wine to'}: <span className="font-medium">{eventName}</span>
            </p>
          )}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800"
            disabled={saving}
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
        />

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : (isEditing ? 'Update Wine' : 'Add Wine to Event')}
          </button>
          {!isEditing && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Clear Form
            </button>
          )}
        </div>
      </form>

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              {isEditing ? 'Wine will be updated immediately' : 'Wine will be saved immediately'}
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                {isEditing 
                  ? 'Changes to this wine will be saved directly to the database and visible to attendees immediately.'
                  : 'This wine will be saved directly to the database and visible to attendees immediately.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExistingEventWineForm;