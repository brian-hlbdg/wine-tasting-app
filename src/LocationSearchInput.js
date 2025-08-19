import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { MapPin, Plus } from 'lucide-react';

const LocationSearchInput = ({ value, onChange, placeholder = "Location" }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchLocations();
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchTerm]);

  const searchLocations = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('locations_master')
        .select('*')
        .ilike('location_name', `%${searchTerm}%`)
        .order('usage_count', { ascending: false })
        .limit(8);

      if (error) {
        console.error('Location search error:', error);
      } else {
        setSearchResults(data || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = async (location) => {
    // Update usage count
    await supabase
      .from('locations_master')
      .update({ usage_count: location.usage_count + 1 })
      .eq('id', location.id);

    setSearchTerm(location.location_name);
    onChange(location.location_name);
    setShowResults(false);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
  };

  const saveNewLocation = async (locationName) => {
    try {
      await supabase
        .from('locations_master')
        .insert([{ location_name: locationName }]);
      
      setSearchTerm(locationName);
      onChange(locationName);
      setShowResults(false);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleBlur = () => {
    // Delay hiding results to allow clicks
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
          onBlur={handleBlur}
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
        />
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-50">
          {searchResults.length > 0 ? (
            <>
              {searchResults.map(location => (
                <div
                  key={location.id}
                  onClick={() => selectLocation(location)}
                  className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{location.location_name}</div>
                      {location.address && (
                        <div className="text-sm text-gray-500">{location.address}</div>
                      )}
                    </div>
                    <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {location.usage_count}x
                    </div>
                  </div>
                </div>
              ))}
              
              {searchTerm && !searchResults.some(loc => loc.location_name.toLowerCase() === searchTerm.toLowerCase()) && (
                <div
                  onClick={() => saveNewLocation(searchTerm)}
                  className="p-3 hover:bg-green-50 cursor-pointer border-t-2 border-green-200 text-green-700"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">Save "{searchTerm}" as new location</span>
                  </div>
                </div>
              )}
            </>
          ) : searchTerm.length >= 2 ? (
            <div className="p-4 text-center">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">No locations found</p>
              <button
                onClick={() => saveNewLocation(searchTerm)}
                className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Save "{searchTerm}" as new location
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default LocationSearchInput;