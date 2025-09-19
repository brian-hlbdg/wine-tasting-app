import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Wine, ArrowRight, Loader } from "lucide-react";

const EnhancedJoinEventForm = ({ onEventJoined, boothCode = null }) => {
  const [eventCode, setEventCode] = useState(boothCode || "");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [joinMode, setJoinMode] = useState("standard"); // 'standard' or 'booth'
  const [currentEvent, setCurrentEvent] = useState(null);
  const [boothCustomization, setBoothCustomization] = useState(null);

  // Check for booth code on mount
  useEffect(() => {
    if (boothCode) {
      handleBoothCodeDetection(boothCode);
    }
  }, [boothCode]);

  // Handle booth code detection
  const handleBoothCodeDetection = async (code) => {
    setLoading(true);
    try {
      const { data: event, error } = await supabase
        .from("tasting_events")
        .select(
          `
          *,
          event_wines (*),
          event_locations (*)
        `
        )
        .eq("event_code", code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !event) {
        setError("Event not found. Please check the booth code.");
        setLoading(false);
        return;
      }

      console.log("Booth event loaded:", event);
      console.log("Event wines:", event.event_wines);

      if (event.is_booth_mode) {
        setCurrentEvent(event);
        setBoothCustomization(event.booth_customization);
        setJoinMode("booth");
        setEventCode(code.toUpperCase());
      } else {
        setEventCode(code.toUpperCase());
        setJoinMode("standard");
      }
    } catch (error) {
      console.error("Error checking booth code:", error);
      setError("Unable to verify event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle standard event join
  const joinEvent = async () => {
    if (!eventCode.trim()) {
      setError("Please enter an event code");
      return;
    }

    setLoading(true);
    setError("");

    try {
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
        setError("Event not found. Please check with your event organizer.");
        return;
      }

      console.log("Standard event loaded:", event);
      console.log("Event wines:", event.event_wines);

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

  // Create or get user profile for booth mode
  const createBoothUserSession = async (email, event) => {
    try {
      // First, try to find existing profile with this email
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("*")
        .eq("eventbrite_email", email.toLowerCase())
        .eq("is_temp_account", true)
        .maybeSingle();

      let userProfile;
      if (existingUser) {
        // Update expiration to 7 days from now for booth mode
        const newExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update({ account_expires_at: newExpiration.toISOString() })
          .eq("id", existingUser.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating profile expiration:", updateError);
          userProfile = existingUser;
        } else {
          userProfile = updatedProfile;
        }

        console.log("Using existing temp profile:", userProfile);
      } else {
        // Create new temporary profile for this email
        const newProfile = {
          id: crypto.randomUUID(),
          display_name: email.split("@")[0], // Use email prefix as display name
          eventbrite_email: email.toLowerCase(),
          is_temp_account: true,
          account_expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 days
          is_admin: false,
          created_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error("Error creating temp profile:", createError);
          throw createError;
        }

        userProfile = createdProfile;
        console.log("Created new temp profile:", userProfile);
      }

      // Create user session
      const sessionData = {
        userId: userProfile.id,
        displayName: userProfile.display_name,
        email: userProfile.eventbrite_email,
        isTemp: true,
        isBoothMode: true,
        eventId: event.id,
        expiresAt: userProfile.account_expires_at,
      };

      // Store session in localStorage for persistence
      localStorage.setItem("wineAppSession", JSON.stringify(sessionData));

      return sessionData;
    } catch (error) {
      console.error("Error creating booth user session:", error);
      throw error;
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
      // Create user session for booth mode
      const sessionData = await createBoothUserSession(email, currentEvent);

      // Make sure we have complete event data with wines and locations
      console.log("Passing event to parent:", currentEvent);
      console.log("Event wines before passing:", currentEvent.event_wines);

      // Add email to event data and proceed
      const eventWithUser = {
        ...currentEvent,
        userEmail: email,
      };

      onEventJoined(eventWithUser, sessionData);
    } catch (error) {
      console.error("Error joining booth event:", error);
      if (error.code === "23505") {
        setError(
          "An account with this email already exists. Please try a different email."
        );
      } else {
        setError("Unable to join event. Please try again.");
      }
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
              <img
                src={customization.logoUrl}
                alt="Event logo"
                className="w-16 h-16 mx-auto object-contain bg-white/10 rounded-lg p-2 mb-4"
              />
            ) : (
              <div className="text-6xl mb-4">{customization.icon}</div>
            )}

            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: customization.textColor }}
            >
              {customization.title}
            </h1>
            <p
              className="opacity-90"
              style={{ color: customization.textColor }}
            >
              {customization.subtitle}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: customization.textColor }}
              >
                📧 Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="your.email@example.com"
                style={{ color: customization.textColor }}
              />
            </div>

            <button
              onClick={handleBoothJoin}
              disabled={loading || !email.trim()}
              className="w-full bg-white/20 backdrop-blur-sm border border-white/30 px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ color: customization.textColor }}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {customization.buttonText}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div
              className="mt-4 text-xs opacity-75 text-center"
              style={{ color: customization.textColor }}
            >
              Your ratings and notes will be saved to your email address
            </div>
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

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Event Code
            </label>
            <input
              type="text"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 text-center text-lg font-mono bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="ABC123"
              maxLength="6"
            />
          </div>

          <button
            onClick={joinEvent}
            disabled={loading || !eventCode.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Join Event
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-green-200 text-sm">
            Don't have an event code? Contact your event organizer.
          </p>
        </div>
      </div>
    </div>
  );

  // Show loading screen while detecting booth mode
  if (loading && boothCode && !currentEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 text-center">
          <Loader className="w-16 h-16 text-white mx-auto mb-4 animate-spin" />
          <p className="text-white text-lg">Loading event...</p>
        </div>
      </div>
    );
  }

  // Main render logic
  if (joinMode === "booth" && currentEvent) {
    return renderBoothMode();
  }

  return renderStandardMode();
};

export default EnhancedJoinEventForm;
