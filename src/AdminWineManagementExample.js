import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { ExistingEventWineForm } from './WineForms';

const AdminWineManagementExample = ({ eventId, eventName, onBack }) => {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddWineForm, setShowAddWineForm] = useState(false);
  const [editingWine, setEditingWine] = useState(null);

  // Load wines for this event
  useEffect(() => {
    loadWines();
  }, [eventId]);

  const loadWines = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('./supabaseClient');
      
      const { data, error } = await supabase
        .from('event_wines')
        .select('*')
        .eq('event_id', eventId)
        .order('tasting_order', { ascending: true });

      if (error) throw error;
      setWines(data || []);
    } catch (error) {
      console.error('Error loading wines:', error);
      alert('Error loading wines: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWineAdded = () => {
    // Refresh the wine list after adding/editing
    loadWines();
    setShowAddWineForm(false);
    setEditingWine(null);
  };

  const handleEditWine = (wine) => {
    setEditingWine(wine);
    setShowAddWineForm(true);
  };

  const handleDeleteWine = async (wineId, wineName) => {
    if (!window.confirm(`Are you sure you want to delete "${wineName}"?`)) {
      return;
    }

    try {
      const { supabase } = await import('./supabaseClient');
      
      const { error } = await supabase
        .from('event_wines')
        .delete()
        .eq('id', wineId);

      if (error) throw error;
      
      alert('Wine deleted successfully');
      loadWines(); // Refresh the list
    } catch (error) {
      console.error('Error deleting wine:', error);
      alert('Error deleting wine: ' + error.message);
    }
  };

  const updateTastingOrder = async (wineId, newOrder) => {
    try {
      const { supabase } = await import('./supabaseClient');
      
      const { error } = await supabase
        .from('event_wines')
        .update({ tasting_order: newOrder })
        .eq('id', wineId);

      if (error) throw error;
      
      loadWines(); // Refresh to show updated order
    } catch (error) {
      console.error('Error updating tasting order:', error);
      alert('Error updating order: ' + error.message);
    }
  };

  // Show wine form (either add new or edit existing)
  if (showAddWineForm) {
    return (
      <ExistingEventWineForm
        eventId={eventId}
        eventName={eventName}
        onWineAdded={handleWineAdded}
        onCancel={() => {
          setShowAddWineForm(false);
          setEditingWine(null);
        }}
        initialWine={editingWine}
        isEditing={!!editingWine}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading wines...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Manage Event Wines</h1>
              <p className="text-gray-600">{eventName}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAddWineForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Wine
        </button>
      </div>

      {/* Wine List */}
      {wines.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No wines added to this event yet</div>
          <button
            onClick={() => setShowAddWineForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            Add First Wine
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {wines.map((wine, index) => (
            <div key={wine.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Wine Info */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        #{wine.tasting_order}
                      </span>
                      <h3 className="text-xl font-bold">{wine.wine_name}</h3>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      wine.wine_type === 'red' ? 'bg-red-100 text-red-700' :
                      wine.wine_type === 'white' ? 'bg-yellow-100 text-yellow-700' :
                      wine.wine_type === 'rosé' ? 'bg-pink-100 text-pink-700' :
                      wine.wine_type === 'sparkling' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {wine.wine_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Producer:</span> {wine.producer || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Vintage:</span> {wine.vintage || 'NV'}
                    </div>
                    <div>
                      <span className="font-medium">Region:</span> {wine.region || 'Not specified'}
                    </div>
                  </div>

                  {wine.sommelier_notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <span className="font-medium text-sm">Notes:</span>
                      <p className="text-sm text-gray-700 mt-1">{wine.sommelier_notes}</p>
                    </div>
                  )}

                  {wine.location_name && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        📍 {wine.location_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {/* Tasting Order Controls */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => updateTastingOrder(wine.id, wine.tasting_order - 1)}
                      disabled={index === 0}
                      className="p-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => updateTastingOrder(wine.id, wine.tasting_order + 1)}
                      disabled={index === wines.length - 1}
                      className="p-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditWine(wine)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit wine"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteWine(wine.id, wine.wine_name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete wine"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {wines.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Event Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Wines:</span> {wines.length}
            </div>
            <div>
              <span className="font-medium">Red Wines:</span> {wines.filter(w => w.wine_type === 'red').length}
            </div>
            <div>
              <span className="font-medium">White Wines:</span> {wines.filter(w => w.wine_type === 'white').length}
            </div>
            <div>
              <span className="font-medium">Other:</span> {wines.filter(w => !['red', 'white'].includes(w.wine_type)).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWineManagementExample;