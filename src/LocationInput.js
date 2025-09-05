import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

const LocationInput = ({ value, onChange, onLocationSelected, className, placeholder = "Location" }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (value && value.length >= 2) {
      searchLocations(value);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [value]);

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

  const searchLocations = async (searchTerm) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('locations_master')
        .select('*')
        .ilike('location_name', `%${searchTerm}%`)
        .order('usage_count', { ascending: false })
        .limit(8);

      if (!error && data) {
        setSearchResults(data);
        setShowDropdown(data.length > 0);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = async (location) => {
    // Update usage count
    try {
      await supabase
        .from('locations_master')
        .update({ usage_count: (location.usage_count || 0) + 1 })
        .eq('id', location.id);
    } catch (error) {
      console.error('Error updating location usage count:', error);
    }

    onChange(location.location_name);
    
    if (onLocationSelected) {
      onLocationSelected(location);
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
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-50"
        >
          {searchResults.map((location, index) => (
            <div
              key={`${location.id}-${index}`}
              onClick={() => selectLocation(location)}
              className="p-3 hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{location.location_name}</div>
                  {location.address && (
                    <div className="text-sm text-gray-500">{location.address}</div>
                  )}
                  {location.location_notes && (
                    <div className="text-xs text-gray-400 mt-1">{location.location_notes}</div>
                  )}
                </div>
                <div className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded ml-2">
                  {location.usage_count || 0}x
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;