import React, { useState, useEffect } from "react";
import {
  Wine,
  Calendar,
  MapPin,
  BarChart3,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Clock,
  Users,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import AdminAnalytics from "./AdminAnalytics";
import EnhancedCreateEventForm from "./EnhancedCreateEventForm";

const AdminDashboardRedesign = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("events");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventForAnalytics, setSelectedEventForAnalytics] =
    useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile?.is_admin) {
        setUser(profile);
      }
    }
    setLoading(false);
  };

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("tasting_events")
      .select(
        `
        *,
        event_wines (*),
        event_locations (*)
      `
      )
      .order("event_date", { ascending: false });

    if (error) {
      console.error("Error loading events:", error);
    } else {
      setEvents(data || []);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    if (onLogout) {
      onLogout();
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    const { error } = await supabase
      .from("tasting_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      alert("Error deleting event: " + error.message);
    } else {
      alert("Event deleted successfully");
      loadEvents();
    }
  };

  const startEditingEvent = (event) => {
    setEditingEvent(event);
    setCurrentView("edit-event");
  };

  const startCreatingEvent = () => {
    setEditingEvent(null);
    setCurrentView("create-event");
  };

  const handleEventUpdated = () => {
    setEditingEvent(null);
    setCurrentView("events");
    loadEvents();
  };

  const getBoothUrl = (event) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?boothCode=${event.event_code}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Copied to clipboard!");
    }
  };

  const exportEventActivity = async (eventId) => {
    try {
      // Get event wines
      const { data: wines } = await supabase
        .from("event_wines")
        .select("*")
        .eq("event_id", eventId);

      if (!wines || wines.length === 0) {
        alert("No wines found for this event");
        return;
      }

      const wineIds = wines.map((w) => w.id);

      // Get all ratings for these wines
      const { data: ratings } = await supabase
        .from("user_ratings")
        .select(
          `
          *,
          profiles (display_name, eventbrite_email)
        `
        )
        .in("event_wine_id", wineIds);

      // Create CSV content
      let csvContent = "Wine,Producer,Vintage,User,Email,Rating,Notes,Date\n";

      ratings?.forEach((rating) => {
        const wine = wines.find((w) => w.id === rating.event_wine_id);
        const row = [
          wine?.wine_name || "",
          wine?.producer || "",
          wine?.vintage || "",
          rating.profiles?.display_name || "",
          rating.profiles?.eventbrite_email || "",
          rating.rating || "",
          `"${(rating.personal_notes || "").replace(/"/g, '""')}"`,
          new Date(rating.created_at).toLocaleString(),
        ].join(",");
        csvContent += row + "\n";
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `event-${eventId}-activity.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting activity:", error);
      alert("Error exporting activity: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <Wine className="w-12 h-12 text-amber-700 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show different views
  if (currentView === "create-event" || currentView === "edit-event") {
    return (
      <EnhancedCreateEventForm
        user={user}
        onBack={() => setCurrentView("events")}
        onEventCreated={handleEventUpdated}
        editingEvent={editingEvent}
      />
    );
  }

  if (currentView === "analytics" && selectedEventForAnalytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                setCurrentView("events");
                setSelectedEventForAnalytics(null);
              }}
              className="text-gray-700 hover:text-amber-700 font-medium"
            >
              ← Back to Events
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              Analytics: {selectedEventForAnalytics.event_name}
            </h2>
          </div>
          <AdminAnalytics event={selectedEventForAnalytics} />
        </div>
      </div>
    );
  }

  // Events List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-amber-700 p-2 rounded-lg shadow-sm">
                <Wine className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  Wine Admin
                </h1>
                <p className="text-xs sm:text-sm text-amber-700 hidden sm:block">
                  Welcome back, {user?.display_name || "Admin User"}
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              <button className="bg-amber-700 hover:bg-amber-800 text-white px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Events
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-gray-700 hover:text-amber-700 px-3 lg:px-4 py-2 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-2 space-y-2 border-t border-amber-200/50 pt-4">
              <button className="w-full bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Events
              </button>
              <button
                onClick={signOut}
                className="w-full text-gray-700 hover:bg-amber-50 px-4 py-2 rounded-lg text-sm"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Your Events ({events.length})
          </h2>
          <button
            onClick={startCreatingEvent}
            className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-3 rounded-lg font-semibold shadow-sm flex items-center justify-center gap-2 transition-all hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>

        {/* Empty State */}
        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-12 text-center">
            <Wine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No events yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first wine tasting event to get started
            </p>
            <button
              onClick={startCreatingEvent}
              className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>
        ) : (
          /* Events Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm border border-amber-100 hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 truncate">
                        {event.event_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>
                            {event.event_date
                              ? new Date(event.event_date).toLocaleDateString()
                              : "No date"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 sm:px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                        {event.event_code}
                      </span>
                      <span
                        className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${
                          event.is_booth_mode
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {event.is_booth_mode ? "Booth" : "Standard"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Booth URL Section - Only for booth mode */}
                  {event.is_booth_mode && (
                    <div className="bg-green-50/50 rounded-lg p-3 sm:p-4 border border-green-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-green-800">
                          Booth URL
                        </span>
                        <div className="flex gap-1 sm:gap-2">
                          <button
                            onClick={() =>
                              window.open(getBoothUrl(event), "_blank")
                            }
                            className="text-green-600 hover:text-green-800 p-1 hover:bg-green-100/50 rounded transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(getBoothUrl(event))}
                            className="text-green-600 hover:text-green-800 px-2 py-1 hover:bg-green-100/50 rounded text-xs font-medium transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="bg-white rounded px-2 sm:px-3 py-1.5 sm:py-2 border border-green-200/50">
                        <code className="text-xs text-gray-700 break-all">
                          {getBoothUrl(event)}
                        </code>
                      </div>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-amber-50/30 rounded-lg p-3 border border-amber-100/50">
                      <div className="flex items-center gap-2 text-amber-700 mb-1">
                        <Wine className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">
                          Wines
                        </span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">
                        {event.event_wines?.length || 0}
                      </div>
                    </div>
                    <div className="bg-orange-50/30 rounded-lg p-3 border border-orange-100/50">
                      <div className="flex items-center gap-2 text-orange-700 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">
                          Locations
                        </span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-gray-900">
                        {event.event_locations?.length || 0}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-2">
                    <button
                      onClick={() => {
                        setSelectedEventForAnalytics(event);
                        setCurrentView("analytics");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white py-2.5 rounded-lg font-medium transition-colors text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </button>
                    <button
                      onClick={() => startEditingEvent(event)}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>

                  {/* Export Activity */}
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      onClick={() => exportEventActivity(event.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                        />
                      </svg>
                      Export Activity
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Export ratings, comments, and wine details
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardRedesign;
