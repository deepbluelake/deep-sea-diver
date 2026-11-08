/**
 * Client.js — Socket.IO wrapper for multiplayer communication.
 *
 * Usage:
 *   import Client from './net/Client.js';
 *   const client = new Client('http://localhost:3001');
 *   client.connect();
 *   client.createRoom('PlayerName', (result) => { ... });
 */

const TICK_RATE = 50; // ms between state broadcasts

export default class Client {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.connected = false;
    this.roomCode = null;
    this.isHost = false;
    this.playerId = null;

    // Callbacks — set these from Game.js
    this.onRoomUpdate = null;
    this.onCountdownStart = null;
    this.onCountdownTick = null;
    this.onRaceStart = null;
    this.onOpponentState = null;
    this.onLeaderboard = null;
    this.onRaceEnd = null;
    this.onPlayerEliminated = null;
    this.onPlayerLeft = null;
    this.onDisconnect = null;

    this._lastSendTime = 0;
    this._tickInterval = null;

    /**
     * Set this to a function that returns the current player state object.
     * The network tick will call it independently of requestAnimationFrame,
     * so state still broadcasts even when the tab is in the background.
     */
    this.getStateSnapshot = null;
  }

  // ── Connection ────────────────────────────────────────

  async connect() {
    // Dynamically import socket.io-client from CDN
    const { io } = await import('https://cdn.jsdelivr.net/npm/socket.io-client@4.7.5/+esm');

    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.connected = true;
        this.playerId = this.socket.id;
        this._bindEvents();
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        this.connected = false;
        reject(err);
      });
    });
  }

  disconnect() {
    this.stopNetworkTick();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.roomCode = null;
    this.isHost = false;
  }

  /**
   * Start an interval-based network tick that sends state independently of RAF.
   * This ensures state still broadcasts when the browser tab is in the background
   * (setInterval throttles to ~1s in background tabs vs RAF which stops entirely).
   */
  startNetworkTick() {
    this.stopNetworkTick();
    this._tickInterval = setInterval(() => {
      if (this.getStateSnapshot) {
        this.sendState(this.getStateSnapshot());
      }
    }, TICK_RATE);
  }

  stopNetworkTick() {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  }

  // ── Room actions ──────────────────────────────────────

  createRoom(name, callback) {
    if (!this.socket) return;

    this.socket.emit('create-room', { name }, (result) => {
      if (result.success) {
        this.roomCode = result.code;
        this.isHost = true;
      }
      callback(result);
    });
  }

  joinRoom(code, name, callback) {
    if (!this.socket) return;

    this.socket.emit('join-room', { code, name }, (result) => {
      if (result.success) {
        this.roomCode = result.code;
        this.isHost = false;
      }
      callback(result);
    });
  }

  startRace() {
    if (!this.socket || !this.isHost) return;
    this.socket.emit('start-race');
  }

  returnToLobby() {
    if (!this.socket || !this.isHost) return;
    this.socket.emit('return-to-lobby');
  }

  // ── Game state broadcasting ───────────────────────────

  sendState(playerData) {
    if (!this.socket || !this.roomCode) return;

    const now = performance.now();
    if (now - this._lastSendTime < TICK_RATE) return;
    this._lastSendTime = now;

    this.socket.emit('player-state', {
      x: playerData.x,
      depth: playerData.depth,
      score: playerData.score,
      oxygen: playerData.oxygen,
      health: playerData.health,
    });
  }

  sendDied() {
    if (!this.socket) return;
    this.socket.emit('player-died');
  }

  // ── Event binding ─────────────────────────────────────

  _bindEvents() {
    this.socket.on('room-update', (data) => {
      if (this.onRoomUpdate) this.onRoomUpdate(data);
    });

    this.socket.on('countdown-start', () => {
      if (this.onCountdownStart) this.onCountdownStart();
    });

    this.socket.on('countdown-tick', (seconds) => {
      if (this.onCountdownTick) this.onCountdownTick(seconds);
    });

    this.socket.on('race-start', () => {
      if (this.onRaceStart) this.onRaceStart();
    });

    this.socket.on('opponent-state', (data) => {
      if (this.onOpponentState) this.onOpponentState(data);
    });

    this.socket.on('leaderboard', (data) => {
      if (this.onLeaderboard) this.onLeaderboard(data);
    });

    this.socket.on('race-end', (data) => {
      if (this.onRaceEnd) this.onRaceEnd(data);
    });

    this.socket.on('player-eliminated', (data) => {
      if (this.onPlayerEliminated) this.onPlayerEliminated(data);
    });

    this.socket.on('player-left', (data) => {
      if (this.onPlayerLeft) this.onPlayerLeft(data);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      if (this.onDisconnect) this.onDisconnect();
    });
  }
}
