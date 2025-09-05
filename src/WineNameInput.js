import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';

const WineNameInput = ({ value, onChange, onWineSelected, className, placeholder = "Wine name" }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Helper function to parse grape varieties
  const parseGrapeVarieties = useCallback((grapes) => {
    if (!grapes) return null;
    if (grapes.startsWith('[') && grapes.endsWith(']')) {
      try {
        return JSON.parse(grapes);
      } catch (e) {
        return [grapes];
      }
    }
    return [grapes];
  }, []);

  // Helper function to parse food pairings
  const parseFoodPairings = useCallback((harmonize) => {
    if (!harmonize) return null;
    if (harmonize.startsWith('[') && harmonize.endsWith(']')) {
      try {
        return JSON.parse(harmonize);
      } catch (e) {
        return [harmonize];
      }
    }
    return [harmonize];
  }, []);

  // Helper function to remove duplicates
  const removeDuplicates = useCallback((results) => {
    const seen = new Set();
    return results.filter(wine => {
      const key = `${wine.wine_name?.toLowerCase()}-${wine.producer?.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const searchWines = useCallback(async (searchTerm) => {
    setIsSearching(true);
    try {
      const searches = [];

      // Search WineName table (now with renamed columns)
      searches.push(
        supabase
          .from('WineName')
          .select(`
            "WineID" as id,
            wine_name,
            producer,
            vintage,
            wine_type,
            beverage_type,
            region,
            country,
            price_point,
            alcohol_content,
            sommelier_notes,
            image_url,
            grape_varieties,
            wine_style,
            food_pairings,
            usage_count,
            "Website" as winery_website,
            "Grapes" as original_grapes,
            "Harmonize" as original_harmonize,
            "Body" as body_style
          `)
          .or(`wine_name.ilike.%${searchTerm}%,producer.ilike.%${searchTerm}%`)
          .limit(6)
      );

      // Search event_wines
      searches.push(
        supabase
          .from('event_wines')
          .select(`
            id, wine_name, producer, vintage, wine_type, beverage_type,
            region, country, price_point, alcohol_content, sommelier_notes,
            image_url, grape_varieties, wine_style, food_pairings
          `)
          .or(`wine_name.ilike.%${searchTerm}%,producer.ilike.%${searchTerm}%`)
          .limit(6)
      );

      const [catalogResult, eventWinesResult] = await Promise.all(searches);

      // Combine results
      const catalogWines = (catalogResult.data || []).map(wine => ({
        ...wine,
        source: 'wine_catalog',
        // Parse original fields if needed
        grape_varieties: wine.grape_varieties || parseGrapeVarieties(wine.original_grapes),
        food_pairings: wine.food_pairings || parseFoodPairings(wine.original_harmonize),
        wine_style: wine.wine_style || (wine.body_style ? [wine.body_style] : null)
      }));

      const eventWines = (eventWinesResult.data || []).map(wine => ({
        ...wine,
        source: 'event_wines',
        usage_count: 0
      }));

      const allResults = [...catalogWines, ...eventWines];

      // Remove duplicates and sort
      const uniqueResults = removeDuplicates(allResults);
      
      setSearchResults(uniqueResults.slice(0, 8));
      setShowDropdown(uniqueResults.length > 0);

    } catch (error) {
      console.error('Wine search error:', error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, [parseGrapeVarieties, parseFoodPairings, removeDuplicates]);

  useEffect(() => {
    if (value && value.length >= 2) {
      searchWines(value);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [value, searchWines]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectWine = async (wine) => {
    // Update usage count if it's from wine catalog
    if (wine.source === 'wine_catalog' && wine.id) {
      try {
        await supabase
          .from('WineName')
          .update({ usage_count: (wine.usage_count || 0) + 1 })
          .eq('WineID', wine.id);
      } catch (error) {
        console.error('Error updating usage count:', error);
      }
    }

    // Update the input value
    onChange(wine.wine_name);
    
    // Auto-fill the form with selected wine data
    if (onWineSelected) {
      onWineSelected(wine);
    }
    
    setShowDropdown(false);
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    if (value && value.length >= 2 && searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        className={className}
      />
      
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {showDropdown && searchResults.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto z-50"
        >
          {searchResults.map((wine, index) => (
            <div
              key={`${wine.source}-${wine.id}-${index}`}
              onClick={() => selectWine(wine)}
              className="p-3 hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{wine.wine_name}</div>
                  <div className="text-sm text-gray-600">
                    {wine.producer && (
                      <span>{wine.producer}</span>
                    )}
                    {wine.vintage && (
                      <span> • {wine.vintage}</span>
                    )}
                    {wine.region && wine.country && (
                      <span> • {wine.region}, {wine.country}</span>
                    )}
                  </div>
                  {wine.wine_type && (
                    <div className="text-xs text-amber-600 mt-1">
                      {wine.wine_type}
                      {wine.price_point && ` • ${wine.price_point}`}
                    </div>
                  )}
                  {/* Show grape varieties if available */}
                  {wine.grape_varieties && Array.isArray(wine.grape_varieties) && (
                    <div className="text-xs text-gray-500 mt-1">
                      {wine.grape_varieties.join(', ')}
                    </div>
                  )}
                  {/* Show original grapes if grape_varieties not available */}
                  {!wine.grape_varieties && wine.original_grapes && (
                    <div className="text-xs text-gray-500 mt-1">
                      {wine.original_grapes}
                    </div>
                  )}
                  {/* Show winery website if available */}
                  {wine.winery_website && (
                    <div className="text-xs text-blue-500 mt-1">
                      🌐 {wine.winery_website}
                    </div>
                  )}
                </div>
                <div className="ml-2 flex flex-col items-end gap-1">
                  <div className={`text-xs px-2 py-1 rounded ${
                    wine.source === 'wine_catalog' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {wine.source === 'wine_catalog' ? 'Catalog' : 'Event'}
                  </div>
                  {wine.usage_count > 0 && (
                    <div className="text-xs text-gray-500">
                      {wine.usage_count}x used
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WineNameInput;