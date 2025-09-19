import React from "react";
import { X, Calendar, MapPin } from "lucide-react";

const EventDescriptionModal = ({
  isOpen = false,
  event,
  onClose = () => console.log("Modal closed"),
}) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modal backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Event Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {event.event_name}
            </h3>

            <div className="space-y-2 text-sm text-gray-600">
              {event.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{new Date(event.event_date).toLocaleDateString()}</span>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                About This Event
              </h4>
              <div className="prose prose-sm text-gray-700">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          )}

          {/* Wine Count */}
          {event.event_wines && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {event.event_wines.length}
                </div>
                <div className="text-sm text-gray-600">
                  Wine{event.event_wines.length !== 1 ? "s" : ""} to taste
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDescriptionModal;
