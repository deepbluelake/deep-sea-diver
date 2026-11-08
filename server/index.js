import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { customAlphabet } from 'nanoid';
import Room, { ROOM_STATES } from './Room.js';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

// ── Room storage ──────────────────────────────────────

const rooms = new Map();
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    players: [...rooms.values()].reduce((sum, r) => sum + r.players.size, 0),
  });
});

// ── Socket handlers ─────────────────────────────────

io.on('connection', (socket) => {
  let currentRoom = null;

  // Create a new room
  socket.on('create-room', ({ name }, callback) => {
    if (currentRoom) leaveRoom(socket);

    const code = generateCode();
    const room = new Room(code, socket.id, name);
    rooms.set(code, room);
    currentRoom = code;

    socket.join(code);
    callback({ success: true, code, isHost: true });
    io.to(code).emit('room-update', {
      players: room.getPlayerList(),
      hostId: room.hostId,
      state: room.state,
    });
  });

  // Join an existing room
  socket.on('join-room', ({ code, name }, callback) => {
    if (currentRoom) leaveRoom(socket);

    const upperCode = code.toUpperCase();
    const room = rooms.get(upperCode);

    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    const addResult = room.addPlayer(socket.id, name);
    if (!addResult.ok) {
      callback({ success: false, error: addResult.reason });
      return;
    }

    currentRoom = upperCode;
    socket.join(upperCode);
    callback({ success: true, code: upperCode, isHost: false });
    io.to(upperCode).emit('room-update', {
      players: room.getPlayerList(),
      hostId: room.hostId,
      state: room.state,
    });
  });

  // Host starts the race
  socket.on('start-race', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;

    if (room.startCountdown()) {
      io.to(currentRoom).emit('countdown-start');

      // Run countdown on the server
      const interval = setInterval(() => {
        const result = room.tickCountdown(0.1);

        if (result === 'start') {
          clearInterval(interval);
          io.to(currentRoom).emit('race-start');
        } else if (typeof result === 'number') {
          io.to(currentRoom).emit('countdown-tick', result);
        }
      }, 100);
    }
  });

  // Player sends their game state during race
  socket.on('player-state', (data) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.state !== ROOM_STATES.RACING) return;

    room.updatePlayerState(socket.id, data);

    // Broadcast this player's state to others in the room
    socket.to(currentRoom).emit('opponent-state', {
      id: socket.id,
      ...data,
    });

    // Send leaderboard to all
    io.to(currentRoom).emit('leaderboard', room.getLeaderboard());

    // Check if race ended
    if (room.state === ROOM_STATES.FINISHED) {
      io.to(currentRoom).emit('race-end', room.getResults());
    }
  });

  // Player died
  socket.on('player-died', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    room.updatePlayerState(socket.id, { health: 0 });
    io.to(currentRoom).emit('player-eliminated', {
      id: socket.id,
      name: room.players.get(socket.id)?.name,
    });

    // Send updated leaderboard
    io.to(currentRoom).emit('leaderboard', room.getLeaderboard());

    if (room.state === ROOM_STATES.FINISHED) {
      io.to(currentRoom).emit('race-end', room.getResults());
    }
  });

  // Return to lobby after race
  socket.on('return-to-lobby', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;

    room.state = ROOM_STATES.LOBBY;
    room.finishOrder = [];

    for (const player of room.players.values()) {
      player.alive = true;
      player.depth = 0;
      player.score = 0;
      player.oxygen = 100;
      player.health = 3;
    }

    io.to(currentRoom).emit('room-update', {
      players: room.getPlayerList(),
      hostId: room.hostId,
      state: room.state,
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    leaveRoom(socket);
  });

  function leaveRoom(sock) {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;

    room.removePlayer(sock.id);
    sock.leave(currentRoom);

    if (room.isEmpty()) {
      rooms.delete(currentRoom);
    } else {
      io.to(currentRoom).emit('room-update', {
        players: room.getPlayerList(),
        hostId: room.hostId,
        state: room.state,
      });

      io.to(currentRoom).emit('player-left', { id: sock.id });

      // Check race end after player left
      if (room.state === ROOM_STATES.FINISHED) {
        io.to(currentRoom).emit('race-end', room.getResults());
      }
    }

    currentRoom = null;
  }
});

// ── Start server ────────────────────────────────────

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Deep Sea Diver server running on port ${PORT}`);
});
