import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { ArrowLeft, Wine, MapPin, User, Star, Award } from "lucide-react";
import WineDetailsInterface from "./WineDetailsInterface";
import UserProfile from "./UserProfile";
import BoothThankYouModal from "./BoothThankYouModal"; // Import the modal we created
import EventDescriptionModal from "./EventDescriptionModal"; // Import event description modal

const UserInterface = ({ event, onRateWine, onBackToJoin }) => {
  const [currentView, setCurrentView] = useState("join");
  const [selectedWine, setSelectedWine] = useState(null);
  const [winesByLocation, setWinesByLocation] = useState([]);
  const [unassignedWines, setUnassignedWines] = useState([]);
  const [userRatings, setUserRatings] = useState(new Map()); // Track user's ratings
  const [userSession, setUserSession] = useState(null); // Current user session
  const [showThankYouModal, setShowThankYouModal] = useState(false); // Modal state
  const [showEventDescModal, setShowEventDescModal] = useState(false); // Event description modal

  useEffect(() => {
    if (event) {
      // Get user session from localStorage or event data
      const session = getUserSession();
      setUserSession(session);

      setCurrentView("event");
      organizeWinesByLocation();

      // Load user's existing ratings if any
      if (session) {
        loadUserRatings(session.userId);
      }
    }
  }, [event]);

  // Get user session from localStorage or event data
  const getUserSession = () => {
    try {
      // First check localStorage for existing session
      const storedSession = localStorage.getItem("wineAppSession");
      if (storedSession) {
        return JSON.parse(storedSession);
      }

      // Fallback to event data for booth mode
      if (event?.userEmail) {
        return {
          userId: null, // Will be set when we create/find profile
          email: event.userEmail,
          isBoothMode: event.is_booth_mode,
          eventId: event.id,
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting user session:", error);
      return null;
    }
  };

  // Load user's existing ratings
  const loadUserRatings = async (userId) => {
    if (!userId) return;

    try {
      const { data: ratings, error } = await supabase
        .from("user_wine_ratings")
        .select("event_wine_id, rating, personal_notes")
        .eq("user_id", userId);

      if (error) {
        console.error("Error loading user ratings:", error);
        return;
      }

      const ratingsMap = new Map();
      ratings.forEach((rating) => {
        ratingsMap.set(rating.event_wine_id, {
          rating: rating.rating,
          notes: rating.personal_notes,
        });
      });

      setUserRatings(ratingsMap);
    } catch (error) {
      console.error("Error loading user ratings:", error);
    }
  };

  // Handle when a rating is saved
  const handleRatingSaved = async (wineId, ratingData) => {
    // Update local ratings map
    setUserRatings((prev) => new Map(prev.set(wineId, ratingData)));

    // Check if all wines have been rated
    checkIfAllWinesRated();
  };

  // Check if user has rated all wines
  const checkIfAllWinesRated = () => {
    const totalWines = getAllWines().length;
    const ratedWines = userRatings.size;

    // If all wines are rated, show thank you modal
    if (totalWines > 0 && ratedWines >= totalWines) {
      setShowThankYouModal(true);
    }
  };

  // Get all wines in the event
  const getAllWines = () => {
    const allWines = [];
    winesByLocation.forEach((location) => {
      allWines.push(...location.wines);
    });
    allWines.push(...unassignedWines);
    return allWines;
  };

  // Close thank you modal
  const handleCloseThankYouModal = () => {
    setShowThankYouModal(false);
  };

  // Close event description modal
  const handleCloseEventDescModal = () => {
    setShowEventDescModal(false);
  };

  const organizeWinesByLocation = () => {
    console.log("organizeWinesByLocation called with event:", event);
    console.log("Event wines:", event?.event_wines);
    console.log("Event locations:", event?.event_locations);

    if (!event?.event_wines) {
      console.log("No event wines found, setting empty arrays");
      setWinesByLocation([]);
      setUnassignedWines([]);
      return;
    }

    const locationMap = new Map();
    const unassigned = [];

    // Group wines by location - handle both location_id and location_name patterns
    event.event_wines.forEach((wine) => {
      let assignedLocation = null;

      // Try location_id first (if using normalized location structure)
      if (wine.location_id && event.event_locations) {
        assignedLocation = event.event_locations.find(
          (loc) => loc.id === wine.location_id
        );
      }

      // Fallback to location_name (if using denormalized structure)
      if (!assignedLocation && wine.location_name && event.event_locations) {
        assignedLocation = event.event_locations.find(
          (loc) => loc.location_name === wine.location_name
        );
      }

      // If we found a location, group the wine there
      if (assignedLocation) {
        const locationKey =
          assignedLocation.id || assignedLocation.location_name;
        if (!locationMap.has(locationKey)) {
          locationMap.set(locationKey, {
            ...assignedLocation,
            wines: [],
            locationOrder: assignedLocation.location_order || 0,
          });
        }
        locationMap.get(locationKey).wines.push(wine);
      } else {
        // No location found, add to unassigned
        unassigned.push(wine);
      }
    });

    // Convert to array and sort wines within each location
    const locations = Array.from(locationMap.values()).map((location) => {
      return {
        ...location,
        wines: location.wines.sort(
          (a, b) =>
            (a.location_order || a.tasting_order || 0) -
            (b.location_order || b.tasting_order || 0)
        ),
      };
    });

    // Sort locations by order
    locations.sort((a, b) => a.locationOrder - b.locationOrder);

    console.log("Organized locations:", locations);
    console.log("Unassigned wines:", unassigned);

    setWinesByLocation(locations);
    setUnassignedWines(unassigned);
  };

  const handleWineClick = (wine) => {
    setSelectedWine(wine);
    setCurrentView("wineDetails");
  };

  const handleBackFromWineDetails = () => {
    setSelectedWine(null);
    setCurrentView("event");
  };

  // Join Event Screen
  const JoinEventScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <Wine className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Join Wine Tasting
          </h1>
          <p className="text-green-200">Enter the event code to get started</p>
        </div>
      </div>
    </div>
  );

  // Event Wines Screen
  const EventWinesScreen = () => (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        {/* Line 1: Event Title (left) + User Icon (right) */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-gray-900 truncate pr-2">
            {event?.event_name}
          </h1>

          <button
            onClick={() => setCurrentView("profile")}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <User size={16} className="text-gray-700" />
          </button>
        </div>

        {/* Line 3: Description (left) + Leave Event (right) */}
        <div className="flex items-start justify-between">
          {/* Event Description - Truncated with Read More */}
          <div className="flex-1 pr-2">
            {event?.description && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-600 leading-relaxed">
                  {event.description.substring(0, 45)}
                  {event.description.length > 45 ? "..." : ""}
                </span>
                {event.description.length > 45 && (
                  <button
                    onClick={() => setShowEventDescModal(true)}
                    className="text-purple-600 hover:text-purple-800 font-medium underline flex-shrink-0"
                  >
                    Read more
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onBackToJoin}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors text-sm flex-shrink-0"
          >
            <ArrowLeft size={14} />
            <span>Leave Event</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6">
        {/* Wine Count Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 text-center">
            Our Wines to Taste ({getAllWines().length})
          </h2>
        </div>

        {/* Wines by Location */}
        <div className="space-y-6">
          {winesByLocation.map((location) => (
            <div key={location.id || location.location_name}>
              {/* Location Header */}
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-gray-600" />
                <h3 className="font-semibold text-gray-900">
                  {location.location_name}
                </h3>
                {location.location_address && (
                  <span className="text-sm text-gray-500">
                    • {location.location_address}
                  </span>
                )}
              </div>

              {/* Wine Cards */}
              <div className="space-y-4 mb-6">
                {location.wines.map((wine) => {
                  const userRating = userRatings.get(wine.id);
                  return (
                    <div
                      key={wine.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Wine Header */}
                      <div
                        onClick={() => handleWineClick(wine)}
                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-semibold text-sm">
                          {wine.tasting_order || wine.location_order || 1}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {wine.wine_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {wine.producer}
                            {wine.vintage && ` • ${wine.vintage}`}
                            {wine.wine_type && ` • ${wine.wine_type}`}
                          </p>
                        </div>

                        <div className="text-right">
                          {userRating ? (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={
                                    i < userRating.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600">
                              <Wine size={20} />
                              <span className="text-sm">Tap to rate</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sommelier Notes */}
                      {wine.sommelier_notes && (
                        <div className="px-4 pb-4">
                          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r">
                            <p className="text-sm text-amber-800">
                              <span className="font-semibold">Notes:</span>{" "}
                              {wine.sommelier_notes}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* User's Personal Notes */}
                      {userRating?.notes && (
                        <div className="px-4 pb-4">
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
                            <p className="text-sm text-blue-800">
                              <span className="font-semibold">Your notes:</span>{" "}
                              {userRating.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Unassigned Wines */}
          {unassignedWines.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wine size={18} className="text-purple-600" />
                <h3 className="font-semibold text-gray-900">Featured Wines</h3>
              </div>

              <div className="space-y-4">
                {unassignedWines.map((wine) => {
                  const userRating = userRatings.get(wine.id);
                  return (
                    <div
                      key={wine.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Wine Header */}
                      <div
                        onClick={() => handleWineClick(wine)}
                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-semibold text-sm">
                          {wine.tasting_order || wine.location_order || 1}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {wine.wine_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {wine.producer}
                            {wine.vintage && ` • ${wine.vintage}`}
                            {wine.wine_type && ` • ${wine.wine_type}`}
                          </p>
                        </div>

                        <div className="text-right">
                          {userRating ? (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={
                                    i < userRating.rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600">
                              <Wine size={20} />
                              <span className="text-sm">Tap to rate</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sommelier Notes */}
                      {wine.sommelier_notes && (
                        <div className="px-4 pb-4">
                          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r">
                            <p className="text-sm text-amber-800">
                              <span className="font-semibold">Notes:</span>{" "}
                              {wine.sommelier_notes}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* User's Personal Notes */}
                      {userRating?.notes && (
                        <div className="px-4 pb-4">
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
                            <p className="text-sm text-blue-800">
                              <span className="font-semibold">Your notes:</span>{" "}
                              {userRating.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Progress Indicator at Bottom for Booth Mode */}
        {userSession?.isBoothMode && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Rating Progress
                </span>
                <span className="text-sm text-gray-500">
                  {userRatings.size} of {getAllWines().length} wines rated
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      getAllWines().length > 0
                        ? (userRatings.size / getAllWines().length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              {userRatings.size === getAllWines().length &&
                getAllWines().length > 0 && (
                  <div className="mt-2 text-center">
                    <span className="text-sm text-green-600 font-medium">
                      All wines rated! 🎉
                    </span>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Event Description Modal */}
      <EventDescriptionModal
        isOpen={showEventDescModal}
        event={event}
        onClose={handleCloseEventDescModal}
      />

      {/* Thank You Modal - Only show if all wines rated and modal hasn't been dismissed */}
      <BoothThankYouModal
        isOpen={showThankYouModal}
        boothCustomization={event?.booth_customization}
        userEmail={userSession?.email}
        totalWinesRated={userRatings.size}
        onClose={handleCloseThankYouModal}
      />
    </div>
  );

  // Profile Screen
  const ProfileScreen = () => (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView("event")}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Wine Profile</h1>
        </div>
      </div>
      <UserProfile />
    </div>
  );

  // Wine Details Screen
  const WineDetailsScreen = () => (
    <WineDetailsInterface
      wine={selectedWine}
      userSession={userSession}
      currentRating={userRatings.get(selectedWine?.id)}
      onBack={handleBackFromWineDetails}
      onRatingSaved={(ratingData) => {
        handleRatingSaved(selectedWine.id, ratingData);
        handleBackFromWineDetails();
      }}
    />
  );

  // Main render
  if (currentView === "join") {
    return <JoinEventScreen />;
  }

  if (currentView === "event") {
    return <EventWinesScreen />;
  }

  if (currentView === "profile") {
    return <ProfileScreen />;
  }

  if (currentView === "wineDetails") {
    return <WineDetailsScreen />;
  }

  return <JoinEventScreen />;
};

export default UserInterface;
