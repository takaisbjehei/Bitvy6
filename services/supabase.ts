import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';
import { Player } from '../types';

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Registers a player or retrieves existing one by username.
 * Updates presence to online.
 */
export const loginPlayer = async (username: string): Promise<Player | null> => {
  try {
    // 1. Upsert player
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .upsert({ username }, { onConflict: 'username' })
      .select()
      .single();

    if (playerError) {
      console.error('Error logging in:', playerError);
      return null;
    }

    if (!playerData) return null;

    // 2. Set presence to online
    const { error: presenceError } = await supabase
      .from('player_presence')
      .upsert({ 
        player_id: playerData.id, 
        is_online: true 
      });

    if (presenceError) {
      console.error('Error setting presence:', presenceError);
    }

    // 3. Emit JOIN event
    await supabase.from('player_events').insert({
      player_id: playerData.id,
      type: 'JOIN',
      payload: { username: playerData.username }
    });

    return playerData as Player;

  } catch (err) {
    console.error('Unexpected login error:', err);
    return null;
  }
};

/**
 * Sets player presence to offline and emits leave event.
 */
export const logoutPlayer = async (playerId: string) => {
  try {
    await supabase
      .from('player_presence')
      .upsert({ player_id: playerId, is_online: false });
    
    await supabase.from('player_events').insert({
      player_id: playerId,
      type: 'LEAVE',
      payload: {}
    });
  } catch (err) {
    console.error('Error logging out:', err);
  }
};

/**
 * Sends a chat message.
 */
export const sendChatMessage = async (playerId: string, username: string, message: string) => {
  const { error } = await supabase.from('chat_messages').insert({
    player_id: playerId,
    username,
    message
  });
  if (error) console.error('Error sending message:', error);
};
