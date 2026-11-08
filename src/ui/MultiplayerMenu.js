/**
 * MultiplayerMenu.js — Canvas-drawn UI for multiplayer lobby.
 *
 * Screens: 'main' (create/join), 'create' (waiting for players),
 * 'join' (enter code), 'lobby' (room with player list), 'countdown',
 * 'results' (post-race scoreboard).
 */

export default class MultiplayerMenu {
  constructor(game) {
    this.game = game;
    this.screen = 'main'; // main | join | lobby | countdown | results
    this.playerName = '';
    this.roomCode = '';
    this.joinCode = '';
    this.error = '';
    this.players = [];
    this.hostId = null;
    this.countdownNumber = 3;
    this.results = null;
    this.inputActive = 'name'; // 'name' | 'code'
    this.connecting = false;

    this._codeCopied = false;
    this._copyTimer = null;

    /** @type {{ x: number, y: number, w: number, h: number, action: Function }[]} */
    this._buttonRects = [];

    this._setupKeyboardInput();
  }

  // ── Keyboard input for text fields ────────────────────

  _setupKeyboardInput() {
    window.addEventListener('keydown', (e) => {
      if (this.game.state !== 'multiplayer') return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (this.inputActive === 'name') {
          this.playerName = this.playerName.slice(0, -1);
        } else if (this.inputActive === 'code') {
          this.joinCode = this.joinCode.slice(0, -1);
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (this.screen === 'join') {
          this.inputActive = this.inputActive === 'name' ? 'code' : 'name';
        }
        return;
      }

      if (e.key === 'Escape') {
        this.handleBack();
        return;
      }

      if (e.key === 'Enter') {
        this.handleEnter();
        return;
      }

      // Printable character
      if (e.key.length === 1) {
        if (this.inputActive === 'name' && this.playerName.length < 12) {
          this.playerName += e.key;
        } else if (this.inputActive === 'code' && this.joinCode.length < 5) {
          this.joinCode += e.key.toUpperCase();
        }
      }
    });
  }

  handleEnter() {
    if (this.connecting) return;

    if (this.screen === 'main') {
      // Do nothing, need to pick create or join via number keys
      return;
    }

    if (this.screen === 'join') {
      if (this.playerName.trim() && this.joinCode.trim().length === 5) {
        this.connecting = true;
        this.error = '';
        this.game.joinMultiplayerRoom(this.joinCode, this.playerName.trim());
      } else {
        this.error = this.playerName.trim() ? 'Enter a 5-letter room code' : 'Enter your diver name';
      }
    }

    if (this.screen === 'lobby' && this.game.client?.isHost && this.players.length >= 2) {
      this.game.client.startRace();
    }

    if (this.screen === 'results' && this.game.client?.isHost) {
      this.game.client.returnToLobby();
    }
  }

  handleBack() {
    if (this.screen === 'join' || this.screen === 'lobby') {
      this.game.leaveMultiplayer();
      this.screen = 'main';
      this.error = '';
      this.connecting = false;
    } else if (this.screen === 'main') {
      this.game.state = 'title';
      this.game.titleTime = 0;
    } else if (this.screen === 'results') {
      if (this.game.client?.isHost) {
        this.game.client.returnToLobby();
      }
    }
  }

  // ── Click handling ────────────────────────────────────

  handleClick(x, y) {
    // Check all tracked button rects (populated by _drawButton during last frame)
    for (const btn of this._buttonRects) {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        btn.action();
        return;
      }
    }

    // Input field focus handling
    const cx = this.game.width / 2;
    const cy = this.game.height / 2;

    if (this.screen === 'main') {
      // Name input field (drawn at cy - 55, height 28)
      if (y > cy - 69 && y < cy - 41) {
        this.inputActive = 'name';
      }
    }

