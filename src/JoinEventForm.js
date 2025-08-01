import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Wine } from 'lucide-react';

const JoinEventForm = ({ onEventJoined }) => {
  const [eventCode, setEventCode] = useState('');

  const joinEvent = async (code) => {
    console.log('Joining event with code:', code);
    
    const { data: eventData, error: eventError } = await supabase
      .from('tasting_events')
      .select(`
        *,
        event_wines (*)
      `)
      .eq('event_code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (eventError) {
      console.error('Error finding event:', eventError);
      alert('Event not found. Please check the code.');
      return;
    }

    console.log('Event found:', eventData);
    onEventJoined(eventData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <Wine className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Join Wine Tasting</h1>
          <p className="text-gray-600">Enter the event code to get started</p>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Event Code (e.g. ABC123)"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value.toUpperCase())}
            className="w-full p-4 text-center text-lg font-mono border rounded-lg focus:ring-2 focus:ring-purple-500"
            maxLength="6"
          />
          
          <button
            onClick={() => joinEvent(eventCode)}
            disabled={eventCode.length < 6}
            className="w-full bg-purple-600 text-white py-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Join Event
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-600 text-center mb-3">First time? Quick signup:</p>
          <input
            type="tel"
            placeholder="Phone number"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 mb-3"
          />
          <button
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinEventForm;