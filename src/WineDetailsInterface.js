import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  ChevronDown, 
  Star, 
  Heart, 
  MapPin, 
  Calendar, 
  Grape, 
  Utensils, 
  Award, 
  BookOpen, 
  Sun, 
  Moon,
  ArrowLeft,
  Info,
  Wine,
  Edit3
} from 'lucide-react';

const WineDetailsInterface = ({ wine, onBack, onRatingSaved }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    details: false,
    sommelier: false,
    foodPairing: false,
    winemaker: false,
    technical: false
  });
  const [userRating, setUserRating] = useState(0);
  const [ratingNotes, setRatingNotes] = useState('');
  const [selectedDescriptors, setSelectedDescriptors] = useState([]);
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Wine descriptors for expert mode
  const descriptorData = {
    aroma: {
      fruit: ['Blackberry', 'Cherry', 'Raspberry', 'Apple', 'Citrus', 'Tropical'],
      floral: ['Rose', 'Violet', 'Jasmine'],
      spice: ['Black Pepper', 'Cinnamon', 'Clove'],
      oak: ['Vanilla', 'Cedar', 'Toast'],
      earth: ['Mineral', 'Forest Floor', 'Mushroom'],
      other: ['Leather', 'Chocolate', 'Coffee']
    },
    taste: {
      fruit: ['Dark Cherry', 'Black Currant', 'Green Apple', 'Lemon'],
      other: ['Dark Chocolate', 'Coffee', 'Honey', 'Butter']
    },
    finish: {
      length: ['Short', 'Medium', 'Long'],
      character: ['Smooth', 'Tannic', 'Crisp', 'Warming']
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleDescriptor = (descriptor) => {
    setSelectedDescriptors(prev => 
      prev.includes(descriptor) 
        ? prev.filter(d => d !== descriptor)
        : [...prev, descriptor]
    );
  };

  // Helper function to get appropriate terminology based on beverage type
  const getBeverageTerminology = (beverageType) => {
    const terminology = {
      Wine: {
        grapeSection: "Grape Composition",
        grapeSubtext: "Varietal breakdown & percentages",
        icon: "🍷"
      },
      Champagne: {
        grapeSection: "Grape Composition & Dosage",
        grapeSubtext: "Varietal breakdown & sweetness level",
        icon: "🥂"
      },
      "Sparkling Wine": {
        grapeSection: "Grape Composition & Method",
        grapeSubtext: "Varietal breakdown & production method",
        icon: "🥂"
      },
      Cava: {
        grapeSection: "Grape Composition & Tiraj",
        grapeSubtext: "Traditional varieties & aging period",
        icon: "🥂"
      },
      Prosecco: {
        grapeSection: "Grape Composition & Pressure",
        grapeSubtext: "Glera percentage & sparkling method",
        icon: "🥂"
      }
    };
    
    return terminology[beverageType] || terminology.Wine;
  };

  const terminology = getBeverageTerminology(wine?.beverage_type || 'Wine');

  // Professional color scheme
  const theme = isDarkMode ? {
    bg: 'bg-slate-900',
    cardBg: 'bg-slate-800',
    text: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-400',
    border: 'border-slate-700',
    accent: 'bg-amber-600',
    accentHover: 'hover:bg-amber-700',
    accentLight: 'bg-slate-700',
    accentText: 'text-amber-400',
    button: 'bg-slate-700 hover:bg-slate-600',
    gradient: 'from-slate-800 to-slate-900'
  } : {
    bg: 'bg-slate-50',
    cardBg: 'bg-white',
    text: 'text-slate-900',
    textSecondary: 'text-slate-700',
    textMuted: 'text-slate-500',
    border: 'border-slate-200',
    accent: 'bg-amber-600',
    accentHover: 'hover:bg-amber-700',
    accentLight: 'bg-slate-50',
    accentText: 'text-amber-600',
    button: 'bg-slate-100 hover:bg-slate-200',
    gradient: 'from-slate-100 to-slate-200'
  };

  // Animated Bar Component for Grape Composition
  const AnimatedBar = ({ grape, index }) => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
      const timer = setTimeout(() => {
        setWidth(grape.percentage || 0);
      }, index * 150 + 300);

      return () => clearTimeout(timer);
    }, [grape.percentage, index]);

    return (
      <div className="mb-4 last:mb-0">
        <div className="flex justify-between items-center mb-2">
          <span className={`font-medium ${theme.text}`}>{grape.name}</span>
          <span className={`text-sm ${theme.textMuted}`}>{grape.percentage || 0}%</span>
        </div>
        <div className={`h-3 rounded-full ${theme.accentLight} overflow-hidden`}>
          <div 
            className={`h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${width}%` }}
          />
        </div>
      </div>
    );
  };

  // Save rating function
  const saveRating = async () => {
    if (!userRating) {
      alert('Please select a rating');
      return;
    }

    setSaving(true);
    try {
      // Create or get user profile
      let userId = crypto.randomUUID();
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          display_name: 'Wine Taster',
          phone_number: '+1-demo-' + Date.now().toString().slice(-6),
          is_admin: false
        }])
        .select()
        .single();
      
      if (profileError) {
        const { data: existingUsers } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
      
        if (existingUsers && existingUsers.length > 0) {
          userId = existingUsers[0].id;
        }
      }

      // Save rating
      const { data: ratingData, error: ratingError } = await supabase
        .from('user_wine_ratings')
        .insert([{
          user_id: userId,
          event_wine_id: wine.id,
          rating: userRating,
          personal_notes: ratingNotes || null,
          would_buy: userRating >= 4
        }])
        .select()
        .single();

      if (ratingError) {
        console.error('Error saving rating:', ratingError);
        alert('Error saving rating: ' + ratingError.message);
        return;
      }

      // Save descriptors if in expert mode
      if (isExpertMode && selectedDescriptors.length > 0) {
        const { data: descriptorIds } = await supabase
          .from('descriptors')
          .select('id, name')
          .in('name', selectedDescriptors);

        if (descriptorIds && descriptorIds.length > 0) {
          const descriptorInserts = descriptorIds.map(desc => ({
            user_rating_id: ratingData.id,
            descriptor_id: desc.id,
            intensity: 3
          }));

          await supabase.from('user_wine_descriptors').insert(descriptorInserts);
        }
      }

      alert(`Rating saved successfully!\n${wine?.wine_name}: ${userRating}/5 stars`);
      
      // Reset form and go back
      setUserRating(0);
      setRatingNotes('');
      setSelectedDescriptors([]);
      onRatingSaved();

    } catch (error) {
      console.error('Unexpected error saving rating:', error);
      alert('Error saving rating. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!wine) {
    return <div>Loading wine details...</div>;
  }

  return (
    <div className="min-w-full">
      <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
        {/* Header */}
        <div className={`${theme.cardBg} ${theme.border} border-b p-4 sm:p-5 sticky top-0 z-10 backdrop-blur-sm bg-opacity-95`}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack}
                className={`p-2.5 rounded-xl ${theme.button} transition-all duration-200 hover:scale-105`}
              >
                <ArrowLeft size={20} className={theme.text} />
              </button>
              <div>
                <h1 className={`text-lg sm:text-xl font-semibold ${theme.text}`}>
                  {wine.beverage_type || 'Wine'} #{wine.tasting_order || wine.id}
                </h1>
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${theme.textMuted}`}>Tasting Experience</p>
                  {wine.awards && wine.awards.length > 0 && (
                    <Award size={14} className="text-amber-500" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2.5 rounded-xl ${theme.button} transition-all duration-200 hover:scale-105`}
              >
                {isDarkMode ? <Sun size={20} className={theme.text} /> : <Moon size={20} className={theme.text} />}
              </button>
              <button className={`p-2.5 rounded-xl ${theme.button} transition-all duration-200 hover:scale-105`}>
                <Heart size={20} className={theme.text} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Container with responsive max-width */}
        <div className="max-w-4xl mx-auto">
          {/* Wine Image */}
          <div className={`relative h-64 sm:h-80 lg:h-96 bg-gradient-to-br ${theme.gradient}`}>
            {wine.image_url ? (
              <img 
                src={wine.image_url} 
                alt={wine.image_alt_text || `${wine.wine_name} bottle`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center" style={{ display: wine.image_url ? 'none' : 'flex' }}>
              <div className="text-6xl sm:text-7xl lg:text-8xl filter drop-shadow-lg">{terminology.icon}</div>
            </div>
            <div className="absolute top-4 sm:top-5 left-4 sm:left-5 right-4 sm:right-5 flex justify-between">
              <div className={`${theme.cardBg} rounded-xl px-3 sm:px-4 py-2 backdrop-blur-sm bg-opacity-90 shadow-lg`}>
                <span className={`text-sm font-medium ${theme.text}`}>{wine.vintage || 'NV'}</span>
              </div>
              <div className={`${theme.cardBg} rounded-xl px-3 sm:px-4 py-2 backdrop-blur-sm bg-opacity-90 shadow-lg`}>
                <span className={`text-sm font-medium ${theme.text}`}>{wine.alcohol_content || '13'}% ABV</span>
              </div>
            </div>
          </div>

          {/* Main Wine Information */}
          <div className={`${theme.cardBg} mx-4 sm:mx-5 lg:mx-6 mt-4 sm:mt-5 rounded-2xl p-4 sm:p-6 ${theme.border} border shadow-sm`}>
            <div className="mb-4 sm:mb-5">
              <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${theme.text} mb-2`}>{wine.wine_name}</h2>
              <p className={`${theme.textSecondary} mb-3 text-base sm:text-lg`}>
                {wine.producer}{wine.region ? ` • ${wine.region}` : ''}
              </p>
              
              {/* Awards */}
              {wine.awards && wine.awards.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {wine.awards.slice(0, 2).map((award, index) => (
                    <span key={index} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-amber-100 text-amber-800">
                      <Award size={12} />
                      {award}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Wine Style Tags */}
              {wine.wine_style && wine.wine_style.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {wine.wine_style.map((style, index) => (
                    <span key={index} className={`px-3 py-1.5 text-sm rounded-full ${theme.accentLight} ${theme.accentText} font-medium`}>
                      {style}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <p className={`${theme.textSecondary} leading-relaxed text-base`}>
              {wine.sommelier_notes || "A carefully selected wine for this tasting experience."}
            </p>
          </div>

          {/* Expandable Sections with responsive layout */}
          <div className="mx-4 sm:mx-5 lg:mx-6 mt-4 sm:mt-5 space-y-4">
            
            {/* Desktop: Two columns for larger screens, single column for mobile */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
              
              {/* Left Column */}
              <div className="space-y-4">
                {/* Grape Composition */}
                {wine.grape_varieties && wine.grape_varieties.length > 0 && (
                  <div className={`${theme.cardBg} rounded-2xl ${theme.border} border overflow-hidden shadow-sm`}>
                    <button 
                      onClick={() => toggleSection('details')}
                      className={`w-full p-4 sm:p-5 flex items-center justify-between ${theme.button} transition-all duration-200 hover:scale-[1.01]`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                          <Grape size={20} />
                        </div>
                        <div className="text-left">
                          <span className={`font-semibold ${theme.text} block text-base`}>{terminology.grapeSection}</span>
                          <span className={`text-sm ${theme.textMuted}`}>{terminology.grapeSubtext}</span>
                        </div>
                      </div>
                      <div className="transition-transform duration-300" style={{ transform: expandedSections.details ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <ChevronDown size={20} className={theme.textMuted} />
                      </div>
                    </button>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      expandedSections.details ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                        <div className="space-y-3">
                          {wine.grape_varieties.map((grape, index) => (
                            <AnimatedBar key={grape.name} grape={grape} index={index} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Winemaker Notes */}
                {wine.winemaker_notes && (
                  <div className={`${theme.cardBg} rounded-2xl ${theme.border} border overflow-hidden shadow-sm`}>
                    <button 
                      onClick={() => toggleSection('winemaker')}
                      className={`w-full p-4 sm:p-5 flex items-center justify-between ${theme.button} transition-all duration-200 hover:scale-[1.01]`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                          <Wine size={20} />
                        </div>
                        <div className="text-left">
                          <span className={`font-semibold ${theme.text} block text-base`}>Winemaker Notes</span>
                          <span className={`text-sm ${theme.textMuted}`}>Production details & philosophy</span>
                        </div>
                      </div>
                      <div className="transition-transform duration-300" style={{ transform: expandedSections.winemaker ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <ChevronDown size={20} className={theme.textMuted} />
                      </div>
                    </button>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      expandedSections.winemaker ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                        <p className={`${theme.textSecondary} leading-relaxed`}>
                          {wine.winemaker_notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Sommelier Notes */}
                {(wine.tasting_notes || wine.sommelier_notes) && (
                  <div className={`${theme.cardBg} rounded-2xl ${theme.border} border overflow-hidden shadow-sm`}>
                    <button 
                      onClick={() => toggleSection('sommelier')}
                      className={`w-full p-4 sm:p-5 flex items-center justify-between ${theme.button} transition-all duration-200 hover:scale-[1.01]`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                          <BookOpen size={20} />
                        </div>
                        <div className="text-left">
                          <span className={`font-semibold ${theme.text} block text-base`}>Professional Tasting Notes</span>
                          <span className={`text-sm ${theme.textMuted}`}>Sommelier analysis & characteristics</span>
                        </div>
                      </div>
                      <div className="transition-transform duration-300" style={{ transform: expandedSections.sommelier ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <ChevronDown size={20} className={theme.textMuted} />
                      </div>
                    </button>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      expandedSections.sommelier ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
                        {wine.sommelier_notes && (
                          <div className={`${theme.textSecondary} italic border-l-4 border-amber-200 pl-4 py-2 bg-amber-50 rounded-r-lg`}>
                            "{wine.sommelier_notes}"
                          </div>
                        )}
                        
                        {wine.tasting_notes && (
                          <div className="grid gap-4">
                            {wine.tasting_notes.appearance && (
                              <div className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                                <h4 className={`font-semibold ${theme.text} mb-2`}>Visual</h4>
                                <p className={`text-sm ${theme.textSecondary}`}>{wine.tasting_notes.appearance}</p>
                              </div>
                            )}
                            
                            {wine.tasting_notes.aroma && (
                              <div className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                                <h4 className={`font-semibold ${theme.text} mb-2`}>Aroma Profile</h4>
                                <p className={`text-sm ${theme.textSecondary}`}>{wine.tasting_notes.aroma}</p>
                              </div>
                            )}
                            
                            {wine.tasting_notes.taste && (
                              <div className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                                <h4 className={`font-semibold ${theme.text} mb-2`}>Palate</h4>
                                <p className={`text-sm ${theme.textSecondary}`}>{wine.tasting_notes.taste}</p>
                              </div>
                            )}
                            
                            {wine.tasting_notes.finish && (
                              <div className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                                <h4 className={`font-semibold ${theme.text} mb-2`}>Finish</h4>
                                <p className={`text-sm ${theme.textSecondary}`}>{wine.tasting_notes.finish}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Technical Details */}
                {wine.technical_details && (
                  <div className={`${theme.cardBg} rounded-2xl ${theme.border} border overflow-hidden shadow-sm`}>
                    <button 
                      onClick={() => toggleSection('technical')}
                      className={`w-full p-4 sm:p-5 flex items-center justify-between ${theme.button} transition-all duration-200 hover:scale-[1.01]`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                          <Info size={20} />
                        </div>
                        <div className="text-left">
                          <span className={`font-semibold ${theme.text} block text-base`}>Technical Details</span>
                          <span className={`text-sm ${theme.textMuted}`}>Production specifications</span>
                        </div>
                      </div>
                      <div className="transition-transform duration-300" style={{ transform: expandedSections.technical ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <ChevronDown size={20} className={theme.textMuted} />
                      </div>
                    </button>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      expandedSections.technical ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {wine.technical_details.ph && (
                            <div className={`p-3 rounded-lg ${theme.accentLight} border ${theme.border}`}>
                              <span className={`block font-semibold ${theme.text} mb-1`}>pH Level</span>
                              <span className={theme.textSecondary}>{wine.technical_details.ph}</span>
                            </div>
                          )}
                          {wine.technical_details.residual_sugar && (
                            <div className={`p-3 rounded-lg ${theme.accentLight} border ${theme.border}`}>
                              <span className={`block font-semibold ${theme.text} mb-1`}>Residual Sugar</span>
                              <span className={theme.textSecondary}>{wine.technical_details.residual_sugar}</span>
                            </div>
                          )}
                          {wine.technical_details.total_acidity && (
                            <div className={`p-3 rounded-lg ${theme.accentLight} border ${theme.border}`}>
                              <span className={`block font-semibold ${theme.text} mb-1`}>Total Acidity</span>
                              <span className={theme.textSecondary}>{wine.technical_details.total_acidity}</span>
                            </div>
                          )}
                          {wine.technical_details.aging && (
                            <div className={`p-3 rounded-lg ${theme.accentLight} border ${theme.border}`}>
                              <span className={`block font-semibold ${theme.text} mb-1`}>Aging Process</span>
                              <span className={theme.textSecondary}>{wine.technical_details.aging}</span>
                            </div>
                          )}
                        </div>
                        {wine.technical_details.production && (
                          <div className={`p-3 rounded-lg ${theme.accentLight} border ${theme.border}`}>
                            <span className={`block font-semibold ${theme.text} mb-1`}>Production</span>
                            <span className={theme.textSecondary}>{wine.technical_details.production}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Full Width Sections */}
            {/* Food Pairings */}
            {wine.food_pairings && wine.food_pairings.length > 0 && (
              <div className={`${theme.cardBg} rounded-2xl ${theme.border} border overflow-hidden shadow-sm`}>
                <button 
                  onClick={() => toggleSection('foodPairing')}
                  className={`w-full p-4 sm:p-5 flex items-center justify-between ${theme.button} transition-all duration-200 hover:scale-[1.01]`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                      <Utensils size={20} />
                    </div>
                    <div className="text-left">
                      <span className={`font-semibold ${theme.text} block text-base`}>Culinary Pairings</span>
                      <span className={`text-sm ${theme.textMuted}`}>Recommended food combinations</span>
                    </div>
                  </div>
                  <div className="transition-transform duration-300" style={{ transform: expandedSections.foodPairing ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <ChevronDown size={20} className={theme.textMuted} />
                  </div>
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedSections.foodPairing ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
                    {wine.food_pairings.map((category, index) => (
                      <div key={index} className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                        <h4 className={`font-semibold ${theme.text} mb-3`}>{category.category}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {category.items.map((item, itemIndex) => (
                            <div key={itemIndex} className={`p-3 text-center rounded-lg ${theme.cardBg} ${theme.border} border hover:shadow-sm transition-shadow`}>
                              <span className={`text-sm ${theme.textSecondary}`}>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Rating Section with Expert Mode */}
          <div className={`${theme.cardBg} mx-4 sm:mx-5 lg:mx-6 mt-4 sm:mt-5 mb-6 sm:mb-8 rounded-2xl p-4 sm:p-6 ${theme.border} border shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.text}`}>Rate This Wine</h3>
              <button
                onClick={() => setIsExpertMode(!isExpertMode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isExpertMode 
                    ? `${theme.accent} text-white` 
                    : `${theme.button} ${theme.textSecondary}`
                }`}
              >
                Expert Mode
              </button>
            </div>

            {/* Star Rating */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  className="transition-all duration-200 hover:scale-125 active:scale-110"
                >
                  <Star 
                    size={window.innerWidth >= 640 ? 36 : 32} 
                    className={star <= userRating ? 'text-amber-400 fill-current drop-shadow-lg' : theme.textMuted}
                  />
                </button>
              ))}
            </div>

            {userRating > 0 && (
              <div className={`text-center mb-4 p-3 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                <span className={`text-sm font-medium ${theme.textSecondary}`}>
                  {userRating === 5 ? 'Exceptional!' : userRating === 4 ? 'Very Good' : userRating === 3 ? 'Good' : userRating === 2 ? 'Fair' : 'Needs Work'}
                </span>
              </div>
            )}

            {/* Rating Notes */}
            <div className="mb-4">
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                Personal Notes (Optional)
              </label>
              <textarea
                value={ratingNotes}
                onChange={(e) => setRatingNotes(e.target.value)}
                placeholder="What did you think of this wine? Any personal observations..."
                className={`w-full p-3 rounded-xl border ${theme.border} ${theme.cardBg} ${theme.text} focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 resize-none`}
                rows="3"
              />
            </div>

            {/* Expert Mode Descriptors */}
            {isExpertMode && (
              <div className="mb-6 space-y-4">
                <h4 className={`font-medium ${theme.text} flex items-center gap-2`}>
                  <Edit3 size={16} />
                  Tasting Descriptors
                </h4>
                
                {Object.entries(descriptorData).map(([category, subcategories]) => (
                  <div key={category} className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                    <h5 className={`font-medium ${theme.text} mb-3 capitalize`}>{category}</h5>
                    {Object.entries(subcategories).map(([subcat, descriptors]) => (
                      <div key={subcat} className="mb-3 last:mb-0">
                        <p className={`text-xs ${theme.textMuted} mb-2 capitalize font-medium`}>{subcat}</p>
                        <div className="flex flex-wrap gap-2">
                          {descriptors.map((descriptor) => (
                            <button
                              key={descriptor}
                              onClick={() => toggleDescriptor(descriptor)}
                              className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                                selectedDescriptors.includes(descriptor)
                                  ? 'bg-amber-600 text-white shadow-md'
                                  : `${theme.button} ${theme.textSecondary} hover:bg-amber-100`
                              }`}
                            >
                              {descriptor}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={saveRating}
              disabled={saving || !userRating}
              className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${theme.accent} ${theme.accentHover} text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? 'Saving...' : 'Submit Rating & Continue to Next Wine'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
    

        {/* Main Wine Information */}
        <div className={`${theme.cardBg} mx-5 mt-5 rounded-2xl p-6 ${theme.border} border shadow-sm`}>
          <div className="mb-5">
            <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>{wine.wine_name}</h2>
            <p className={`${theme.textSecondary} mb-3 text-lg`}>
              {wine.producer}{wine.region ? ` • ${wine.region}` : ''}
            </p>
            
            {/* Awards */}
            {wine.awards && wine.awards.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {wine.awards.slice(0, 2).map((award, index) => (
                  <span key={index} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-full bg-amber-100 text-amber-800">
                    <Award size={12} />
                    {award}
                  </span>
                ))}
              </div>
            )}
            
            {/* Wine Style Tags */}
            {wine.wine_style && wine.wine_style.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {wine.wine_style.map((style, index) => (
                  <span key={index} className={`px-3 py-1.5 text-sm rounded-full ${theme.accentLight} ${theme.accentText} font-medium`}>
                    {style}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <p className={`${theme.textSecondary} leading-relaxed text-base`}>
            {wine.sommelier_notes || "A carefully selected wine for this tasting experience."}
          </p>
        </div>

        {/* Expandable Sections */}
        <div className="mx-5 mt-5 space-y-4">
          
          {/* Grape Composition - only show if we have grape data */}
          {wine.grape_varieties && wine.grape_varieties.length > 0 && (
            <div className={`${theme.cardBg} rounded-2xl ${theme.border} border overflow-hidden shadow-sm`}>
              <button 
                onClick={() => toggleSection('details')}
                className={`w-full p-5 flex items-center justify-between ${theme.button} transition-all duration-200 hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                    <Grape size={20} />
                  </div>
                  <div className="text-left">
                    <span className={`font-semibold ${theme.text} block text-base`}>{terminology.grapeSection}</span>
                    <span className={`text-sm ${theme.textMuted}`}>{terminology.grapeSubtext}</span>
                  </div>
                </div>
                <div className="transition-transform duration-300" style={{ transform: expandedSections.details ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDown size={20} className={theme.textMuted} />
                </div>
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.details ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-5 pb-5">
                  <div className="space-y-3">
                    {wine.grape_varieties.map((grape, index) => (
                      <AnimatedBar key={grape.name} grape={grape} index={index} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sommelier Notes - Enhanced */}
          {(wine.tasting_notes || wine.sommelier_notes) && (
            <div className={`${theme.cardBg} rounded-2xl ${theme.border} border overflow-hidden shadow-sm`}>
              <button 
                onClick={() => toggleSection('sommelier')}
                className={`w-full p-5 flex items-center justify-between ${theme.button} transition-all duration-200 hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                    <BookOpen size={20} />
                  </div>
                  <div className="text-left">
                    <span className={`font-semibold ${theme.text} block text-base`}>Professional Tasting Notes</span>
                    <span className={`text-sm ${theme.textMuted}`}>Sommelier analysis & characteristics</span>
                  </div>
                </div>
                <div className="transition-transform duration-300" style={{ transform: expandedSections.sommelier ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDown size={20} className={theme.textMuted} />
                </div>
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.sommelier ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-5 pb-5 space-y-4">
                  {wine.sommelier_notes && (
                    <div className={`${theme.textSecondary} italic border-l-4 border-amber-200 pl-4 py-2 bg-amber-50 rounded-r-lg`}>
                      "{wine.sommelier_notes}"
                    </div>
                  )}
                  
                  {wine.tasting_notes && (
                    <div className="grid gap-4">
                      {wine.tasting_notes.appearance && (
                        <div className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                          <h4 className={`font-semibold ${theme.text} mb-2`}>Visual</h4>
                          <p className={`text-sm ${theme.textSecondary}`}>{wine.tasting_notes.appearance}</p>
                        </div>
                      )}
                      
                      {wine.tasting_notes.aroma && (
                        <div className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                          <h4 className={`font-semibold ${theme.text} mb-2`}>Aroma Profile</h4>
                          <p className={`text-sm ${theme.textSecondary}`}>{wine.tasting_notes.aroma}</p>
                        </div>
                      )}
                      
                      {wine.tasting_notes.taste && (
                        <div className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                          <h4 className={`font-semibold ${theme.text} mb-2`}>Palate</h4>
                          <p className={`text-sm ${theme.textSecondary}`}>{wine.tasting_notes.taste}</p>
                        </div>
                      )}
                      
                      {wine.tasting_notes.finish && (
                        <div className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                          <h4 className={`font-semibold ${theme.text} mb-2`}>Finish</h4>
                          <p className={`text-sm ${theme.textSecondary}`}>{wine.tasting_notes.finish}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Food Pairings */}
          {wine.food_pairings && wine.food_pairings.length > 0 && (
            <div className={`${theme.cardBg} rounded-2xl ${theme.border} border overflow-hidden shadow-sm`}>
              <button 
                onClick={() => toggleSection('foodPairing')}
                className={`w-full p-5 flex items-center justify-between ${theme.button} transition-all duration-200 hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                    <Utensils size={20} />
                  </div>
                  <div className="text-left">
                    <span className={`font-semibold ${theme.text} block text-base`}>Culinary Pairings</span>
                    <span className={`text-sm ${theme.textMuted}`}>Recommended food combinations</span>
                  </div>
                </div>
                <div className="transition-transform duration-300" style={{ transform: expandedSections.foodPairing ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDown size={20} className={theme.textMuted} />
                </div>
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.foodPairing ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-5 pb-5 space-y-4">
                  {wine.food_pairings.map((category, index) => (
                    <div key={index} className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                      <h4 className={`font-semibold ${theme.text} mb-3`}>{category.category}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {category.items.map((item, itemIndex) => (
                          <div key={itemIndex} className={`p-3 text-center rounded-lg ${theme.cardBg} ${theme.border} border hover:shadow-sm transition-shadow`}>
                            <span className={`text-sm ${theme.textSecondary}`}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Winemaker Notes */}
          {wine.winemaker_notes && (
            <div className={`${theme.cardBg} rounded-2xl ${theme.border} border overflow-hidden shadow-sm`}>
              <button 
                onClick={() => toggleSection('winemaker')}
                className={`w-full p-5 flex items-center justify-between ${theme.button} transition-all duration-200 hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                    <Wine size={20} />
                  </div>
                  <div className="text-left">
                    <span className={`font-semibold ${theme.text} block text-base`}>Winemaker Notes</span>
                    <span className={`text-sm ${theme.textMuted}`}>Production details & philosophy</span>
                  </div>
                </div>
                <div className="transition-transform duration-300" style={{ transform: expandedSections.winemaker ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDown size={20} className={theme.textMuted} />
                </div>
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.winemaker ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-5 pb-5">
                  <p className={`${theme.textSecondary} leading-relaxed`}>
                    {wine.winemaker_notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Technical Details */}
          {wine.technical_details && (
            <div className={`${theme.cardBg} rounded-2xl ${theme.border} border overflow-hidden shadow-sm`}>
              <button 
                onClick={() => toggleSection('technical')}
                className={`w-full p-5 flex items-center justify-between ${theme.button} transition-all duration-200 hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                    <Info size={20} />
                  </div>
                  <div className="text-left">
                    <span className={`font-semibold ${theme.text} block text-base`}>Technical Details</span>
                    <span className={`text-sm ${theme.textMuted}`}>Production specifications</span>
                  </div>
                </div>
                <div className="transition-transform duration-300" style={{ transform: expandedSections.technical ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDown size={20} className={theme.textMuted} />
                </div>
              </button>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.technical ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="px-5 pb-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {wine.technical_details.ph && (
                      <div className={`p-3 rounded-lg ${theme.accentLight} border ${theme.border}`}>
                        <span className={`block font-semibold ${theme.text} mb-1`}>pH Level</span>
                        <span className={theme.textSecondary}>{wine.technical_details.ph}</span>
                      </div>
                    )}
                    {wine.technical_details.residual_sugar && (
                      <div className={`p-3 rounded-lg ${theme.accentLight} border ${theme.border}`}>
                        <span className={`block font-semibold ${theme.text} mb-1`}>Residual Sugar</span>
                        <span className={theme.textSecondary}>{wine.technical_details.residual_sugar}</span>
                      </div>
                    )}
                    {wine.technical_details.total_acidity && (
                      <div className={`p-3 rounded-lg ${theme.accentLight} border ${theme.border}`}>
                        <span className={`block font-semibold ${theme.text} mb-1`}>Total Acidity</span>
                        <span className={theme.textSecondary}>{wine.technical_details.total_acidity}</span>
                      </div>
                    )}
                    {wine.technical_details.aging && (
                      <div className={`p-3 rounded-lg ${theme.accentLight} border ${theme.border}`}>
                        <span className={`block font-semibold ${theme.text} mb-1`}>Aging Process</span>
                        <span className={theme.textSecondary}>{wine.technical_details.aging}</span>
                      </div>
                    )}
                  </div>
                  {wine.technical_details.production && (
                    <div className={`p-3 rounded-lg ${theme.accentLight} border ${theme.border}`}>
                      <span className={`block font-semibold ${theme.text} mb-1`}>Production</span>
                      <span className={theme.textSecondary}>{wine.technical_details.production}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Rating Section with Expert Mode */}
        <div className={`${theme.cardBg} mx-5 mt-5 mb-8 rounded-2xl p-6 ${theme.border} border shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${theme.text}`}>Rate This Wine</h3>
            <button
              onClick={() => setIsExpertMode(!isExpertMode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isExpertMode 
                  ? `${theme.accent} text-white` 
                  : `${theme.button} ${theme.textSecondary}`
              }`}
            >
              Expert Mode
            </button>
          </div>

          {/* Star Rating */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setUserRating(star)}
                className="transition-all duration-200 hover:scale-125 active:scale-110"
              >
                <Star 
                  size={36} 
                  className={star <= userRating ? 'text-amber-400 fill-current drop-shadow-lg' : theme.textMuted}
                />
              </button>
            ))}
          </div>

          {userRating > 0 && (
            <div className={`text-center mb-4 p-3 rounded-xl ${theme.accentLight} border ${theme.border}`}>
              <span className={`text-sm font-medium ${theme.textSecondary}`}>
                {userRating === 5 ? 'Exceptional!' : userRating === 4 ? 'Very Good' : userRating === 3 ? 'Good' : userRating === 2 ? 'Fair' : 'Needs Work'}
              </span>
            </div>
          )}

          {/* Rating Notes */}
          <div className="mb-4">
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
              Personal Notes (Optional)
            </label>
            <textarea
              value={ratingNotes}
              onChange={(e) => setRatingNotes(e.target.value)}
              placeholder="What did you think of this wine? Any personal observations..."
              className={`w-full p-3 rounded-xl border ${theme.border} ${theme.cardBg} ${theme.text} focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 resize-none`}
              rows="3"
            />
          </div>

          {/* Expert Mode Descriptors */}
          {isExpertMode && (
            <div className="mb-6 space-y-4">
              <h4 className={`font-medium ${theme.text} flex items-center gap-2`}>
                <Edit3 size={16} />
                Tasting Descriptors
              </h4>
              
              {Object.entries(descriptorData).map(([category, subcategories]) => (
                <div key={category} className={`p-4 rounded-xl ${theme.accentLight} border ${theme.border}`}>
                  <h5 className={`font-medium ${theme.text} mb-3 capitalize`}>{category}</h5>
                  {Object.entries(subcategories).map(([subcat, descriptors]) => (
                    <div key={subcat} className="mb-3 last:mb-0">
                      <p className={`text-xs ${theme.textMuted} mb-2 capitalize font-medium`}>{subcat}</p>
                      <div className="flex flex-wrap gap-2">
                        {descriptors.map((descriptor) => (
                          <button
                            key={descriptor}
                            onClick={() => toggleDescriptor(descriptor)}
                            className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                              selectedDescriptors.includes(descriptor)
                                ? 'bg-amber-600 text-white shadow-md'
                                : `${theme.button} ${theme.textSecondary} hover:bg-amber-100`
                            }`}
                          >
                            {descriptor}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={saveRating}
            disabled={saving || !userRating}
            className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${theme.accent} ${theme.accentHover} text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? 'Saving...' : 'Submit Rating & Continue to Next Wine'}
          </button>
        </div>

};

export default WineDetailsInterface;
