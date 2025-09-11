import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import {
  Trash2,
  Plus,
  MapPin,
  Wine,
  GripVertical,
  Save,
  Upload,
  Palette,
} from "lucide-react";
import WineForm from "./WineForm";

const EnhancedCreateEventForm = ({
  user,
  onBack,
  onEventCreated,
  editingEvent = null,
}) => {
  const [eventForm, setEventForm] = useState({
    event_name: "",
    event_date: "",
    location: "", // This becomes the main event location
    description: "",
    wines: [],
  });

  // Access Type State
  const [accessType, setAccessType] = useState("standard"); // 'standard' or 'booth'

  // Booth Mode Customization State
  const [boothCustomization, setBoothCustomization] = useState({
    icon: "🍷", // Default wine glass emoji
    title: "Welcome to our Wine Tasting!",
    subtitle: "Enter your email to start rating wines",
    buttonText: "Start Tasting",
    backgroundColor: "#047857", // Default green
    textColor: "#ffffff",
    logoUrl: null, // URL to uploaded logo
    useCustomLogo: false, // Toggle between icon and logo
  });

  // Logo upload state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [locations, setLocations] = useState([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");
  const [showWineForm, setShowWineForm] = useState(false);
  const [editingWineIndex, setEditingWineIndex] = useState(null);

  // Predefined icon options for booth mode
  const iconOptions = [
    "🍷",
    "🍾",
    "🥂",
    "🍇",
    "🍸",
    "🍹",
    "🥃",
    "🧊",
    "🎭",
    "🎪",
    "🎨",
    "🎵",
    "⭐",
    "✨",
    "🎉",
    "🌟",
  ];

  // Handle logo file selection
  const handleLogoSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB");
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload logo to Supabase Storage
  const uploadLogo = async () => {
    if (!logoFile) return null;

    setUploading(true);
    try {
      // Generate unique filename
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `booth-logos/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("event-assets") // You'll need to create this bucket
        .upload(fileName, logoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("event-assets").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Failed to upload logo: " + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Remove logo
  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setBoothCustomization((prev) => ({
      ...prev,
      logoUrl: null,
      useCustomLogo: false,
    }));
  };

  // Load existing event data if editing
  const loadEventForEditing = useCallback(async () => {
    if (!editingEvent) return;

    try {
      // Load event details
      setEventForm({
        event_name: editingEvent.event_name,
        event_date: editingEvent.event_date,
        location: editingEvent.location || "",
        description: editingEvent.description || "",
        wines: [],
      });

      // Set access type based on event data
      setAccessType(editingEvent.is_booth_mode ? "booth" : "standard");

      // Load booth customization if it exists
      if (editingEvent.booth_customization) {
        setBoothCustomization((prev) => ({
          ...prev,
          ...editingEvent.booth_customization,
        }));

        // Set logo preview if exists
        if (editingEvent.booth_customization.logoUrl) {
          setLogoPreview(editingEvent.booth_customization.logoUrl);
        }
      }

      // Load locations for this event (only for standard mode)
      if (!editingEvent.is_booth_mode) {
        const { data: locationsData } = await supabase
          .from("event_locations")
          .select("*")
          .eq("event_id", editingEvent.id)
          .order("location_order");
        setLocations(locationsData || []);
      }

      // Load wines for this event
      const { data: winesData } = await supabase
        .from("event_wines")
        .select("*")
        .eq("event_id", editingEvent.id)
        .order("location_name, tasting_order");

      setEventForm((prev) => ({ ...prev, wines: winesData || [] }));
    } catch (error) {
      console.error("Error loading event for editing:", error);
    }
  }, [editingEvent]); // Removed boothCustomization dependency

  useEffect(() => {
    loadEventForEditing();
  }, [loadEventForEditing]);

  const addLocation = () => {
    if (!newLocationName.trim()) return;

    const newLocation = {
      id: `temp-${Date.now()}`,
      location_name: newLocationName.trim(),
      location_address: newLocationAddress.trim() || null,
      location_order: locations.length + 1,
      isNew: true,
    };

    setLocations((prev) => [...prev, newLocation]);
    setNewLocationName("");
    setNewLocationAddress("");
  };

  const removeLocation = (locationIndex, locationName) => {
    const winesAtLocation = eventForm.wines.filter(
      (wine) => wine.location_name === locationName
    );

    if (winesAtLocation.length > 0) {
      if (
        !window.confirm(
          `This will unassign ${winesAtLocation.length} wines from "${locationName}". Continue?`
        )
      ) {
        return;
      }

      setEventForm((prev) => ({
        ...prev,
        wines: prev.wines.map((wine) =>
          wine.location_name === locationName
            ? { ...wine, location_name: "" }
            : wine
        ),
      }));
    }

    setLocations((prev) => prev.filter((_, index) => index !== locationIndex));
  };

  const handleWineAction = (action, wine = null, index = null) => {
    if (action === "add") {
      setEditingWineIndex(null);
      setShowWineForm(true);
    } else if (action === "edit") {
      setEditingWineIndex(index);
      setShowWineForm(true);
    }
  };

  const handleWineSaved = (wineData) => {
    if (editingWineIndex !== null) {
      setEventForm((prev) => ({
        ...prev,
        wines: prev.wines.map((wine, index) =>
          index === editingWineIndex ? wineData : wine
        ),
      }));
    } else {
      setEventForm((prev) => ({
        ...prev,
        wines: [...prev.wines, wineData],
      }));
    }
    setShowWineForm(false);
    setEditingWineIndex(null);
  };

  const removeWine = (index) => {
    setEventForm((prev) => ({
      ...prev,
      wines: prev.wines.filter((_, i) => i !== index),
    }));
  };

  const generateEventCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eventForm.event_name.trim()) {
      alert("Please enter an event name");
      return;
    }

    try {
      const eventCode = editingEvent?.event_code || generateEventCode();

      // Upload logo if one is selected
      let logoUrl = boothCustomization.logoUrl;
      if (logoFile && accessType === "booth") {
        logoUrl = await uploadLogo();
        if (!logoUrl) {
          // Upload failed, but allow user to continue without logo
          const proceed = window.confirm(
            "Logo upload failed. Continue saving event without logo?"
          );
          if (!proceed) return;
        }
      }

      const eventData = {
        event_name: eventForm.event_name.trim(),
        event_date: eventForm.event_date || null,
        location: eventForm.location.trim() || null,
        description: eventForm.description.trim() || null,
        event_code: eventCode,
        is_active: true,
        created_by: user.id,
        is_booth_mode: accessType === "booth",
        booth_customization:
          accessType === "booth"
            ? {
                ...boothCustomization,
                logoUrl: logoUrl,
              }
            : null,
      };

      let savedEvent;

      if (editingEvent) {
        const { data, error } = await supabase
          .from("tasting_events")
          .update(eventData)
          .eq("id", editingEvent.id)
          .select()
          .single();

        if (error) throw error;
        savedEvent = data;
      } else {
        const { data, error } = await supabase
          .from("tasting_events")
          .insert([eventData])
          .select()
          .single();

        if (error) throw error;
        savedEvent = data;
      }

      // Save locations only for standard mode
      if (accessType === "standard" && locations.length > 0) {
        if (editingEvent) {
          await supabase
            .from("event_locations")
            .delete()
            .eq("event_id", editingEvent.id);
        }

        const locationsToSave = locations.map((location, index) => ({
          event_id: savedEvent.id,
          location_name: location.location_name,
          location_address: location.location_address,
          location_order: index + 1,
        }));

        const { error: locationError } = await supabase
          .from("event_locations")
          .insert(locationsToSave);

        if (locationError) throw locationError;
      }

      // Save wines
      if (eventForm.wines.length > 0) {
        if (editingEvent) {
          await supabase
            .from("event_wines")
            .delete()
            .eq("event_id", editingEvent.id);
        }

        const winesToSave = eventForm.wines.map((wine, index) => ({
          ...wine,
          event_id: savedEvent.id,
          tasting_order: index + 1,
          location_name: accessType === "booth" ? null : wine.location_name,
        }));

        const { error: wineError } = await supabase
          .from("event_wines")
          .insert(winesToSave);

        if (wineError) throw wineError;
      }

      if (onEventCreated) {
        onEventCreated(savedEvent);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Error saving event: " + error.message);
    }
  };

  if (showWineForm) {
    const locationOptions =
      accessType === "standard"
        ? locations.map((loc) => loc.location_name)
        : [];

    return (
      <WineForm
        onSave={handleWineSaved}
        onCancel={() => setShowWineForm(false)}
        existingWine={
          editingWineIndex !== null ? eventForm.wines[editingWineIndex] : null
        }
        locationOptions={locationOptions}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </h1>
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Event Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Event Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.event_name}
                    onChange={(e) =>
                      setEventForm((prev) => ({
                        ...prev,
                        event_name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Summer Wine Tasting"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventForm.event_date}
                    onChange={(e) =>
                      setEventForm((prev) => ({
                        ...prev,
                        event_date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Location
                  </label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) =>
                      setEventForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Downtown Convention Center"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Brief description of your event..."
                  />
                </div>
              </div>
            </div>

            {/* Access Type Selection */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4 text-red-600">
                Access Type
              </h2>

              <div className="space-y-4">
                {/* Standard Access Option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    accessType === "standard"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() => setAccessType("standard")}
                >
                  <div className="flex items-center mb-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        accessType === "standard"
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {accessType === "standard" && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">
                      Standard Access (Event Code)
                    </h3>
                  </div>
                  <p className="text-gray-600 ml-7">
                    Participants need an event code to join. Best for private
                    events or remote tastings.
                  </p>
                </div>

                {/* Booth Mode Option */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    accessType === "booth"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() => setAccessType("booth")}
                >
                  <div className="flex items-center mb-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        accessType === "booth"
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      {accessType === "booth" && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">
                      Booth Mode (Email Only)
                    </h3>
                  </div>
                  <p className="text-gray-600 ml-7">
                    Participants only need to enter their email. Perfect for
                    trade shows, retail tastings, or walk-up events.
                  </p>

                  {accessType === "booth" && (
                    <div className="mt-4 ml-7 p-4 bg-green-100 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        Booth Mode Features:
                      </h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• No event code required for users</li>
                        <li>• Quick email-only registration</li>
                        <li>• Perfect for in-person events</li>
                        <li>• All ratings tracked by email address</li>
                        <li>
                          • Use this URL format:{" "}
                          <code className="bg-green-200 px-1 rounded">
                            yoursite.com/?boothCode=ABC123
                          </code>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booth Customization - Only show when booth mode is selected */}
            {accessType === "booth" && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                <h2 className="text-lg font-semibold mb-4 text-green-800 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Booth Screen Customization
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Customization Controls */}
                  <div className="space-y-4">
                    {/* Logo vs Icon Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Booth Display
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="displayType"
                            checked={!boothCustomization.useCustomLogo}
                            onChange={() =>
                              setBoothCustomization((prev) => ({
                                ...prev,
                                useCustomLogo: false,
                              }))
                            }
                            className="mr-2"
                          />
                          Use Icon
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="displayType"
                            checked={boothCustomization.useCustomLogo}
                            onChange={() =>
                              setBoothCustomization((prev) => ({
                                ...prev,
                                useCustomLogo: true,
                              }))
                            }
                            className="mr-2"
                          />
                          Use Custom Logo
                        </label>
                      </div>
                    </div>

                    {/* Icon Selection - Only show if not using custom logo */}
                    {!boothCustomization.useCustomLogo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Booth Icon
                        </label>
                        <div className="grid grid-cols-8 gap-2">
                          {iconOptions.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() =>
                                setBoothCustomization((prev) => ({
                                  ...prev,
                                  icon,
                                }))
                              }
                              className={`w-12 h-12 text-2xl border-2 rounded-lg hover:bg-gray-50 transition-all ${
                                boothCustomization.icon === icon
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200"
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Logo Upload - Only show if using custom logo */}
                    {boothCustomization.useCustomLogo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom Logo
                        </label>

                        {!logoPreview ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-2">
                              Upload your logo (PNG, JPG, SVG)
                            </p>
                            <p className="text-xs text-gray-500 mb-4">
                              Max size: 2MB • Recommended: 200x200px
                            </p>
                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 cursor-pointer">
                              <Upload className="w-4 h-4" />
                              Choose File
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoSelect}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="w-16 h-16 object-contain bg-white rounded border"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">
                                  {logoFile?.name || "Existing logo"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {logoFile
                                    ? `${(logoFile.size / 1024).toFixed(1)} KB`
                                    : "Previously uploaded"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={removeLogo}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {logoFile && (
                              <label className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer text-sm">
                                <Upload className="w-4 h-4" />
                                Change File
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoSelect}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={boothCustomization.title}
                        onChange={(e) =>
                          setBoothCustomization((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={boothCustomization.subtitle}
                        onChange={(e) =>
                          setBoothCustomization((prev) => ({
                            ...prev,
                            subtitle: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Button Text
                      </label>
                      <input
                        type="text"
                        value={boothCustomization.buttonText}
                        onChange={(e) =>
                          setBoothCustomization((prev) => ({
                            ...prev,
                            buttonText: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={boothCustomization.backgroundColor}
                          onChange={(e) =>
                            setBoothCustomization((prev) => ({
                              ...prev,
                              backgroundColor: e.target.value,
                            }))
                          }
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={boothCustomization.backgroundColor}
                          onChange={(e) =>
                            setBoothCustomization((prev) => ({
                              ...prev,
                              backgroundColor: e.target.value,
                            }))
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      Live Preview
                    </h3>
                    <div
                      className="rounded-lg p-6 text-center text-white relative overflow-hidden"
                      style={{
                        backgroundColor: boothCustomization.backgroundColor,
                      }}
                    >
                      {/* Display Icon or Logo */}
                      {boothCustomization.useCustomLogo && logoPreview ? (
                        <div className="mb-4">
                          <img
                            src={logoPreview}
                            alt="Booth logo"
                            className="w-16 h-16 mx-auto object-contain bg-white/10 rounded-lg p-2"
                          />
                        </div>
                      ) : (
                        <div className="text-6xl mb-4">
                          {boothCustomization.icon}
                        </div>
                      )}

                      <h1 className="text-xl font-bold mb-2">
                        {boothCustomization.title}
                      </h1>
                      <p className="text-sm opacity-90 mb-6">
                        {boothCustomization.subtitle}
                      </p>

                      <div className="mb-4">
                        <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-3 text-left">
                          <div className="text-xs opacity-75 mb-1">
                            📧 Email Address
                          </div>
                          <div className="text-sm opacity-60">
                            your.email@example.com
                          </div>
                        </div>
                      </div>

                      <button
                        className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all"
                        style={{ color: boothCustomization.textColor }}
                        disabled={uploading}
                      >
                        {uploading
                          ? "Uploading..."
                          : `${boothCustomization.buttonText} →`}
                      </button>

                      <div className="mt-4 text-xs opacity-75">
                        Your ratings and notes will be saved to your email
                        address
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wine Crawl Locations - Only show for standard mode */}
            {accessType === "standard" && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-green-600">
                    Wine Crawl Locations (Optional)
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      placeholder="Location name (e.g., 'Vineyard A', 'Tasting Room B')"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      value={newLocationAddress}
                      onChange={(e) => setNewLocationAddress(e.target.value)}
                      placeholder="Address (optional)"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addLocation}
                    disabled={!newLocationName.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>

                  {locations.length > 0 && (
                    <div className="space-y-2">
                      {locations.map((location, index) => (
                        <div
                          key={location.id || index}
                          className="flex items-center gap-3 p-3 bg-white rounded border"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium">
                              {location.location_name}
                            </div>
                            {location.location_address && (
                              <div className="text-sm text-gray-500">
                                {location.location_address}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              removeLocation(index, location.location_name)
                            }
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Wines Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wine className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold">
                    Wines ({eventForm.wines.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleWineAction("add")}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Wine
                </button>
              </div>

              {eventForm.wines.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Wine className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No wines added yet. Click "Add Wine" to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventForm.wines.map((wine, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-white rounded border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{wine.name}</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {wine.wine_type}
                          </span>
                          {wine.vintage && (
                            <span className="text-sm text-gray-500">
                              {wine.vintage}
                            </span>
                          )}
                        </div>
                        {wine.producer && (
                          <div className="text-sm text-gray-600">
                            {wine.producer}
                          </div>
                        )}
                        {wine.region && (
                          <div className="text-sm text-gray-500">
                            {wine.region}
                          </div>
                        )}
                        {accessType === "standard" && wine.location_name && (
                          <div className="text-xs text-green-600 mt-1">
                            📍 {wine.location_name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleWineAction("edit", wine, index)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <GripVertical className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeWine(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                {editingEvent && (
                  <div className="text-sm text-gray-500">
                    Event Code:{" "}
                    <span className="font-mono font-semibold">
                      {editingEvent.event_code}
                    </span>
                  </div>
                )}
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  <Save className="w-4 h-4" />
                  {editingEvent ? "Update Event" : "Create Event"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCreateEventForm;