    if (this.screen === 'join') {
      // Name field (drawn at cy - 65, height 28)
      if (y > cy - 79 && y < cy - 51) this.inputActive = 'name';
      // Code field (drawn at cy, height 28)
      if (y > cy - 14 && y < cy + 14) this.inputActive = 'code';
    }
  }

  // ── Draw ──────────────────────────────────────────────

  draw(ctx, width, height) {
    this._buttonRects = [];

    ctx.save();

    // Layered ocean backdrop
    this._drawBackdrop(ctx, width, height);

    // Framed card behind the centered input screens
    if (this.screen === 'main' || this.screen === 'join') {
      this._drawCard(ctx, width, height);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    switch (this.screen) {
      case 'main':
        this._drawMainScreen(ctx, width, height);
        break;
      case 'join':
        this._drawJoinScreen(ctx, width, height);
        break;
      case 'lobby':
        this._drawLobbyScreen(ctx, width, height);
        break;
      case 'countdown':
        this._drawCountdown(ctx, width, height);
        break;
      case 'results':
        this._drawResults(ctx, width, height);
        break;
    }

    ctx.restore();
  }

  // ── Main screen: name + create/join ───────────────────

  _drawMainScreen(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;

    // Title
    ctx.shadowColor = 'rgba(0, 200, 255, 0.6)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f7fdff';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('MULTIPLAYER', cx, cy - 140);

    ctx.shadowBlur = 8;
    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(180, 230, 255, 0.7)';
    ctx.fillText('Race with your friends to the depths', cx, cy - 105);

    // Name input
    ctx.shadowBlur = 0;
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(150, 210, 240, 0.6)';
    ctx.fillText('DIVER NAME', cx, cy - 75);

    this._drawInputField(ctx, cx, cy - 55, 220, this.playerName, this.inputActive === 'name', 'Enter name...');

    // Create Room button
    this._drawButton(ctx, cx, cy + 25, 240, 36, 'CREATE ROOM', '#0c4a6e', '#38bdf8', () => {
      if (this.playerName.trim()) {
        this.connecting = true;
        this.error = '';
        this.game.createMultiplayerRoom(this.playerName.trim());
      } else {
        this.error = 'Enter your diver name first';
      }
    });

    // Join Room button
    this._drawButton(ctx, cx, cy + 80, 240, 36, 'JOIN ROOM', '#164e63', '#22d3ee', () => {
      if (this.playerName.trim()) {
        this.screen = 'join';
        this.inputActive = 'code';
        this.connecting = false;
        this.error = '';
      } else {
        this.error = 'Enter your diver name first';
      }
    });

    // Error
    if (this.error) {
      ctx.font = '11px monospace';
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText(this.error, cx, cy + 130);
    }

    // Back hint
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(150, 200, 230, 0.35)';
    ctx.fillText('ESC to go back', cx, h - 30);
  }

  // ── Join screen: name + code input ────────────────────

  _drawJoinScreen(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;

    ctx.shadowColor = 'rgba(0, 200, 255, 0.6)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f7fdff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('JOIN ROOM', cx, cy - 130);
    ctx.shadowBlur = 0;

    // Name field
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(150, 210, 240, 0.6)';
    ctx.fillText('DIVER NAME', cx, cy - 85);
    this._drawInputField(ctx, cx, cy - 65, 220, this.playerName, this.inputActive === 'name', 'Enter name...');

    // Code field
    ctx.fillStyle = 'rgba(150, 210, 240, 0.6)';
    ctx.fillText('ROOM CODE', cx, cy - 20);
    this._drawInputField(ctx, cx, cy, 180, this.joinCode, this.inputActive === 'code', 'XXXXX');

    // Join button
    this._drawButton(ctx, cx, cy + 60, 200, 36, this.connecting ? 'JOINING...' : 'JOIN', '#164e63', '#22d3ee', () => {
      if (this.connecting) return;
      if (this.playerName.trim() && this.joinCode.trim().length === 5) {
        this.connecting = true;
        this.error = '';
        this.game.joinMultiplayerRoom(this.joinCode, this.playerName.trim());
      } else {
        this.error = this.playerName.trim() ? 'Enter a 5-letter room code' : 'Enter your diver name';
      }
    });

    // Error
    if (this.error) {
      ctx.font = '11px monospace';
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText(this.error, cx, cy + 110);
    }

    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(150, 200, 230, 0.35)';
    ctx.fillText('ESC to go back  |  TAB to switch fields', cx, h - 30);
  }

  // ── Lobby: player list + start button ─────────────────

  _drawLobbyScreen(ctx, w, h) {
    const cx = w / 2;
    let y = 80;

    ctx.shadowColor = 'rgba(0, 200, 255, 0.6)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f7fdff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('ROOM', cx, y);
    ctx.shadowBlur = 0;

    // Room code
    y += 40;
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.letterSpacing = '6px';
    ctx.fillText(this.roomCode, cx, y);
    ctx.letterSpacing = '0px';

    // Copy button
    y += 28;
    const copyLabel = this._codeCopied ? '✓ Copied!' : '⧉ Copy Code';
    const copyFont = '12px monospace';
    ctx.font = copyFont;
    const copyW = ctx.measureText(copyLabel).width + 24;
    const copyH = 26;
    const copyX = cx - copyW / 2;
    const copyY = y - copyH / 2;

    ctx.save();
    if (this._codeCopied) {
      ctx.fillStyle = 'rgba(52, 211, 153, 0.18)';
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
    } else {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    }
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(copyX, copyY, copyW, copyH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = copyFont;
    ctx.fillStyle = this._codeCopied ? '#34d399' : 'rgba(150, 210, 240, 0.7)';
    ctx.fillText(copyLabel, cx, y);
    ctx.restore();

    // Register copy button hitbox
    this._buttonRects.push({
      x: copyX, y: copyY, w: copyW, h: copyH,
      action: () => {
        if (this.roomCode && navigator.clipboard) {
          navigator.clipboard.writeText(this.roomCode).then(() => {
            this._codeCopied = true;
            clearTimeout(this._copyTimer);
            this._copyTimer = setTimeout(() => { this._codeCopied = false; }, 2000);
          });
        }
      },
    });

    // Player list
    y += 40;
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(150, 210, 240, 0.6)';
    ctx.fillText(`DIVERS (${this.players.length}/6)`, cx, y);

    y += 20;
    for (const player of this.players) {
      const isHost = player.id === this.hostId;
      const isYou = player.id === this.game.client?.playerId;

      ctx.font = '14px monospace';
      ctx.fillStyle = isYou ? '#38bdf8' : '#f7fdff';
      const label = player.name + (isHost ? ' ★' : '') + (isYou ? ' (you)' : '');
      ctx.fillText(label, cx, y);
      y += 26;
    }

    // Start button (host only)
    const isHost = this.game.client?.isHost;
    y = Math.max(y + 20, h - 120);

    if (isHost) {
      if (this.players.length >= 2) {
        this._drawButton(ctx, cx, y, 240, 40, 'START RACE', '#065f46', '#34d399', () => {
          this.game.client?.startRace();
        });
      } else {
        ctx.font = '12px monospace';
        ctx.fillStyle = 'rgba(150, 210, 240, 0.45)';
        ctx.fillText('Waiting for more divers...', cx, y);
      }
    } else {
      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(150, 210, 240, 0.45)';
      ctx.fillText('Waiting for host to start...', cx, y);
    }

    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(150, 200, 230, 0.35)';
    ctx.fillText('ESC to leave room', cx, h - 30);
  }

  // ── Countdown ─────────────────────────────────────────

  _drawCountdown(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;

    ctx.shadowColor = 'rgba(0, 220, 255, 0.8)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#f7fdff';
    ctx.font = 'bold 96px monospace';
    ctx.fillText(this.countdownNumber, cx, cy);

    ctx.shadowBlur = 10;
    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(200, 240, 255, 0.7)';
    ctx.fillText('Get ready to dive!', cx, cy + 70);
  }

  // ── Results ───────────────────────────────────────────

  _drawResults(ctx, w, h) {
    const cx = w / 2;
    let y = 80;

    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffd84a';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('RACE OVER', cx, y);
    ctx.shadowBlur = 0;

    if (!this.results) return;

    y += 50;
    const medals = ['🥇', '🥈', '🥉'];

    for (let i = 0; i < this.results.finishOrder.length; i++) {
      const entry = this.results.finishOrder[i];
      const medal = medals[i] || `#${i + 1}`;
      const isWinner = entry.winner;

      ctx.font = isWinner ? 'bold 16px monospace' : '14px monospace';
      ctx.fillStyle = isWinner ? '#ffd84a' : '#f7fdff';
      ctx.fillText(
        `${medal}  ${entry.name}  —  ${Math.floor(entry.depth)}m  (${entry.score} pts)`,
        cx, y
      );
      y += 30;
    }

    y += 20;
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(150, 210, 240, 0.5)';
    ctx.fillText(`Race lasted ${this.results.duration}s`, cx, y);

    // Buttons
    y += 50;
    if (this.game.client?.isHost) {
      this._drawButton(ctx, cx, y, 240, 36, 'BACK TO LOBBY', '#0c4a6e', '#38bdf8', () => {
        this.game.client?.returnToLobby();
      });
    } else {
      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(150, 210, 240, 0.45)';
      ctx.fillText('Waiting for host...', cx, y);
    }
  }

  // ── Backdrop & card ───────────────────────────────────

  _drawBackdrop(ctx, w, h) {
    // Deep-ocean vertical gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(7, 30, 52, 0.92)');
    grad.addColorStop(0.5, 'rgba(4, 18, 36, 0.94)');
    grad.addColorStop(1, 'rgba(1, 8, 20, 0.96)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft central glow — a light from above
    const glow = ctx.createRadialGradient(w / 2, h * 0.40, 0, w / 2, h * 0.40, Math.max(w, h) * 0.55);
    glow.addColorStop(0, 'rgba(34, 120, 164, 0.22)');
    glow.addColorStop(0.55, 'rgba(22, 78, 120, 0.08)');
    glow.addColorStop(1, 'rgba(10, 40, 70, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Drifting bubbles for life
    const t = this.game.titleTime || 0;
    for (let i = 0; i < 16; i++) {
      const bx = ((i * 137.5) % 100) / 100 * w;
      const speed = 10 + (i % 5) * 7;
      const by = h - (((t * speed) + i * 73) % (h + 60)) + 30;
      const r = 1.5 + (i % 4) * 0.8;
      const wobble = Math.sin(t * 1.2 + i) * 6;
      ctx.fillStyle = `rgba(150, 215, 245, ${0.04 + (i % 3) * 0.025})`;
      ctx.beginPath();
      ctx.arc(bx + wobble, by, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Edge vignette for focus
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.34, w / 2, h / 2, Math.max(w, h) * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 3, 10, 0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  _drawCard(ctx, w, h) {
    const cardW = 380;
    const cardH = 384;
    const cx = w / 2;
    const cy = h / 2;
    const x = cx - cardW / 2;
    const y = cy - cardH / 2;

    ctx.save();

    // Drop glow
    ctx.shadowColor = 'rgba(0, 130, 190, 0.35)';
    ctx.shadowBlur = 44;

    // Frosted panel
    const g = ctx.createLinearGradient(x, y, x, y + cardH);
    g.addColorStop(0, 'rgba(16, 44, 72, 0.6)');
    g.addColorStop(1, 'rgba(8, 26, 48, 0.6)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, cardH, 18);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Rim light
    ctx.strokeStyle = 'rgba(96, 196, 244, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top highlight sheen
    const sheen = ctx.createLinearGradient(x, y, x, y + 60);
    sheen.addColorStop(0, 'rgba(180, 230, 255, 0.10)');
    sheen.addColorStop(1, 'rgba(180, 230, 255, 0)');
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, cardW - 2, 60, [17, 17, 0, 0]);
    ctx.fill();

    ctx.restore();
  }

  // ── Shared drawing helpers ────────────────────────────

  _drawInputField(ctx, x, y, fieldWidth, value, active, placeholder) {
    const halfW = fieldWidth / 2;

    ctx.save();

    // Active glow
    if (active) {
      ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
      ctx.shadowBlur = 12;
    }

    // Background
    ctx.fillStyle = active ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = active ? '#5fd0ff' : 'rgba(150, 210, 240, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - halfW, y - 14, fieldWidth, 28, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Text
    ctx.font = '14px monospace';
    if (value) {
      ctx.fillStyle = '#f7fdff';
      ctx.fillText(value + (active ? '|' : ''), x, y);
    } else {
      ctx.fillStyle = 'rgba(150, 210, 240, 0.3)';
      ctx.fillText(placeholder, x, y);
    }

    ctx.restore();
  }

  _drawButton(ctx, x, y, bw, bh, label, bgColor, accent, action) {
    const rx = x - bw / 2;
    const ry = y - bh / 2;

    ctx.save();

    // Soft colored glow
    ctx.shadowColor = accent;
    ctx.shadowBlur = 14;

    // Button fill
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(rx, ry, bw, bh, 10);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Top sheen
    const sheen = ctx.createLinearGradient(rx, ry, rx, ry + bh);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.roundRect(rx, ry, bw, bh, 10);
    ctx.fill();

    // Accent border
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(rx, ry, bw, bh, 10);
    ctx.stroke();

    // Label — bright with accent glow for contrast
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6;
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#eefaff';
    ctx.fillText(label, x, y);

    ctx.restore();

    // Store clickable rect for handleClick()
    if (action) {
      this._buttonRects.push({
        x: rx,
        y: ry,
        w: bw,
        h: bh,
        action,
      });
    }
  }
}
