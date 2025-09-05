import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

const WineNameInput = ({ value, onChange, onWineSelected, className, placeholder = "Wine name" }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (value && value.length >= 2) {
      searchWines(value);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [value]);

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

  const searchWines = async (searchTerm) => {
    setIsSearching(true);
    try {
      // Search in event_wines table - your actual table
      const { data: eventWinesData, error: eventWinesError } = await supabase
        .from('event_wines')
        .select(`
          wine_name,
          producer,
          vintage,
          wine_type,
          region,
          country,
          price_point,
          alcohol_content,
          sommelier_notes,
          image_url,
          grape_varieties,
          wine_style,
          food_pairings,
          tasting_notes,
          winemaker_notes,
          technical_details,
          awards
        `)
        .or(`wine_name.ilike.%${searchTerm}%,producer.ilike.%${searchTerm}%`)
        .limit(10);

      if (eventWinesError) {
        console.error('Search error:', eventWinesError);
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      // Remove duplicates based on wine_name and producer
      const uniqueResults = [];
      const seen = new Set();

      eventWinesData?.forEach(wine => {
        const key = `${wine.wine_name?.toLowerCase()}-${wine.producer?.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueResults.push({
            ...wine,
            source: 'event_wines'
          });
        }
      });

      setSearchResults(uniqueResults.slice(0, 8));
      setShowDropdown(uniqueResults.length > 0);

    } catch (error) {
      console.error('Wine search error:', error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const selectWine = (wine) => {
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
              key={`${wine.wine_name}-${wine.producer}-${index}`}
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
                </div>
                <div className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded ml-2">
                  DB
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