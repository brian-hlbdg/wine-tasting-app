import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Wine, Mail } from "lucide-react";

const EnhancedJoinEventForm = ({ onEventJoined, boothCode = null }) => {
  const [joinMode, setJoinMode] = useState(boothCode ? "booth" : "standard");
  const [eventCode, setEventCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentEvent, setCurrentEvent] = useState(null);
  const [boothCustomization, setBoothCustomization] = useState(null);

  // Check for booth mode on component mount
  useEffect(() => {
    if (boothCode) {
      handleBoothModeAccess();
    }
  }, [boothCode]);

  // Handle booth mode access via URL parameter
  const handleBoothModeAccess = async () => {
    if (!boothCode) return;

    setLoading(true);
    try {
      // Find event by booth code (same as event_code for booth mode)
      const { data: event, error } = await supabase
        .from("tasting_events")
        .select("*")
        .eq("event_code", boothCode.toUpperCase())
        .eq("is_booth_mode", true)
        .single();

      if (error || !event) {
        setError("Invalid booth code. Please check with your event organizer.");
        setJoinMode("standard");
        return;
      }

      setCurrentEvent(event);
      setBoothCustomization(event.booth_customization);
      setJoinMode("booth");
    } catch (error) {
      console.error("Error loading booth event:", error);
      setError("Unable to load event. Please try again.");
      setJoinMode("standard");
    } finally {
      setLoading(false);
    }
  };

  // Handle standard event code join
  const handleStandardJoin = async () => {
    if (!eventCode.trim()) {
      setError("Please enter an event code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Find event by code
      const { data: event, error } = await supabase
        .from("tasting_events")
        .select(
          `
          *,
          event_wines (*),
          event_locations (*)
        `
        )
        .eq("event_code", eventCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !event) {
        setError("Invalid event code. Please check with your event organizer.");
        return;
      }

      // If this is actually a booth mode event, redirect to booth mode
      if (event.is_booth_mode) {
        setCurrentEvent(event);
        setBoothCustomization(event.booth_customization);
        setJoinMode("booth");
        setError("");
        return;
      }

      // Standard event join - would typically require user authentication here
      // For now, just pass the event to parent
      onEventJoined(event);
    } catch (error) {
      console.error("Error joining event:", error);
      setError("Unable to join event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle booth mode email submission
  const handleBoothJoin = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // In a real implementation, you might:
      // 1. Create/update user profile with email
      // 2. Create session for this user
      // 3. Load user's existing ratings if any

      // For now, add email to event data and proceed
      const eventWithUser = {
        ...currentEvent,
        userEmail: email,
      };

      onEventJoined(eventWithUser);
    } catch (error) {
      console.error("Error joining booth event:", error);
      setError("Unable to join event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render booth mode interface
  const renderBoothMode = () => {
    const customization = boothCustomization || {
      icon: "🍷",
      title: "Welcome to our Wine Tasting!",
      subtitle: "Enter your email to start rating wines",
      buttonText: "Start Tasting",
      backgroundColor: "#047857",
      textColor: "#ffffff",
    };

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: customization.backgroundColor }}
      >
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            {/* Display Custom Logo or Icon */}
            {customization.useCustomLogo && customization.logoUrl ? (
              <div className="mb-6">
                <img
                  src={customization.logoUrl}
                  alt="Event logo"
                  className="w-20 h-20 mx-auto object-contain bg-white/10 rounded-xl p-3"
                />
              </div>
            ) : (
              <div className="text-7xl mb-6">{customization.icon}</div>
            )}

            <h1 className="text-3xl font-bold text-white mb-2">
              {customization.title}
            </h1>
            <p className="text-white/80">{customization.subtitle}</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-white text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleBoothJoin}
              disabled={loading}
              className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white py-4 px-6 rounded-lg font-semibold hover:bg-white/30 transition-all disabled:opacity-50"
              style={{ color: customization.textColor }}
            >
              {loading ? "Joining..." : `${customization.buttonText} →`}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-white/70">
            <p>Your ratings and notes will be saved to your email address</p>
          </div>

          {/* Option to enter event code instead */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setJoinMode("standard")}
              className="text-white/60 hover:text-white/80 text-sm underline"
            >
              Have an event code instead?
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render standard mode interface
  const renderStandardMode = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <Wine className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Join Wine Tasting
          </h1>
          <p className="text-green-200">Enter the event code to get started</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Event Code
            </label>
            <input
              type="text"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              placeholder="e.g., WINE2025"
              className="w-full px-4 py-3 text-center text-lg font-mono bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-white text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleStandardJoin}
            disabled={loading || !eventCode.trim()}
            className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white py-4 px-6 rounded-lg font-semibold hover:bg-white/30 transition-all disabled:opacity-50"
          >
            {loading ? "Joining..." : "Join Event"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-green-200">
          <p>Don't have an event code?</p>
          <p>Contact your event organizer</p>
        </div>
      </div>
    </div>
  );

  // Main render logic
  if (joinMode === "booth") {
    return renderBoothMode();
  }

  return renderStandardMode();
};

export default EnhancedJoinEventForm;
