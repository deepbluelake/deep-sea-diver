/**
 * PauseMenu — glass-style pause overlay
 * Separate module from Game to keep concerns clean.
 */
export default class PauseMenu {
  constructor(game) {
    this.game = game;
  }

  draw(ctx, width, height) {
    ctx.save();

    // ── Dark backdrop ──
    ctx.fillStyle = 'rgba(2, 12, 22, 0.55)';
    ctx.fillRect(0, 0, width, height);

    // ── Glass panel ──
    const panelW = Math.min(340, width - 48);
    const panelH = 320;
    const px = (width - panelW) / 2;
    const py = (height - panelH) / 2;

    // Frosted glass rectangle
    ctx.fillStyle = 'rgba(16, 42, 66, 0.45)';
    ctx.strokeStyle = 'rgba(180, 230, 255, 0.18)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, px, py, panelW, panelH, 14);
    ctx.fill();
    ctx.stroke();

    // Inner glow border
    ctx.strokeStyle = 'rgba(140, 220, 255, 0.08)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, px + 2, py + 2, panelW - 4, panelH - 4, 12);
    ctx.stroke();

    // ── Content ──
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = width / 2;

    // Title
    ctx.shadowColor = 'rgba(0, 200, 255, 0.5)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#e8fbff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('PAUSED', cx, py + 42);
    ctx.shadowBlur = 0;

    // Thin separator
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 24, py + 68);
    ctx.lineTo(px + panelW - 24, py + 68);
    ctx.stroke();

    // ── Score / Depth ──
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(200, 240, 255, 0.85)';
    const depth = Math.floor(this.game.player.depth);
    const score = this.game.player.score;
    ctx.fillText(`Depth  ${depth}m   |   Score  ${score}`, cx, py + 92);

    // Lives
    ctx.fillText(`Lives  ${'o'.repeat(this.game.player.health)}${'x'.repeat(3 - this.game.player.health)}`, cx, py + 116);

    // ── Controls ──
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(px + 24, py + 140);
    ctx.lineTo(px + panelW - 24, py + 140);
    ctx.stroke();

    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(170, 220, 240, 0.7)';
    ctx.textAlign = 'left';
    const lx = px + 30;
    ctx.fillText('WASD / Arrows', lx, py + 164);
    ctx.fillText('P', lx, py + 184);
    ctx.fillText('R', lx, py + 204);
    ctx.fillText('`  (backtick)', lx, py + 224);

    ctx.textAlign = 'right';
    const rx = px + panelW - 30;
    ctx.fillText('Swim', rx, py + 164);
    ctx.fillText('Pause / Resume', rx, py + 184);
    ctx.fillText('Restart (game over)', rx, py + 204);
    ctx.fillText('Debug HUD', rx, py + 224);

    // ── Rules ──
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.15)';
    ctx.textAlign = 'center';
    ctx.beginPath();
    ctx.moveTo(px + 24, py + 246);
    ctx.lineTo(px + panelW - 24, py + 246);
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(160, 210, 230, 0.55)';
    ctx.fillText('Collect glowfish for O2 & points', cx, py + 266);
    ctx.fillText('Avoid jellyfish & anglerfish', cx, py + 282);

    // ── Resume hint (pulsing) ──
    const pulse = 0.45 + Math.sin(performance.now() * 0.004) * 0.35 + 0.2;
    ctx.globalAlpha = pulse;
    ctx.font = '13px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Press P to resume', cx, py + panelH - 16);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  /** Canvas 2D rounded-rect helper (draws path, doesn't fill/stroke). */
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
