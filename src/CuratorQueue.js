import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { CheckCircle, Link2, XCircle, RefreshCw, Search } from 'lucide-react';

const CuratorQueue = () => {
  const [outliers, setOutliers] = useState([]);
  const [catalogMap, setCatalogMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  // Per-card link flow
  const [linkingId, setLinkingId] = useState(null);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkResults, setLinkResults] = useState([]);
  const [isLinkSearching, setIsLinkSearching] = useState(false);
  const linkDebounce = useRef(null);

  useEffect(() => { loadQueue(); }, []);

  const loadQueue = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('outlier_wines')
      .select('*')
      .eq('status', 'active')
      .order('submission_count', { ascending: false });

    const items = data || [];
    setOutliers(items);

    const allIds = [...new Set(items.flatMap(o => o.similar_catalog_ids || []))];
    if (allIds.length > 0) {
      const { data: catalogWines } = await supabase
        .from('wine_catalog')
        .select('id, wine_name, producer')
        .in('id', allIds);
      const map = {};
      (catalogWines || []).forEach(w => { map[w.id] = w; });
      setCatalogMap(map);
    }
    setLoading(false);
  };

  const act = async (outlierId, action, extra = {}) => {
    setActionLoading(prev => ({ ...prev, [outlierId]: action }));
    try {
      if (action === 'promote') {
        const o = outliers.find(x => x.id === outlierId);
        const { error } = await supabase.from('wine_catalog').insert({
          wine_name: o.wine_name,
          producer: o.producer || null,
          vintage: o.vintage || null,
          wine_type: o.wine_type || null,
          beverage_type: o.beverage_type || null,
          region: o.region || null,
          country: o.country || null,
          price_point: o.price_point || null,
          alcohol_content: o.alcohol_content || null,
          sommelier_notes: o.sommelier_notes || null,
          image_url: o.image_url || null,
          grape_varieties: o.grape_varieties || [],
          wine_style: o.wine_style || [],
          food_pairings: o.food_pairings || [],
          food_pairing_notes: o.food_pairing_notes || null,
          tasting_notes: o.tasting_notes || {},
          winemaker_notes: o.winemaker_notes || null,
          technical_details: o.technical_details || {},
          awards: o.awards || [],
        });
        if (error) throw error;
        await supabase.from('outlier_wines').update({ status: 'promoted' }).eq('id', outlierId);
      } else if (action === 'link') {
        await supabase.from('outlier_wines')
          .update({ status: 'linked', linked_catalog_id: extra.catalogId })
          .eq('id', outlierId);
      } else if (action === 'reject') {
        await supabase.from('outlier_wines').update({ status: 'rejected' }).eq('id', outlierId);
      }
      setOutliers(prev => prev.filter(o => o.id !== outlierId));
      setLinkingId(null);
      setLinkSearch('');
      setLinkResults([]);
    } catch (err) {
      alert('Action failed: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [outlierId]: null }));
    }
  };

  const handleLinkSearchChange = (text) => {
    setLinkSearch(text);
    if (linkDebounce.current) clearTimeout(linkDebounce.current);
    if (!text || text.length < 2) { setLinkResults([]); return; }
    linkDebounce.current = setTimeout(async () => {
      setIsLinkSearching(true);
      try {
        const { data } = await supabase
          .from('wine_catalog')
          .select('id, wine_name, producer, vintage, wine_type')
          .or(`wine_name.ilike.%${text}%,producer.ilike.%${text}%`)
          .limit(8);
        setLinkResults(data || []);
      } finally {
        setIsLinkSearching(false);
      }
    }, 300);
  };

  const openLink = (outlierId) => {
    setLinkingId(outlierId);
    setLinkSearch('');
    setLinkResults([]);
  };

  const cancelLink = () => {
    setLinkingId(null);
    setLinkSearch('');
    setLinkResults([]);
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500">Loading wine queue...</p>
      </div>
    );
  }

  if (outliers.length === 0) {
    return (
      <div className="py-16 text-center">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Queue is clear</h3>
        <p className="text-gray-500 text-sm">No active outlier wines waiting for review.</p>
        <button onClick={loadQueue} className="mt-4 text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 mx-auto">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Wine Queue</h2>
          <p className="text-sm text-gray-500">{outliers.length} wines awaiting review · sorted by submission count</p>
        </div>
        <button onClick={loadQueue} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {outliers.map(outlier => {
        const busy = actionLoading[outlier.id];
        const isLinking = linkingId === outlier.id;
        const similarWines = (outlier.similar_catalog_ids || [])
          .slice(0, 3)
          .map(id => catalogMap[id])
          .filter(Boolean);

        return (
          <div key={outlier.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">{outlier.wine_name}</h3>
                  <p className="text-sm text-gray-500 truncate">
                    {[outlier.producer, outlier.vintage, outlier.wine_type && outlier.wine_type.charAt(0).toUpperCase() + outlier.wine_type.slice(1), outlier.region]
                      .filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold whitespace-nowrap">
                  {outlier.submission_count}× submitted
                </span>
              </div>

              {/* Similar catalog wines */}
              {similarWines.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Similar in catalog</p>
                  <div className="space-y-1">
                    {similarWines.map(w => (
                      <div key={w.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="truncate">{w.wine_name}{w.producer ? ` — ${w.producer}` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes if any */}
              {outlier.sommelier_notes && (
                <p className="text-sm text-gray-500 italic mb-4 line-clamp-2">"{outlier.sommelier_notes}"</p>
              )}

              {/* Action buttons */}
              {!isLinking && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openLink(outlier.id)}
                    disabled={!!busy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg disabled:opacity-50"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Link to existing
                  </button>
                  <button
                    onClick={() => act(outlier.id, 'promote')}
                    disabled={!!busy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg disabled:opacity-50"
                  >
                    {busy === 'promote'
                      ? <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      : <CheckCircle className="w-3.5 h-3.5" />}
                    Promote to catalog
                  </button>
                  <button
                    onClick={() => act(outlier.id, 'reject')}
                    disabled={!!busy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg disabled:opacity-50"
                  >
                    {busy === 'reject'
                      ? <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      : <XCircle className="w-3.5 h-3.5" />}
                    Reject
                  </button>
                </div>
              )}
            </div>

            {/* Inline link search */}
            {isLinking && (
              <div className="border-t border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Search the catalog to link this wine to:</p>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    value={linkSearch}
                    onChange={e => handleLinkSearchChange(e.target.value)}
                    placeholder="Search by name or producer..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {isLinkSearching && (
                    <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {linkResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                    {linkResults.map(w => (
                      <button
                        key={w.id}
                        onClick={() => act(outlier.id, 'link', { catalogId: w.id })}
                        disabled={!!busy}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 disabled:opacity-50"
                      >
                        <div className="font-medium text-gray-900 text-sm">{w.wine_name}</div>
                        <div className="text-xs text-gray-500">
                          {[w.producer, w.vintage, w.wine_type].filter(Boolean).join(' · ')}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {linkSearch.length >= 2 && !isLinkSearching && linkResults.length === 0 && (
                  <p className="text-sm text-gray-500 mb-3">No catalog wines found for "{linkSearch}".</p>
                )}

                <button onClick={cancelLink} className="text-sm text-gray-500 hover:text-gray-700">
                  Cancel
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CuratorQueue;
