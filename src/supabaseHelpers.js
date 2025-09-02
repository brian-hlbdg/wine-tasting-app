import { supabase } from './supabaseClient';

// ========================
// TEMP USER MANAGEMENT
// ========================

/**
 * Create temporary profiles from CSV attendee data
 * @param {Array} attendees - Array of attendee objects from CSV
 * @param {string} eventId - Event ID to associate attendees with
 * @returns {Object} Supabase response
 */
export const createTempProfiles = async (attendees, eventId) => {
  try {
    const profiles = attendees.map(attendee => ({
      id: crypto.randomUUID(),
      display_name: `${attendee.first_name} ${attendee.last_name}`,
      eventbrite_email: attendee.email,
      eventbrite_order_id: attendee.order_id || null,
      ticket_type: attendee.ticket_type || 'Standard',
      phone_number: attendee.phone || null,
      is_temp_account: true,
      account_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      is_admin: false,
      created_at: new Date().toISOString()
    }));

    console.log('Creating temp profiles:', profiles);

    const { data, error } = await supabase
      .from('profiles')
      .insert(profiles)
      .select();

    if (error) {
      console.error('Error creating temp profiles:', error);
      throw error;
    }

    console.log(`Successfully created ${profiles.length} temporary profiles`);
    return { data, error: null };

  } catch (error) {
    console.error('Unexpected error in createTempProfiles:', error);
    return { data: null, error };
  }
};

/**
 * Verify user access to event using email and event code
 * @param {string} eventCode - Event access code
 * @param {string} email - User's email address
 * @returns {Object} Event and attendee data if valid
 */
export const verifyEventAccess = async (eventCode, email) => {
  try {
    console.log('Verifying event access for:', { eventCode, email });

    // First, find the event by code
    const { data: event, error: eventError } = await supabase
      .from('tasting_events')
      .select('*')
      .eq('event_code', eventCode.toUpperCase())
      .single();

    if (eventError || !event) {
      console.error('Event not found:', eventError);
      return { 
        success: false, 
        message: 'Event not found. Please check your event code.',
        event: null,
        attendee: null 
      };
    }

    // Then, find the attendee by email
    const { data: attendee, error: attendeeError } = await supabase
      .from('profiles')
      .select('*')
      .eq('eventbrite_email', email.toLowerCase())
      .eq('is_temp_account', true)
      .gte('account_expires_at', new Date().toISOString())
      .single();

    if (attendeeError || !attendee) {
      console.error('Attendee not found or expired:', attendeeError);
      return {
        success: false,
        message: 'Email not found in attendee list or account has expired.',
        event,
        attendee: null
      };
    }

    console.log('Access verified successfully');
    return {
      success: true,
      message: 'Access granted',
      event,
      attendee
    };

  } catch (error) {
    console.error('Unexpected error in verifyEventAccess:', error);
    return {
      success: false,
      message: 'An error occurred during verification. Please try again.',
      event: null,
      attendee: null
    };
  }
};

/**
 * Upgrade temp account to permanent account
 * @param {string} userId - User ID to upgrade
 * @param {string} email - Email for login
 * @param {string} password - Password for account
 * @returns {Object} Supabase auth response
 */
export const upgradeTempAccount = async (userId, email, password) => {
  try {
    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      throw authError;
    }

    // Update profile to permanent account
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        id: authData.user.id, // Link to auth user
        is_temp_account: false,
        account_expires_at: null,
        upgraded_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      // If profile update fails, clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return { data: { auth: authData, profile: profileData }, error: null };

  } catch (error) {
    console.error('Error upgrading temp account:', error);
    return { data: null, error };
  }
};

// ========================
// WINE RATING FUNCTIONS
// ========================

/**
 * Save wine rating with user session
 * @param {Object} ratingData - Rating information
 * @returns {Object} Supabase response
 */
