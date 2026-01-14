export interface Player {
  id: string;
  username: string;
  created_at?: string;
  last_seen?: string;
}

export interface PlayerPresence {
  player_id: string;
  is_online: boolean;
  updated_at?: string;
}

export interface ChatMessage {
  id?: string;
  player_id: string;
  username: string;
  message: string;
  created_at: string;
}

export interface PlayerEvent {
  id?: string;
  player_id: string;
  type: 'JOIN' | 'LEAVE' | 'SYSTEM';
  payload: any;
  created_at: string;
}

// WebSocket types
export interface WSPlayerState {
  id: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  color?: string;
  username?: string;
}

export interface WSMessage {
  type: string;
  payload: any;
}

export interface LocalPlayerState {
  id: string;
  username: string;
  color: string;
}
