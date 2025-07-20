import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { User, Wine, TrendingUp, Heart } from 'lucide-react';

const UserProfile = ({ userId }) => {
  const [profile, setProfile] = useState({
    totalRatings: 0,
    averageRating: 0,
    favoriteWineTypes: [],
    favoriteDescriptors: [],
    recentRatings: [],
    recommendedWines: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    } else {
      loadDemoUserProfile();
    }
  }, [userId]);

  const loadDemoUserProfile = async () => {
    try {
      console.log('No user ID provided, looking for recent ratings...');
      
      // Get the most recent rating to find a user ID
      const { data: recentRatings } = await supabase
        .from('user_wine_ratings')
        .select('user_id')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (recentRatings && recentRatings.length > 0) {
        const foundUserId = recentRatings[0].user_id;
        console.log('Found recent user ID:', foundUserId);
        // Now load profile for this user
        loadUserProfileForId(foundUserId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error finding demo user:', error);
      setLoading(false);
    }
  };

  const loadUserProfileForId = async (targetUserId) => {
    // Your existing loadUserProfile logic, but use targetUserId instead of userId
    try {
      console.log('Loading profile for user ID:', targetUserId);
      
      const { data: ratings, error } = await supabase
        .from('user_wine_ratings')
        .select(`
          *,
          event_wines (
            wine_name,
            producer,
            wine_type,
            region
          ),
          user_wine_descriptors (
            descriptors (name, category)
          )
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      console.log('User ratings found:', ratings);

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (!ratings || ratings.length === 0) {
        setLoading(false);
        return;
      }

      // ... rest of your existing profile calculation logic ...
      
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      console.log('Loading profile for user ID:', userId);
      
      // First, let's see what user IDs exist in the ratings table
      const { data: allRatings } = await supabase
      .from('user_wine_ratings')
      .select('user_id, rating, event_wines(wine_name)')
      .limit(1);
      
      console.log('All ratings in database:', allRatings);
    // Get all user ratings
      const { data: ratings, error } = await supabase
        .from('user_wine_ratings')
        .select(`
          *,
          event_wines (
            wine_name,
            producer,
            wine_type,
            region
          ),
          user_wine_descriptors (
            descriptors (name, category)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('User ratings found:', ratings);
      console.log('Error if any:', error);

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      if (!ratings || ratings.length === 0) {
        console.log('No ratings found for user:', userId);
        setLoading(false);
        return;
      }

      // Calculate profile stats
      const totalRatings = ratings.length;
      const averageRating = (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1);

      // Favorite wine types
      const wineTypeCounts = {};
      ratings.forEach(rating => {
        const type = rating.event_wines?.wine_type;
        if (type) {
          wineTypeCounts[type] = (wineTypeCounts[type] || 0) + 1;
        }
      });

      const favoriteWineTypes = Object.entries(wineTypeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => ({ type, count }));

      // Favorite descriptors
      const descriptorCounts = {};
      ratings.forEach(rating => {
        rating.user_wine_descriptors?.forEach(desc => {
          const name = desc.descriptors?.name;
          if (name) {
            descriptorCounts[name] = (descriptorCounts[name] || 0) + 1;
          }
        });
      });

      const favoriteDescriptors = Object.entries(descriptorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }));

      // Recent high-rated wines
      const recentRatings = ratings
        .filter(r => r.rating >= 4)
        .slice(0, 5)
        .map(rating => ({
          wine: rating.event_wines?.wine_name,
          producer: rating.event_wines?.producer,
          rating: rating.rating,
          notes: rating.personal_notes
        }));

      setProfile({
        totalRatings,
        averageRating,
        favoriteWineTypes,
        favoriteDescriptors,
        recentRatings,
        recommendedWines: []
      });

    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading your wine profile...</div>;
  }

  if (profile.totalRatings === 0) {
    return (
      <div className="p-6 text-center">
        <Wine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Tastings Yet</h3>
        <p className="text-gray-500">Start rating wines to build your taste profile!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold">Your Wine Profile</h2>
        <p className="text-gray-600">Based on {profile.totalRatings} tastings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-purple-600">{profile.averageRating}/5</div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-purple-600">{profile.totalRatings}</div>
          <div className="text-sm text-gray-600">Wines Tasted</div>
        </div>
      </div>

      {/* Favorite Wine Types */}
      {profile.favoriteWineTypes.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Wine className="w-5 h-5 text-purple-600" />
            Your Favorite Wine Types
          </h3>
          <div className="space-y-3">
            {profile.favoriteWineTypes.map(item => (
              <div key={item.type} className="flex justify-between items-center">
                <span className="capitalize font-medium">{item.type}</span>
                <span className="text-sm text-gray-600">{item.count} tastings</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Descriptors */}
      {profile.favoriteDescriptors.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Your Flavor Profile
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.favoriteDescriptors.map(desc => (
              <span 
                key={desc.name}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
              >
                {desc.name} ({desc.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Favorites */}
      {profile.recentRatings.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Recent Favorites (4+ stars)
          </h3>
          <div className="space-y-3">
            {profile.recentRatings.map((rating, index) => (
              <div key={index} className="border-l-4 border-purple-200 pl-4 py-2">
                <div className="font-medium">{rating.wine}</div>
                {rating.producer && (
                  <div className="text-sm text-gray-600">{rating.producer}</div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-sm ${i < rating.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  {rating.notes && (
                    <span className="text-xs text-gray-500 italic">"{rating.notes}"</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Placeholder */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border">
        <h3 className="font-semibold mb-2">Recommended for You</h3>
        <p className="text-gray-600 text-sm">
          Based on your taste profile, you might enjoy Pinot Noir from Oregon or Grenache blends from the Rhône Valley.
        </p>
      </div>
    </div>
  );
};

export default UserProfile;