import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Wine } from 'lucide-react';

const DebugJoinEventForm = ({ onEventJoined, prefilledCode = '' }) => {
  const [eventCode, setEventCode] = useState(prefilledCode);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState([]);

  // Set prefilled code when prop changes
  useEffect(() => {
    if (prefilledCode) {
      setEventCode(prefilledCode);
    }
  }, [prefilledCode]);

  const addDebugInfo = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, { timestamp, message, data }]);
    console.log(`[${timestamp}] ${message}`, data);
  };

  const joinEvent = async () => {
    setDebugInfo([]); // Clear previous debug info
    
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
    addDebugInfo('🚀 Starting join process...', { eventCode, email });
    
    try {
      // Check Supabase connection
      addDebugInfo('🔌 Testing Supabase connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('tasting_events')
        .select('count', { count: 'exact', head: true });
      
      if (connectionError) {
        addDebugInfo('❌ Supabase connection failed', connectionError);
        setError(`Database connection error: ${connectionError.message}`);
        return;
      }
      addDebugInfo('✅ Supabase connection successful');

      // Find the event by code
      addDebugInfo('🔍 Looking for event with code...', eventCode);
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
        addDebugInfo('❌ Event not found', eventError);
        setError('Event not found. Please check the event code.');
        return;
      }

      addDebugInfo('✅ Event found', { 
        id: eventData.id, 
        name: eventData.event_name,
        access_type: eventData.access_type 
      });
      
      // Check if this is an email_only event
      if (eventData.access_type === 'email_only') {
        addDebugInfo('⚠️ This is an email-only event');
        setError('This event uses email-only access. Please contact the event organizer for the correct link.');
        return;
      }

      // Check current user permissions
      addDebugInfo('🔐 Checking user permissions...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      addDebugInfo('👤 Current auth user', user ? { id: user.id, email: user.email } : 'None');

      // Check profiles table permissions
      addDebugInfo('📋 Testing profiles table access...');
      const { data: profilesTest, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (profilesError) {
        addDebugInfo('❌ Profiles table access denied', profilesError);
        setError(`Database access error: ${profilesError.message}`);
        return;
      }
      addDebugInfo('✅ Profiles table accessible');

      // Try to find existing profile
      addDebugInfo('🔍 Looking for existing profile...', email);
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('eventbrite_email', email.toLowerCase())
        .eq('is_temp_account', true)
        .maybeSingle();

      if (userError) {
        addDebugInfo('❌ Error checking existing profile', userError);
        setError(`Error checking existing profile: ${userError.message}`);
        return;
      }

      let userProfile;
      
      if (existingUser) {
        addDebugInfo('✅ Found existing profile', { 
          id: existingUser.id, 
          email: existingUser.eventbrite_email,
          expires: existingUser.account_expires_at 
        });
        
        // Update expiration if account exists but might be close to expiring
        const expiresAt = new Date(existingUser.account_expires_at);
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        if (expiresAt < oneDayFromNow) {
          addDebugInfo('⏰ Extending account expiration...');
          const newExpiration = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ account_expires_at: newExpiration.toISOString() })
            .eq('id', existingUser.id)
            .select()
            .single();
            
          if (updateError) {
            addDebugInfo('⚠️ Failed to update expiration, continuing with existing profile', updateError);
            userProfile = existingUser;
          } else {
            addDebugInfo('✅ Account expiration extended');
            userProfile = updatedProfile;
          }
        } else {
          userProfile = existingUser;
        }
      } else {
        addDebugInfo('🆕 Creating new profile...');
        
        // Create new temporary profile
        const newProfile = {
          id: crypto.randomUUID(),
          display_name: email.split('@')[0],
          eventbrite_email: email.toLowerCase(),
          is_temp_account: true,
          account_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_admin: false,
          created_at: new Date().toISOString()
        };

        addDebugInfo('📝 Profile data to insert', newProfile);

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          addDebugInfo('❌ Profile creation failed', {
            error: createError,
            code: createError.code,
            message: createError.message,
            details: createError.details,
            hint: createError.hint
          });
          
          // Provide more specific error messages based on error codes
          if (createError.code === '23505') {
            setError('An account with this email already exists. Please try a different email.');
          } else if (createError.code === '42501') {
            setError('Permission denied. Please contact the event organizer.');
          } else if (createError.code === '23502') {
            setError('Missing required data. Please refresh and try again.');
          } else {
            setError(`Profile creation failed: ${createError.message}`);
          }
          return;
        }

        userProfile = createdProfile;
        addDebugInfo('✅ New profile created successfully', { id: userProfile.id });
      }

      // Create user session
      addDebugInfo('💾 Creating user session...');
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
      addDebugInfo('✅ Session stored successfully');
      
      // Successfully joined
      addDebugInfo('🎉 Join process completed successfully!');
      onEventJoined(eventData, sessionData);
      
    } catch (error) {
      addDebugInfo('💥 Unexpected error occurred', error);
      setError(`Unexpected error: ${error.message}`);
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
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <div className="text-center mb-6">
          <Wine className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Join Wine Tasting (Debug Mode)</h1>
          <p className="text-gray-600">Enter your event code and email to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Event Code (e.g. ABC123)"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              className="w-full p-4 text-center text-lg font-mono border rounded-lg focus:ring-2 focus:ring-purple-500"
              maxLength="6"
              readOnly={!!prefilledCode}
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

        {/* Debug Information */}
        {debugInfo.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Debug Information:</h3>
            <div className="space-y-2 text-sm font-mono max-h-60 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index} className="flex flex-col">
                  <div className="text-gray-600">
                    [{info.timestamp}] {info.message}
                  </div>
                  {info.data && (
                    <div className="text-xs text-gray-500 ml-4 bg-white p-2 rounded mt-1">
                      {JSON.stringify(info.data, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Don't have an event code?</p>
          <p>Contact your event organizer</p>
        </div>
      </div>
    </div>
  );
};

export default DebugJoinEventForm;