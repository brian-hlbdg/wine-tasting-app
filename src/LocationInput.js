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
      // Search in both event_locations and tasting_events main location
      const searches = [];

      // Search event_locations table
      searches.push(
        supabase
          .from('event_locations')
          .select('location_name, location_address, location_notes')
          .ilike('location_name', `%${searchTerm}%`)
          .limit(5)
      );

      // Search main event locations from tasting_events
      searches.push(
        supabase
          .from('tasting_events')
          .select('location')
          .ilike('location', `%${searchTerm}%`)
          .not('location', 'is', null)
          .limit(5)
      );

      const [eventLocationsResult, mainLocationsResult] = await Promise.all(searches);

      let combinedResults = [];

      // Add event_locations results
      if (eventLocationsResult.data && !eventLocationsResult.error) {
        combinedResults = [...combinedResults, ...eventLocationsResult.data.map(loc => ({
          location_name: loc.location_name,
          address: loc.location_address,
          notes: loc.location_notes,
          source: 'event_locations'
        }))];
      }

      // Add main event locations
      if (mainLocationsResult.data && !mainLocationsResult.error) {
        combinedResults = [...combinedResults, ...mainLocationsResult.data.map(event => ({
          location_name: event.location,
          address: null,
          notes: null,
          source: 'main_location'
        }))];
      }

      // Remove duplicates based on location_name
      const uniqueResults = [];
      const seen = new Set();

      combinedResults.forEach(location => {
        const key = location.location_name?.toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueResults.push(location);
        }
      });

      setSearchResults(uniqueResults.slice(0, 8));
      setShowDropdown(uniqueResults.length > 0);

    } catch (error) {
      console.error('Location search error:', error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (location) => {
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
              key={`${location.location_name}-${index}`}
              onClick={() => selectLocation(location)}
              className="p-3 hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{location.location_name}</div>
                  {location.address && (
                    <div className="text-sm text-gray-500">{location.address}</div>
                  )}
                  {location.notes && (
                    <div className="text-xs text-gray-400 mt-1">{location.notes}</div>
                  )}
                </div>
                <div className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded ml-2">
                  {location.source === 'event_locations' ? 'Venue' : 'Event'}
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