export const saveWineRating = async (ratingData) => {
  try {
    const { userId, wineId, rating, notes, descriptors, wouldBuy } = ratingData;

    // Save the main rating
    const { data: ratingResponse, error: ratingError } = await supabase
      .from('user_wine_ratings')
      .insert([{
        user_id: userId,
        event_wine_id: wineId,
        rating: rating,
        personal_notes: notes || null,
        would_buy: wouldBuy || rating >= 4
      }])
      .select()
      .single();

    if (ratingError) {
      throw ratingError;
    }

    // Save descriptors if provided
    if (descriptors && descriptors.length > 0) {
      const { data: descriptorIds } = await supabase
        .from('descriptors')
        .select('id, name')
        .in('name', descriptors);

      if (descriptorIds && descriptorIds.length > 0) {
        const descriptorInserts = descriptorIds.map(desc => ({
          user_rating_id: ratingResponse.id,
          descriptor_id: desc.id,
          intensity: 3 // Default intensity
        }));

        await supabase.from('user_wine_descriptors').insert(descriptorInserts);
      }
    }

    return { data: ratingResponse, error: null };

  } catch (error) {
    console.error('Error saving wine rating:', error);
    return { data: null, error };
  }
};

// ========================
// EVENT MANAGEMENT
// ========================

/**
 * Generate unique event code
 * @returns {string} 6-character event code
 */
export const generateEventCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Create event with unique code
 * @param {Object} eventData - Event information
 * @returns {Object} Created event with code
 */
export const createEventWithCode = async (eventData) => {
  try {
    let eventCode;
    let codeExists = true;
    let attempts = 0;
    const maxAttempts = 10;

    // Generate unique event code
    while (codeExists && attempts < maxAttempts) {
      eventCode = generateEventCode();
      
      const { data: existingEvent } = await supabase
        .from('tasting_events')
        .select('id')
        .eq('event_code', eventCode)
        .single();

      codeExists = !!existingEvent;
      attempts++;
    }

    if (codeExists) {
      throw new Error('Unable to generate unique event code. Please try again.');
    }

    // Create event with code
    const { data, error } = await supabase
      .from('tasting_events')
      .insert([{
        ...eventData,
        event_code: eventCode
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null, eventCode };

  } catch (error) {
    console.error('Error creating event with code:', error);
    return { data: null, error, eventCode: null };
  }
};

// ========================
// USER SESSION MANAGEMENT
// ========================

/**
 * Create user session for temp account
 * @param {Object} attendee - Attendee profile data
 * @returns {Object} Session data
 */
export const createUserSession = (attendee) => {
  const sessionData = {
    userId: attendee.id,
    displayName: attendee.display_name,
    email: attendee.eventbrite_email,
    ticketType: attendee.ticket_type,
    isTemp: attendee.is_temp_account,
    expiresAt: attendee.account_expires_at
  };

  // Store in localStorage for session persistence
  localStorage.setItem('wineAppSession', JSON.stringify(sessionData));
  
  return sessionData;
};

/**
 * Get current user session
 * @returns {Object|null} Session data or null
 */
export const getUserSession = () => {
  try {
    const sessionData = localStorage.getItem('wineAppSession');
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    
    // Check if session is expired
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      clearUserSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
};

/**
 * Clear user session
 */
export const clearUserSession = () => {
  localStorage.removeItem('wineAppSession');
};

// ========================
// CLEANUP FUNCTIONS
// ========================

/**
 * Clean up expired temp accounts (run periodically)
 * @returns {Object} Cleanup results
 */
export const cleanupExpiredTempAccounts = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('is_temp_account', true)
      .lt('account_expires_at', new Date().toISOString());

    if (error) {
      throw error;
    }

    console.log(`Cleaned up ${data?.length || 0} expired temp accounts`);
    return { data, error: null };

  } catch (error) {
    console.error('Error cleaning up expired accounts:', error);
    return { data: null, error };
  }
};

