import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import WineFormFields from './WineFormFields';
import { X, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';

const FUZZY_WARN = 0.35;
const FUZZY_BLOCK = 0.75;

const EMPTY_FORM = {
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
  awards: [],
};

const SubmitWineFlow = ({ isOpen, onClose, eventId, userId, initialWineName = '', onWineSubmitted }) => {
  const [step, setStep] = useState(1);
  const [similarWines, setSimilarWines] = useState([]);
  const [isCheckingFuzzy, setIsCheckingFuzzy] = useState(false);
  const [userConfirmedDifferent, setUserConfirmedDifferent] = useState(false);
  const [similarCatalogIds, setSimilarCatalogIds] = useState([]);

  const [wineForm, setWineForm] = useState({ ...EMPTY_FORM });
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [newGrapeVariety, setNewGrapeVariety] = useState({ name: '', percentage: '' });
  const [newWineStyle, setNewWineStyle] = useState('');
  const [newAward, setNewAward] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSimilarWines([]);
    setUserConfirmedDifferent(false);
    setSimilarCatalogIds([]);
    setSubmitError(null);
    setShowAdvancedFields(false);
    setWineForm({ ...EMPTY_FORM, wine_name: initialWineName });

    if (initialWineName && initialWineName.length >= 2) {
      runFuzzyCheck(initialWineName);
    } else {
      setStep(2);
    }
  }, [isOpen, initialWineName]);

  const runFuzzyCheck = async (name) => {
    setIsCheckingFuzzy(true);
    try {
      const { data } = await supabase.rpc('find_similar_wines', {
        search_text: name,
        similarity_threshold: FUZZY_WARN,
        result_limit: 5,
      });
      const matches = data || [];
      setSimilarWines(matches);
      setSimilarCatalogIds(matches.filter(w => !w.is_outlier).map(w => w.id));
      if (matches.length === 0) setStep(2);
    } finally {
      setIsCheckingFuzzy(false);
    }
  };

  const highestSimilarity = similarWines.length > 0 ? similarWines[0].similarity : 0;
  const isBlocked = highestSimilarity >= FUZZY_BLOCK && !userConfirmedDifferent;

  const handleSelectExisting = (wine) => {
    onWineSubmitted?.(wine, wine.is_outlier);
    onClose();
  };

  const handleSubmit = async () => {
    if (!wineForm.wine_name.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Check for existing active duplicate in this event
      const { data: existing } = await supabase
        .from('outlier_wines')
        .select('id, submission_count')
        .eq('submitted_from_event', eventId)
        .ilike('wine_name', wineForm.wine_name.trim())
        .eq('status', 'active')
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from('outlier_wines')
          .update({ submission_count: existing[0].submission_count + 1 })
          .eq('id', existing[0].id);
        setStep(3);
        return;
      }

      const { error } = await supabase.from('outlier_wines').insert({
        wine_name: wineForm.wine_name.trim(),
        producer: wineForm.producer || null,
        vintage: wineForm.vintage ? parseInt(wineForm.vintage) : null,
        wine_type: wineForm.wine_type || null,
        beverage_type: wineForm.beverage_type || null,
        region: wineForm.region || null,
        country: wineForm.country || null,
        price_point: wineForm.price_point || null,
        alcohol_content: wineForm.alcohol_content ? parseFloat(wineForm.alcohol_content) : null,
        sommelier_notes: wineForm.sommelier_notes || null,
        image_url: wineForm.image_url || null,
        grape_varieties: wineForm.grape_varieties,
        wine_style: wineForm.wine_style,
        food_pairings: wineForm.food_pairings,
        food_pairing_notes: wineForm.food_pairing_notes || null,
        tasting_notes: wineForm.tasting_notes,
        winemaker_notes: wineForm.winemaker_notes || null,
        technical_details: wineForm.technical_details,
        awards: wineForm.awards,
        submitted_by: userId || null,
        submitted_from_event: eventId || null,
        similar_catalog_ids: similarCatalogIds.length > 0 ? similarCatalogIds : null,
        user_confirmed_different: userConfirmedDifferent,
        status: 'active',
      });

      if (error) throw error;
      setStep(3);
      onWineSubmitted?.();
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="font-semibold text-gray-900">
            {step === 1 && 'Similar Wines Found'}
            {step === 2 && 'Add a New Wine'}
            {step === 3 && 'Wine Submitted'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {/* Step 1: Fuzzy check */}
          {step === 1 && (
            <div className="space-y-4">
              {isCheckingFuzzy ? (
                <div className="py-8 text-center text-gray-500">
                  <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
                  Checking wine catalog...
                </div>
              ) : (
                <>
                  {isBlocked ? (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        We found a very close match. Is one of these your wine?
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      We found some similar wines. Is one of these what you're looking for?
                    </p>
                  )}

                  <div className="space-y-2">
                    {similarWines.map(wine => (
                      <div
                        key={`${wine.is_outlier ? 'o' : 'c'}-${wine.id}`}
                        onClick={() => handleSelectExisting(wine)}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-purple-50 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{wine.wine_name}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {[wine.producer, wine.vintage, wine.wine_type && wine.wine_type.charAt(0).toUpperCase() + wine.wine_type.slice(1), wine.region]
                              .filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {wine.is_outlier && (
                            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                              Added Wine
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    {isBlocked ? (
                      <button
                        onClick={() => { setUserConfirmedDifferent(true); setStep(2); }}
                        className="w-full py-2.5 text-sm font-medium text-purple-600 hover:text-purple-800"
                      >
                        No, mine is a different wine →
                      </button>
                    ) : (
                      <button
                        onClick={() => setStep(2)}
                        className="w-full py-2.5 text-sm font-medium text-purple-600 hover:text-purple-800"
                      >
                        None of these — add my wine →
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Full entry form */}
          {step === 2 && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Fill in what you know. Only the wine name is required.
              </p>
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
              {submitError && (
                <p className="mt-3 text-sm text-red-600">{submitError}</p>
              )}
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="py-10 text-center">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Wine Submitted!</h3>
              <p className="text-sm text-gray-500 mb-6">
                It will appear in the wine list with an "Added Wine" tag.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer — submit button on step 2 only */}
        {step === 2 && (
          <div className="p-4 border-t shrink-0">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !wineForm.wine_name.trim()}
              className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Wine'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmitWineFlow;
