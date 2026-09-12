import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Search, X } from 'lucide-react';

const WINE_TYPES = [
  { value: 'red', label: 'Red' },
  { value: 'white', label: 'White' },
  { value: 'rosé', label: 'Rosé' },
  { value: 'sparkling', label: 'Sparkling' },
  { value: 'dessert', label: 'Dessert' },
];

// mode='event'  → searches event wine list + event outliers (requires eventId)
// mode='catalog' → searches full wine_catalog + all active outliers
const WineSearch = ({ mode = 'event', eventId, onSelect, onNotFound }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchText && !selectedType) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(runSearch, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchText, selectedType, mode, eventId]);

  const runSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      if (mode === 'event' && eventId) {
        await searchEventWines();
      } else {
        await searchCatalog();
      }
    } finally {
      setIsSearching(false);
    }
  };

  const searchEventWines = async () => {
    let q = supabase.from('event_wines').select('*').eq('event_id', eventId);
    if (selectedType) q = q.eq('wine_type', selectedType);
    if (searchText) q = q.or(`wine_name.ilike.%${searchText}%,producer.ilike.%${searchText}%`);
    const { data: eventWines } = await q.limit(15);

    let oq = supabase.from('outlier_wines').select('*')
      .eq('submitted_from_event', eventId).eq('status', 'active');
    if (selectedType) oq = oq.eq('wine_type', selectedType);
    if (searchText) oq = oq.or(`wine_name.ilike.%${searchText}%,producer.ilike.%${searchText}%`);
    const { data: outliers } = await oq.limit(10);

    setResults([
      ...(eventWines || []).map(w => ({ ...w, is_outlier: false })),
      ...(outliers || []).map(w => ({ ...w, is_outlier: true })),
    ]);
  };

  const searchCatalog = async () => {
    if (searchText && searchText.length >= 3) {
      const { data } = await supabase.rpc('find_similar_wines', {
        search_text: searchText,
        similarity_threshold: 0.2,
        result_limit: 25,
      });
      let filtered = data || [];
      if (selectedType) filtered = filtered.filter(w => w.wine_type === selectedType);
      setResults(filtered);
    } else {
      let cq = supabase.from('wine_catalog')
        .select('id, wine_name, producer, vintage, wine_type, region, country');
      if (selectedType) cq = cq.eq('wine_type', selectedType);
      if (searchText) cq = cq.or(`wine_name.ilike.%${searchText}%,producer.ilike.%${searchText}%`);
      const { data: catalogWines } = await cq.limit(20);

      let oq = supabase.from('outlier_wines')
        .select('id, wine_name, producer, vintage, wine_type, region, country')
        .eq('status', 'active');
      if (selectedType) oq = oq.eq('wine_type', selectedType);
      if (searchText) oq = oq.or(`wine_name.ilike.%${searchText}%,producer.ilike.%${searchText}%`);
      const { data: outliers } = await oq.limit(10);

      setResults([
        ...(catalogWines || []).map(w => ({ ...w, is_outlier: false })),
        ...(outliers || []).map(w => ({ ...w, is_outlier: true })),
      ]);
    }
  };

  const toggleType = (type) => {
    setSelectedType(prev => prev === type ? null : type);
  };

  const clearAll = () => {
    setSearchText('');
    setSelectedType(null);
    setResults([]);
    setHasSearched(false);
  };

  const hasFilters = searchText || selectedType;

  return (
    <div className="w-full space-y-3">
      {/* Type chips */}
      <div className="flex gap-2 flex-wrap">
        {WINE_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => toggleType(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedType === value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or producer..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        )}
        {!isSearching && hasFilters && (
          <button onClick={clearAll} className="absolute right-3 top-3">
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {results.length > 0 ? (
            <>
              {results.map(wine => (
                <div
                  key={`${wine.is_outlier ? 'o' : 'c'}-${wine.id}`}
                  onClick={() => onSelect?.(wine, wine.is_outlier)}
                  className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{wine.wine_name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {[wine.producer, wine.vintage, wine.wine_type && wine.wine_type.charAt(0).toUpperCase() + wine.wine_type.slice(1), wine.region]
                        .filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  {wine.is_outlier && (
                    <span className="shrink-0 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                      Added Wine
                    </span>
                  )}
                </div>
              ))}
              {onNotFound && (
                <button
                  onClick={() => onNotFound(searchText)}
                  className="w-full p-3 text-center text-sm text-purple-600 hover:bg-purple-50 border-t border-gray-200"
                >
                  Can't find it? Submit a new wine →
                </button>
              )}
            </>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500 mb-3">No wines found</p>
              {onNotFound && (
                <button
                  onClick={() => onNotFound(searchText)}
                  className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                >
                  Can't find it? Submit a new wine →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WineSearch;
