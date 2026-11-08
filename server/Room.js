const ROOM_STATES = {
  LOBBY: 'lobby',
  COUNTDOWN: 'countdown',
  RACING: 'racing',
  FINISHED: 'finished',
};

const COUNTDOWN_SECONDS = 3;
const MAX_PLAYERS = 6;

export default class Room {
  constructor(code, hostId, hostName) {
    this.code = code;
    this.state = ROOM_STATES.LOBBY;
    this.hostId = hostId;
    this.players = new Map();
    this.countdownTimer = 0;
    this.raceStartTime = 0;
    this.finishOrder = [];

    this.addPlayer(hostId, hostName);
  }

  // ── Player management ─────────────────────────────────

  addPlayer(id, name) {
    if (this.players.size >= MAX_PLAYERS) return { ok: false, reason: 'Room is full' };
    if (this.state !== ROOM_STATES.LOBBY) return { ok: false, reason: 'Race already started' };

    // Block duplicate names (case-insensitive)
    const lowerName = name.toLowerCase();
    for (const p of this.players.values()) {
      if (p.name.toLowerCase() === lowerName) {
        return { ok: false, reason: 'Name already taken in this room' };
      }
    }

    this.players.set(id, {
      id,
      name,
      depth: 0,
      score: 0,
      oxygen: 100,
      health: 3,
      alive: true,
      x: 0,
      ready: false,
    });

    return { ok: true };
  }

  removePlayer(id) {
    this.players.delete(id);

    // Transfer host if host left
    if (id === this.hostId && this.players.size > 0) {
      this.hostId = this.players.keys().next().value;
    }

    // If racing and only one player left alive, end race
    if (this.state === ROOM_STATES.RACING) {
      this.checkRaceEnd();
    }
  }

  isEmpty() {
    return this.players.size === 0;
  }

  // ── State transitions ─────────────────────────────────

  startCountdown() {
    if (this.state !== ROOM_STATES.LOBBY) return false;
    if (this.players.size < 2) return false;

    this.state = ROOM_STATES.COUNTDOWN;
    this.countdownTimer = COUNTDOWN_SECONDS;
    return true;
  }

  tickCountdown(dt) {
    if (this.state !== ROOM_STATES.COUNTDOWN) return null;

    this.countdownTimer -= dt;

    if (this.countdownTimer <= 0) {
      this.state = ROOM_STATES.RACING;
      this.raceStartTime = Date.now();
      this.finishOrder = [];

      // Reset all players for race start
      for (const player of this.players.values()) {
        player.depth = 0;
        player.score = 0;
        player.oxygen = 100;
        player.health = 3;
        player.alive = true;
      }

      return 'start';
    }

    return Math.ceil(this.countdownTimer);
  }

  // ── Race updates ──────────────────────────────────────

  updatePlayerState(id, data) {
    const player = this.players.get(id);
    if (!player) return;

    player.x = data.x ?? player.x;
    player.depth = data.depth ?? player.depth;
    player.score = data.score ?? player.score;
    player.oxygen = data.oxygen ?? player.oxygen;
    player.health = data.health ?? player.health;

    // Player just died
    if (data.health <= 0 && player.alive) {
      player.alive = false;
      this.finishOrder.push({
        id,
        name: player.name,
        depth: player.depth,
        score: player.score,
      });
      this.checkRaceEnd();
    }
  }

  checkRaceEnd() {
    const alivePlayers = [...this.players.values()].filter((p) => p.alive);

    if (alivePlayers.length <= 1) {
      // Add the last survivor to finish order (they won)
      if (alivePlayers.length === 1) {
        const winner = alivePlayers[0];
        this.finishOrder.unshift({
          id: winner.id,
          name: winner.name,
          depth: winner.depth,
          score: winner.score,
          winner: true,
        });
      }

      this.state = ROOM_STATES.FINISHED;
      return true;
    }

    return false;
  }

  // ── Serialization ─────────────────────────────────────

  getPlayerList() {
    return [...this.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      depth: p.depth,
      score: p.score,
      oxygen: p.oxygen,
      health: p.health,
      alive: p.alive,
      x: p.x,
    }));
  }

  getLeaderboard() {
    return [...this.players.values()]
      .sort((a, b) => b.depth - a.depth)
      .map((p, i) => ({
        rank: i + 1,
        name: p.name,
        depth: Math.floor(p.depth),
        alive: p.alive,
      }));
  }

  getResults() {
    return {
      finishOrder: this.finishOrder,
      duration: Math.floor((Date.now() - this.raceStartTime) / 1000),
    };
  }
}

export { ROOM_STATES };
