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
    this._drawLeaderboard(ctx, width, height, localPlayerName);
    this._drawAlerts(ctx, width, height);
  }

  // ── Leaderboard panel (bottom-left) ───────────────────

  _drawLeaderboard(ctx, canvasWidth, canvasHeight, localPlayerName) {
    if (this.leaderboard.length === 0) return;

    const panelW = 172;
    const rowH = 23;
    const headerH = 30;
    const padBottom = 10;
    const panelH = headerH + this.leaderboard.length * rowH + padBottom;
    const px = 14;
    const py = canvasHeight - panelH - 16;

    ctx.save();

    // Panel background — soft vertical gradient
    const bg = ctx.createLinearGradient(px, py, px, py + panelH);
    bg.addColorStop(0, 'rgba(8, 28, 48, 0.82)');
    bg.addColorStop(1, 'rgba(3, 14, 28, 0.82)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(px, py, panelW, panelH, 10);
    ctx.fill();

    // Subtle glowing border
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Accent bar on the left edge
    ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.beginPath();
    ctx.roundRect(px, py + 8, 3, panelH - 16, 2);
    ctx.fill();

    // Header: "RACE  m:ss"  +  "DEPTH"
    const mins = Math.floor(this.raceTime / 60);
    const secs = Math.floor(this.raceTime % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = 'rgba(150, 210, 240, 0.65)';
    ctx.fillText('RACE', px + 14, py + 15);

    ctx.fillStyle = 'rgba(125, 246, 181, 0.85)';
    ctx.fillText(timeStr, px + 50, py + 15);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(150, 210, 240, 0.5)';
    ctx.fillText('DEPTH', px + panelW - 12, py + 15);

    // Divider under header
    ctx.strokeStyle = 'rgba(120, 180, 220, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 10, py + headerH - 4);
    ctx.lineTo(px + panelW - 10, py + headerH - 4);
    ctx.stroke();

    // Rows
    ctx.textBaseline = 'middle';
    let y = py + headerH + rowH / 2;

    for (const entry of this.leaderboard) {
      const isLocal = entry.name === localPlayerName;
      const dead = !entry.alive;

      // Highlight row for local player
      if (isLocal) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.beginPath();
        ctx.roundRect(px + 6, y - rowH / 2 + 1, panelW - 12, rowH - 2, 5);
        ctx.fill();
      }

      // Name (with rank marker / skull)
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = dead
        ? 'rgba(255, 120, 120, 0.55)'
        : isLocal
          ? '#5fd0ff'
          : '#eef9ff';

      const rankIcon = entry.rank === 1 ? '▸' : ' ';
      const nameDisplay = dead ? `☠ ${entry.name}` : `${rankIcon} ${entry.name}`;
      ctx.fillText(nameDisplay, px + 12, y);

      // Depth
      ctx.textAlign = 'right';
      ctx.font = '11px monospace';
      ctx.fillStyle = dead
        ? 'rgba(255, 120, 120, 0.45)'
        : 'rgba(190, 228, 255, 0.85)';
      ctx.fillText(`${entry.depth}m`, px + panelW - 12, y);

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
}
