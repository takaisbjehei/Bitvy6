import { WS_URL } from '../constants';
import { WSPlayerState } from '../types';

type MessageHandler = (data: any) => void;

class GameSocket {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  public isConnected: boolean = false;
  private throttleTime = 50;
  private lastSentTime = 0;
  private reconnectInterval: any = null;

  connect(playerId: string, username: string, color: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    console.log(`Connecting to WebSocket at ${WS_URL}...`);
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('Connected to Game Server');
      this.isConnected = true;
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      // Send initial handshake
      this.send({
        type: 'init',
        payload: { id: playerId, username, color }
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(data));
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from Game Server');
      this.isConnected = false;
      this.ws = null;
      
      // Attempt reconnect
      if (!this.reconnectInterval) {
        this.reconnectInterval = setInterval(() => {
          console.log('Attempting to reconnect...');
          this.connect(playerId, username, color);
        }, 3000);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };
  }

  sendMovement(state: Partial<WSPlayerState>) {
    const now = Date.now();
    if (now - this.lastSentTime < this.throttleTime) return;
    
    this.send({
      type: 'move',
      payload: state
    });
    this.lastSentTime = now;
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  disconnect() {
    if (this.reconnectInterval) clearInterval(this.reconnectInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}

export const gameSocket = new GameSocket();