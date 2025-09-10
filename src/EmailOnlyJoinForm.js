import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Wine, Mail, ArrowRight } from 'lucide-react';

const EmailOnlyJoinForm = ({ eventId, onEventJoined }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const joinEvent = async () => {
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
      console.log('Joining booth mode event:', eventId, 'with email:', email);
      
      // Load the event data
      const { data: eventData, error: eventError } = await supabase
        .from('tasting_events')
        .select(`
          *,
          event_wines (*),
          event_locations (*)
        `)
        .eq('id', eventId)
        .eq('access_type', 'email_only')
        .eq('is_active', true)
        .single();

      if (eventError || !eventData) {
        console.error('Error finding event:', eventError);
        setError('Event not found or not accessible.');
        return;
      }

      console.log('Booth mode event found:', eventData);
      
      // Create or find user session for this email
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
          // Update expiration to 7 days from now for booth mode
          const newExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          
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
          
          console.log('Using existing temp profile:', userProfile);
        } else {
          // Create new temporary profile for this email
          const newProfile = {
            id: crypto.randomUUID(),
            display_name: email.split('@')[0], // Use email prefix as display name
            eventbrite_email: email.toLowerCase(),
            is_temp_account: true,
            account_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
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
            
            // Provide more specific error messages
            if (createError.code === '23505') { // Unique constraint violation
              setError('An account with this email already exists. Please try a different email.');
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
        accessType: 'email_only',
        eventId: eventData.id,
        expiresAt: userProfile.account_expires_at
      };

      // Store session in localStorage for persistence
      localStorage.setItem('wineAppSession', JSON.stringify(sessionData));
      
      // Join the event
      onEventJoined(eventData, sessionData);
      
    } catch (error) {
      console.error('Error joining booth mode event:', error);
      setError('Error joining event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    joinEvent();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <Wine className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to our Wine Tasting!</h1>
          <p className="text-green-200">Enter your email to start rating wines</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="your.email@example.com"
              required
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Joining...
              </>
            ) : (
              <>
                Start Tasting
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-white/80">
          <p>Your ratings and notes will be saved to your email address</p>
        </div>
      </div>
    </div>
  );
};

export default EmailOnlyJoinForm;