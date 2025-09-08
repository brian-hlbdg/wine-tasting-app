import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Wine } from 'lucide-react';

const JoinEventForm = ({ onEventJoined, prefilledCode = '' }) => {
  const [eventCode, setEventCode] = useState(prefilledCode);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set prefilled code when prop changes
  useEffect(() => {
    if (prefilledCode) {
      setEventCode(prefilledCode);
    }
  }, [prefilledCode]);

  const joinEvent = async () => {
    if (!eventCode.trim()) {
      setError('Please enter an event code');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Joining event with code:', eventCode, 'and email:', email);
      
      // Find the event by code
      const { data: eventData, error: eventError } = await supabase
        .from('tasting_events')
        .select(`
          *,
          event_wines (*),
          event_locations (*)
        `)
        .eq('event_code', eventCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (eventError || !eventData) {
        console.error('Error finding event:', eventError);
        setError('Event not found. Please check the event code.');
        return;
      }

      console.log('Event found:', eventData);
      
      // Check if this is an email_only event (shouldn't happen via this form, but just in case)
      if (eventData.access_type === 'email_only') {
        setError('This event uses email-only access. Please contact the event organizer for the correct link.');
        return;
      }

      // For standard events, create or find user profile
      // This is more permissive than the old system - anyone with the code can join
      let userProfile;
      
      try {
        // First, try to find existing profile with this email
        const { data: existingUser, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('eventbrite_email', email.toLowerCase())
          .eq('is_temp_account', true)
          .maybeSingle(); // Use maybeSingle to avoid errors if not found

        if (existingUser) {
          // Update expiration if account exists but might be close to expiring
          const expiresAt = new Date(existingUser.account_expires_at);
          const now = new Date();
          const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          
          if (expiresAt < oneDayFromNow) {
            // Extend expiration by 30 days
            const newExpiration = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            
            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update({ account_expires_at: newExpiration.toISOString() })
              .eq('id', existingUser.id)
              .select()
              .single();
              
            if (updateError) {
              console.error('Error updating profile expiration:', updateError);
              // Continue with existing profile even if update fails
              userProfile = existingUser;
            } else {
              userProfile = updatedProfile;
            }
          } else {
            userProfile = existingUser;
          }
          
          console.log('Using existing temp profile:', userProfile);
        } else {
          // Create new temporary profile
          const newProfile = {
            id: crypto.randomUUID(),
            display_name: email.split('@')[0], // Use email prefix as display name
            eventbrite_email: email.toLowerCase(),
            is_temp_account: true,
            account_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            is_admin: false,
            created_at: new Date().toISOString()
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (createError) {
            console.error('Error creating temp profile:', createError);
            
            // Try to provide more specific error messages
            if (createError.code === '23505') { // Unique constraint violation
              setError('An account with this email already exists. Please try a different email or contact support.');
            } else if (createError.code === '42501') { // Permission denied
              setError('Unable to create user account. Please contact the event organizer.');
            } else {
              setError('Unable to create user profile. Please try again or contact support.');
            }
            return;
          }

          userProfile = createdProfile;
          console.log('Created new temp profile:', userProfile);
        }

      } catch (profileError) {
        console.error('Error handling user profile:', profileError);
        setError('Unable to process user profile. Please try again.');
        return;
      }

      // Create user session
      const sessionData = {
        userId: userProfile.id,
        displayName: userProfile.display_name,
        email: userProfile.eventbrite_email,
        isTemp: true,
        accessType: 'event_code',
        eventId: eventData.id,
        expiresAt: userProfile.account_expires_at
      };

      // Store session
      localStorage.setItem('wineAppSession', JSON.stringify(sessionData));
      
      // Successfully joined
      onEventJoined(eventData, sessionData);
      
    } catch (error) {
      console.error('Error joining event:', error);
      setError('Error joining event. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    joinEvent();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <Wine className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Join Wine Tasting</h1>
          <p className="text-gray-600">Enter your event code and email to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Event Code (e.g. ABC123)"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              className="w-full p-4 text-center text-lg font-mono border rounded-lg focus:ring-2 focus:ring-purple-500"
              maxLength="6"
              readOnly={!!prefilledCode} // Make readonly if prefilled
              required
            />
            
            {prefilledCode && (
              <div className="text-sm text-green-600 text-center mt-1">
                ✓ Event code automatically detected
              </div>
            )}
          </div>
          
          <div>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || eventCode.length < 3 || !email}
            className="w-full bg-purple-600 text-white py-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Joining...' : 'Join Event'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Don't have an event code?</p>
          <p>Contact your event organizer</p>
        </div>
      </div>
    </div>
  );
};

export default JoinEventForm;