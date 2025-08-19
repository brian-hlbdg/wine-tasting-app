import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const JoinEventForm = ({ onEventJoined }) => {
  const [eventCode, setEventCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const joinEvent = async (code) => {
    if (!code || code.length < 6) {
      alert('Please enter a 6-character event code');
      return;
    }
    
    setIsLoading(true);
    console.log('Joining event with code:', code);
    
    try {
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
      } else {
        console.log('Event found:', eventData);
        onEventJoined(eventData);
      }
    } catch (error) {
      console.error('Join event error:', error);
      alert('Error joining event');
    } finally {
      setIsLoading(false);
    }
  };

  console.log('JoinEventForm rendering');

  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Join Wine Tasting</h1>
      <p>Enter the event code to get started</p>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Event Code (e.g. ABC123)"
          value={eventCode}
          onChange={(e) => setEventCode(e.target.value.toUpperCase())}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            textAlign: 'center',
            border: '2px solid #ccc',
            borderRadius: '8px',
            fontFamily: 'monospace',
            letterSpacing: '2px'
          }}
          maxLength="6"
        />
      </div>
      
      <button
        onClick={() => joinEvent(eventCode)}
        disabled={eventCode.length < 6 || isLoading}
        style={{
          width: '100%',
          padding: '15px',
          fontSize: '18px',
          backgroundColor: eventCode.length >= 6 && !isLoading ? '#7c3aed' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: eventCode.length >= 6 && !isLoading ? 'pointer' : 'not-allowed'
        }}
      >
        {isLoading ? 'Joining...' : 'Join Event'}
      </button>
      
      <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Get the event code from your host
      </p>
    </div>
  );
};

export default JoinEventForm;