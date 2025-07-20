import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BarChart3, Users, Wine, TrendingUp, Star } from 'lucide-react';

const AdminAnalytics = ({ event }) => {
  const [analytics, setAnalytics] = useState({
    totalRatings: 0,
    averageRating: 0,
    totalParticipants: 0,
    wineRatings: [],
    topDescriptors: [],
    ratingDistribution: [0, 0, 0, 0, 0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (event) {
      loadAnalytics();
    }
  }, [event]);

  const loadAnalytics = async () => {
    try {
      // Get all ratings for this event's wines
      const { data: wineIds } = await supabase
        .from('event_wines')
        .select('id')
        .eq('event_id', event.id);

      if (!wineIds || wineIds.length === 0) {
        setLoading(false);
        return;
      }

      const wineIdList = wineIds.map(w => w.id);

      // Get all ratings for these wines
      const { data: ratings, error: ratingsError } = await supabase
        .from('user_wine_ratings')
        .select(`
          *,
          event_wines (wine_name, producer),
          user_wine_descriptors (
            descriptors (name, category)
          )
        `)
        .in('event_wine_id', wineIdList);

      if (ratingsError) {
        console.error('Error loading ratings:', ratingsError);
        setLoading(false);
        return;
      }

      // Calculate analytics
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0 
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
        : 0;

      // Unique participants
      const uniqueUsers = new Set(ratings.map(r => r.user_id));
      const totalParticipants = uniqueUsers.size;

      // Wine-specific ratings
      const wineRatings = {};
      ratings.forEach(rating => {
        const wineKey = rating.event_wines?.wine_name || 'Unknown Wine';
        if (!wineRatings[wineKey]) {
          wineRatings[wineKey] = {
            name: wineKey,
            producer: rating.event_wines?.producer,
            ratings: [],
            average: 0,
            count: 0
          };
        }
        wineRatings[wineKey].ratings.push(rating.rating);
        wineRatings[wineKey].count++;
      });

      // Calculate averages for each wine
      Object.values(wineRatings).forEach(wine => {
        wine.average = (wine.ratings.reduce((sum, r) => sum + r, 0) / wine.count).toFixed(1);
      });

      // Top descriptors
      const descriptorCounts = {};
      ratings.forEach(rating => {
        rating.user_wine_descriptors?.forEach(desc => {
          const name = desc.descriptors?.name;
          if (name) {
            descriptorCounts[name] = (descriptorCounts[name] || 0) + 1;
          }
        });
      });

      const topDescriptors = Object.entries(descriptorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      // Rating distribution
      const distribution = [0, 0, 0, 0, 0];
      ratings.forEach(rating => {
        if (rating.rating >= 1 && rating.rating <= 5) {
          distribution[rating.rating - 1]++;
        }
      });

      setAnalytics({
        totalRatings,
        averageRating,
        totalParticipants,
        wineRatings: Object.values(wineRatings),
        topDescriptors,
        ratingDistribution: distribution
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading analytics...</div>;
  }

  if (analytics.totalRatings === 0) {
    return (
      <div className="p-6 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Ratings Yet</h3>
        <p className="text-gray-500">Ratings will appear here once users start tasting wines.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-xl font-bold">Event Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-600">Avg Rating</span>
          </div>
          <div className="text-2xl font-bold">{analytics.averageRating}/5</div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Total Ratings</span>
          </div>
          <div className="text-2xl font-bold">{analytics.totalRatings}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Participants</span>
          </div>
          <div className="text-2xl font-bold">{analytics.totalParticipants}</div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Wine className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Wines Rated</span>
          </div>
          <div className="text-2xl font-bold">{analytics.wineRatings.length}</div>
        </div>
      </div>

      {/* Wine Rankings */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold mb-4">Wine Rankings</h3>
        <div className="space-y-3">
          {analytics.wineRatings
            .sort((a, b) => parseFloat(b.average) - parseFloat(a.average))
            .map((wine, index) => (
              <div key={wine.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-medium">{wine.name}</div>
                    {wine.producer && <div className="text-sm text-gray-600">{wine.producer}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{wine.average}/5</div>
                  <div className="text-sm text-gray-600">{wine.count} ratings</div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Top Descriptors */}
      {analytics.topDescriptors.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">Most Common Descriptors</h3>
          <div className="grid grid-cols-2 gap-3">
            {analytics.topDescriptors.map(desc => (
              <div key={desc.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{desc.name}</span>
                <span className="text-sm text-gray-600">{desc.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold mb-4">Rating Distribution</h3>
        <div className="space-y-2">
          {analytics.ratingDistribution.map((count, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="w-12 text-sm">{index + 1} star{index !== 0 ? 's' : ''}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-purple-600 h-4 rounded-full transition-all duration-300"
                  style={{ 
                    width: analytics.totalRatings > 0 
                      ? `${(count / analytics.totalRatings) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
              <span className="w-8 text-sm text-gray-600">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;