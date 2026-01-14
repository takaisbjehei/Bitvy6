/**
 * Node.js WebSocket Server
 * Run this separately: node server/server.js
 */

const WebSocket = require('ws');
const http = require('http');

const PORT = 8080;

// Create HTTP server (optional, but good practice)
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebSocket Game Server is running');
});

const wss = new WebSocket.Server({ server });

// Game State
const players = {}; // { [id]: { x, y, z, rotation, username, color } }

wss.on('connection', (ws) => {
  let playerId = null;

  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'init') {
        // Initialize player
        playerId = data.payload.id;
        players[playerId] = {
          id: playerId,
          username: data.payload.username,
          color: data.payload.color,
          x: 0,
          y: 1,
          z: 0,
          rotation: 0
        };
        console.log(`Player joined: ${data.payload.username} (${playerId})`);
      } 
      
      else if (data.type === 'move') {
        if (playerId && players[playerId]) {
          // Update position
          players[playerId] = {
            ...players[playerId],
            ...data.payload // { x, y, z, rotation }
          };
        }
      }

    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  ws.on('close', () => {
    if (playerId) {
      console.log(`Player left: ${playerId}`);
      delete players[playerId];
    }
  });
});

// Broadcast game state loop (20 times per second)
// In a real production app, you might use geohashing or interest management
// to only send relevant data to relevant players.
setInterval(() => {
  const payload = JSON.stringify({
    type: 'state',
    payload: { players }
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}, 50); // 50ms = 20Hz

server.listen(PORT, () => {
  console.log(`Game Server running on port ${PORT}`);
});
