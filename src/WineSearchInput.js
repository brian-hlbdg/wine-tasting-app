import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Search, Plus, Wine } from 'lucide-react';

const WineSearchInput = ({ onWineSelected, onCreateNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchWines();
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchTerm]);

  const searchWines = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('wines_master')
        .select('*')
        .or(`wine_name.ilike.%${searchTerm}%,producer.ilike.%${searchTerm}%`)
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Wine search error:', error);
      } else {
        setSearchResults(data || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Wine search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectWine = (wine) => {
    // Update usage count
    supabase
      .from('wines_master')
      .update({ usage_count: wine.usage_count + 1 })
      .eq('id', wine.id)
      .then();

    onWineSelected(wine);
    setSearchTerm('');
    setShowResults(false);
  };

  const createNewWine = () => {
    onCreateNew(searchTerm);
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search wines or enter new wine name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto z-50">
          {searchResults.length > 0 ? (
            <>
              {searchResults.map(wine => (
                <div
                  key={wine.id}
                  onClick={() => selectWine(wine)}
                  className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{wine.wine_name}</div>
                      <div className="text-sm text-gray-600">
                        {wine.producer && <span>{wine.producer} • </span>}
                        {wine.vintage && <span>{wine.vintage} • </span>}
                        <span className="capitalize">{wine.wine_type}</span>
                        {wine.region && <span> • {wine.region}</span>}
                      </div>
                    </div>
                    <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Used {wine.usage_count}x
                    </div>
                  </div>
                </div>
              ))}
              
              {searchTerm && (
                <div
                  onClick={createNewWine}
                  className="p-3 hover:bg-green-50 cursor-pointer border-t-2 border-green-200 text-green-700"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">Add "{searchTerm}" as new wine</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center">
              <Wine className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 mb-2">No wines found</p>
              {searchTerm && (
                <button
                  onClick={createNewWine}
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  Create "{searchTerm}" as new wine
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WineSearchInput;