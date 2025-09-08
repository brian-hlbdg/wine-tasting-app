import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import JoinEventForm from './JoinEventForm';
import EmailOnlyJoinForm from './EmailOnlyJoinForm';
import { Wine, AlertCircle } from 'lucide-react';

const BoothModeDetector = ({ onEventJoined }) => {
  const [eventId, setEventId] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkForBoothModeEvent();
  }, []);

  const checkForBoothModeEvent = async () => {
    try {
      // Check URL parameters for direct event access
      const urlParams = new URLSearchParams(window.location.search);
      const eventIdFromUrl = urlParams.get('eventId');
      const eventCodeFromUrl = urlParams.get('code');
      const boothCodeFromUrl = urlParams.get('boothCode'); // New parameter for booth mode

      if (eventIdFromUrl) {
        // Direct access via event ID (for booth mode)
        const { data: event, error } = await supabase
          .from('tasting_events')
          .select('*')
          .eq('id', eventIdFromUrl)
          .eq('is_active', true)
          .single();

        if (error || !event) {
          setError('Event not found or no longer active');
          setLoading(false);
          return;
        }

        setEventData(event);
        setEventId(event.id);
      } else if (boothCodeFromUrl) {
        // Access via booth code (event code for booth mode events)
        const { data: event, error } = await supabase
          .from('tasting_events')
          .select('*')
          .eq('event_code', boothCodeFromUrl.toUpperCase())
          .eq('access_type', 'email_only') // Only booth mode events
          .eq('is_active', true)
          .single();

        if (error || !event) {
          setError('Booth event not found with that code');
          setLoading(false);
          return;
        }

        setEventData(event);
        setEventId(event.id);
      } else if (eventCodeFromUrl) {
        // Access via event code (standard mode)
        const { data: event, error } = await supabase
          .from('tasting_events')
          .select('*')
          .eq('event_code', eventCodeFromUrl.toUpperCase())
          .eq('is_active', true)
          .single();

        if (error || !event) {
          setError('Event not found with that code');
          setLoading(false);
          return;
        }

        setEventData(event);
        setEventId(event.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking for booth mode event:', error);
      setError('Error loading event information');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Wine className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading event information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
          >
            Try Another Event
          </button>
        </div>
      </div>
    );
  }

  // If we have event data, check its access type
  if (eventData) {
    if (eventData.access_type === 'email_only') {
      // Show email-only join form for booth mode
      return <EmailOnlyJoinForm eventId={eventData.id} onEventJoined={onEventJoined} />;
    } else {
      // Show standard join form, but pre-fill the event code if available
      return <JoinEventForm onEventJoined={onEventJoined} prefilledCode={eventData.event_code} />;
    }
  }

  // No specific event detected, show standard join form
  return <JoinEventForm onEventJoined={onEventJoined} />;
};

export default BoothModeDetector;