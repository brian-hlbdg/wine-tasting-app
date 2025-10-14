import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import WineFormFields from "./WineFormFields";

const WineForm = ({
  onSave,
  onCancel,
  existingWine = null,
  locationOptions = [],
}) => {
  const initialWineState = {
    wine_name: "",
    producer: "",
    vintage: "",
    wine_type: "red",
    beverage_type: "Wine",
    region: "",
    country: "",
    price_point: "Mid-range",
    alcohol_content: "",
    sommelier_notes: "",
    image_url: "",
    grape_varieties: [],
    wine_style: [],
    food_pairings: [],
    food_pairing_notes: "",
    tasting_notes: {
      appearance: "",
      aroma: "",
      taste: "",
      finish: "",
    },
    winemaker_notes: "",
    technical_details: {
      ph: "",
      residual_sugar: "",
      total_acidity: "",
      aging: "",
      production: "",
    },
    awards: [],
    location_name: "",
  };

  const [wineForm, setWineForm] = useState(initialWineState);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [newGrapeVariety, setNewGrapeVariety] = useState({
    name: "",
    percentage: "",
  });
  const [newWineStyle, setNewWineStyle] = useState("");
  const [newAward, setNewAward] = useState("");

  // Initialize form with existing wine data when editing
  useEffect(() => {
    if (existingWine) {
      console.log("Loading existing wine data:", existingWine);
      setWineForm({
        ...initialWineState,
        ...existingWine,
        // Ensure nested objects are properly initialized
        tasting_notes:
          existingWine.tasting_notes || initialWineState.tasting_notes,
        technical_details:
          existingWine.technical_details || initialWineState.technical_details,
        grape_varieties: existingWine.grape_varieties || [],
        wine_style: existingWine.wine_style || [],
        food_pairings: existingWine.food_pairings || [],
        awards: existingWine.awards || [],
      });

      // Show advanced fields if wine has advanced data
      if (
        existingWine.grape_varieties?.length ||
        existingWine.wine_style?.length ||
        existingWine.tasting_notes?.appearance ||
        existingWine.technical_details?.ph
      ) {
        setShowAdvancedFields(true);
      }
    }
  }, [existingWine]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!wineForm.wine_name.trim()) {
      alert("Please enter a wine name");
      return;
    }

    // Call the onSave callback with wine data
    if (onSave) {
      onSave(wineForm);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {existingWine ? "Edit Wine" : "Add Wine"}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {existingWine
                  ? "Update wine details"
                  : "Add wine to your event"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Wine Form */}
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
              locationOptions={locationOptions}
            />

            {/* Form Actions */}
            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 font-semibold transition-colors"
              >
                {existingWine ? "Update Wine" : "Add Wine"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WineForm;
