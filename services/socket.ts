import { supabase } from './supabase';
import { WSPlayerState } from '../types';

type MessageHandler = (data: any) => void;

class GameSocket {
  private channel: any = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  public isConnected: boolean = false;
  private throttleTime = 50; // 50ms throttle
  private lastSentTime = 0;
  private userId: string | null = null;

  connect(playerId: string, username: string, color: string) {
    if (this.channel) return;
    this.userId = playerId;

    this.channel = supabase.channel('game_world', {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: playerId },
      },
    });

    this.channel
      .on('broadcast', { event: 'player_update' }, (payload: any) => {
        this.messageHandlers.forEach(handler => handler({
          type: 'player_update',
          payload: payload.payload
        }));
      })
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel.presenceState();
        // Convert presence state to list of IDs if needed, 
        // but mostly we just need to know who is online to filter remotePlayers
        this.messageHandlers.forEach(handler => handler({
          type: 'presence_sync',
          payload: state
        }));
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to Supabase Realtime');
          this.isConnected = true;
          
          // Track presence
          await this.channel.track({
            online_at: new Date().toISOString(),
            username,
            color
          });

          // Announce self immediately
          this.sendMovement({ id: playerId, username, color, x: 0, y: 1, z: 0, rotation: 0 });
        }
      });
  }

  sendMovement(state: Partial<WSPlayerState>) {
    const now = Date.now();
    if (now - this.lastSentTime < this.throttleTime) return;
    
    if (this.channel && this.isConnected) {
      this.channel.send({
        type: 'broadcast',
        event: 'player_update',
        payload: { ...state, id: this.userId }
      });
      this.lastSentTime = now;
    }
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.isConnected = false;
    }
  }
}

export const gameSocket = new GameSocket();
