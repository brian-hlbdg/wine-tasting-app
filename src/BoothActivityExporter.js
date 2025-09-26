import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import {
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const BoothActivityExporter = ({ eventId, eventName, className = "" }) => {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [lastExport, setLastExport] = useState(null);

  // Function to convert data to CSV format
  const convertToCSV = (data) => {
    if (!data || data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(",");

    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values that might contain commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"') || value.includes("\n"))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || "";
        })
        .join(",")
    );

    return [csvHeaders, ...csvRows].join("\n");
  };

  // Function to trigger file download
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportBoothActivity = async () => {
    if (!eventId) {
      setError("No event ID provided");
      return;
    }

    setExporting(true);
    setError("");

    try {
      // Fetch all ratings and user data for this event
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("user_wine_ratings")
        .select(
          `
          *,
          profiles:user_id (
            eventbrite_email,
            display_name,
            created_at
          ),
          event_wines:event_wine_id (
            wine_name,
            producer,
            vintage,
            wine_type,
            tasting_order
          ),
          user_wine_descriptors (
            intensity,
            descriptors (
              name,
              category
            )
          )
        `
        )
        .eq("event_wines.event_id", eventId)
        .order("created_at", { ascending: true });

      if (ratingsError) {
        throw new Error(`Database error: ${ratingsError.message}`);
      }

      if (!ratingsData || ratingsData.length === 0) {
        setError("No booth activity found for this event");
        setExporting(false);
        return;
      }

      // Transform the data for Excel export
      const exportData = ratingsData.map((rating, index) => {
        // Collect descriptors for this rating
        const descriptors =
          rating.user_wine_descriptors
            ?.map((d) => d.descriptors?.name)
            ?.filter(Boolean)
            ?.join("; ") || "";

        return {
          "Entry #": index + 1,
          "Email Address": rating.profiles?.eventbrite_email || "Unknown",
          "Participant Name": rating.profiles?.display_name || "Anonymous",
          "Wine Name": rating.event_wines?.wine_name || "Unknown Wine",
          Producer: rating.event_wines?.producer || "",
          Vintage: rating.event_wines?.vintage || "",
          "Wine Type": rating.event_wines?.wine_type || "",
          "Tasting Order": rating.event_wines?.tasting_order || "",
          "Rating (1-5)": rating.rating || "",
          "Personal Notes": rating.personal_notes || "",
          "Would Buy": rating.would_buy ? "Yes" : "No",
          "Tasting Descriptors": descriptors,
          "Rated At": rating.created_at
            ? new Date(rating.created_at).toLocaleString()
            : "",
          "Updated At": rating.updated_at
            ? new Date(rating.updated_at).toLocaleString()
            : "",
        };
      });

      // Generate filename
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const sanitizedEventName = (eventName || "Event")
        .replace(/[^\w\s-]/g, "")
        .trim();
      const filename = `${sanitizedEventName}_Booth_Activity_${timestamp}.csv`;

      // Convert to CSV and download
      const csvContent = convertToCSV(exportData);
      downloadCSV(csvContent, filename);

      setLastExport(new Date());

      // Show success message briefly
      setTimeout(() => setLastExport(null), 3000);
    } catch (error) {
      console.error("Export error:", error);
      setError(error.message || "Error exporting data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`booth-activity-exporter ${className}`}>
      <button
        onClick={exportBoothActivity}
        disabled={exporting || !eventId}
        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
        title="Export booth activity to Excel/CSV"
      >
        {exporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export Activity
          </>
        )}
      </button>

      {/* Success message */}
      {lastExport && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span>
            Exported successfully at {lastExport.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Info about export */}
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <FileSpreadsheet className="w-3 h-3" />
          <span>
            Exports all participant ratings, comments, and wine details
          </span>
        </div>
      </div>
    </div>
  );
};

export default BoothActivityExporter;
