/**
 * RaceHUD.js — In-race overlay: live depth leaderboard + elimination alerts.
 *
 * Drawn on top of the game canvas during multiplayer racing state.
 * Shows each diver's rank, name, depth, and alive/dead status.
 */

const ALERT_DURATION = 3; // seconds to show elimination alerts

export default class RaceHUD {
  constructor() {
    this.leaderboard = [];
    this.alerts = []; // { text, timer }
    this.raceTime = 0;
  }

  // ── Data setters ──────────────────────────────────────

  updateLeaderboard(entries) {
    this.leaderboard = entries;
  }

  addAlert(text) {
    this.alerts.push({ text, timer: ALERT_DURATION });
  }

  update(dt) {
    this.raceTime += dt;

    // Tick alert timers
    for (let i = this.alerts.length - 1; i >= 0; i--) {
      this.alerts[i].timer -= dt;
      if (this.alerts[i].timer <= 0) {
        this.alerts.splice(i, 1);
      }
    }
  }

  reset() {
    this.leaderboard = [];
    this.alerts = [];
    this.raceTime = 0;
  }

  // ── Draw ──────────────────────────────────────────────

  draw(ctx, width, height, localPlayerName) {
    this._drawLeaderboard(ctx, width, localPlayerName);
    this._drawAlerts(ctx, width, height);
    this._drawRaceTimer(ctx, width);
  }

  // ── Leaderboard panel (top-right) ─────────────────────

  _drawLeaderboard(ctx, canvasWidth, localPlayerName) {
    if (this.leaderboard.length === 0) return;

    const panelW = 160;
    const rowH = 22;
    const panelH = 28 + this.leaderboard.length * rowH + 8;
    const px = canvasWidth - panelW - 12;
    const py = 12;

    ctx.save();

    // Panel background
    ctx.fillStyle = 'rgba(2, 12, 28, 0.7)';
    ctx.beginPath();
    ctx.roundRect(px, py, panelW, panelH, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Header
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = 'rgba(150, 210, 240, 0.6)';
    ctx.fillText('RACE', px + 10, py + 14);

    ctx.textAlign = 'right';
    ctx.fillText('DEPTH', px + panelW - 10, py + 14);

    // Rows
    ctx.textBaseline = 'middle';
    let y = py + 30;

    for (const entry of this.leaderboard) {
      const isLocal = entry.name === localPlayerName;
      const dead = !entry.alive;

      // Highlight row for local player
      if (isLocal) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.fillRect(px + 4, y - rowH / 2, panelW - 8, rowH);
      }

      // Rank
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = dead
        ? 'rgba(255, 100, 100, 0.5)'
        : isLocal
          ? '#38bdf8'
          : '#f7fdff';

      const rankIcon = entry.rank === 1 ? '▸' : ' ';
      const nameDisplay = dead ? `☠ ${entry.name}` : `${rankIcon} ${entry.name}`;
      ctx.fillText(nameDisplay, px + 8, y);

      // Depth
      ctx.textAlign = 'right';
      ctx.font = '11px monospace';
      ctx.fillStyle = dead
        ? 'rgba(255, 100, 100, 0.4)'
        : 'rgba(200, 230, 255, 0.8)';
      ctx.fillText(`${entry.depth}m`, px + panelW - 10, y);

      y += rowH;
    }

    ctx.restore();
  }

  // ── Elimination alerts (center) ───────────────────────

  _drawAlerts(ctx, width, height) {
    if (this.alerts.length === 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let y = height * 0.35;

    for (const alert of this.alerts) {
      // Fade out in last second
      const alpha = Math.min(alert.timer, 1);

      ctx.globalAlpha = alpha * 0.85;
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ff6b6b';
      ctx.shadowColor = 'rgba(255, 60, 60, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText(alert.text, width / 2, y);
      ctx.shadowBlur = 0;

      y += 24;
    }

    ctx.restore();
  }

  // ── Race timer (top-center) ───────────────────────────

  _drawRaceTimer(ctx, width) {
    const mins = Math.floor(this.raceTime / 60);
    const secs = Math.floor(this.raceTime % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(150, 210, 240, 0.45)';
    ctx.fillText(timeStr, width / 2, 14);
    ctx.restore();
  }
}
