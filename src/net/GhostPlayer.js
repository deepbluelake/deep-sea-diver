/**
 * GhostPlayer.js — Renders other players as semi-transparent ghost divers.
 *
 * Each ghost smoothly interpolates toward its latest network position
 * so movement doesn't look jerky despite only receiving updates ~20/s.
 */

const GHOST_COLORS = ['#30f2ff', '#ff54d2', '#ffd84a', '#9dff57', '#ff7f6e', '#b388ff'];
const LERP_SPEED = 10; // Higher = snappier catch-up

export default class GhostPlayer {
  constructor(id, name, colorIndex) {
    this.id = id;
    this.name = name;
    this.color = GHOST_COLORS[colorIndex % GHOST_COLORS.length];

    // Current rendered position (smoothed)
    this.x = 0;
    this.depth = 0;

    // Target from network
    this.targetX = 0;
    this.targetDepth = 0;

    this.alive = true;
    this.oxygen = 100;
    this.health = 3;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  // ── Update from network data ──────────────────────────

  setTarget(data) {
    this.targetX = data.x ?? this.targetX;
    this.targetDepth = data.depth ?? this.targetDepth;
    this.oxygen = data.oxygen ?? this.oxygen;
    this.health = data.health ?? this.health;

    if (data.health <= 0) {
      this.alive = false;
    }
  }

  // ── Interpolate toward target each frame ──────────────

  update(dt) {
    this.bobPhase += dt * 3;

    // Lerp position toward network target
    this.x += (this.targetX - this.x) * LERP_SPEED * dt;
    this.depth += (this.targetDepth - this.depth) * LERP_SPEED * dt;
  }

  // ── Draw ghost diver ──────────────────────────────────

  draw(ctx, cameraY, screenHeight) {
    if (!this.alive) return;

    // Convert depth to screen Y relative to the local camera
    // Ghost depth is in meters; world Y = depth * 10 + startY
    // But we just show them at a relative vertical position
    const screenY = (this.depth * 10) - cameraY;

    // Don't draw if off-screen
    if (screenY < -80 || screenY > screenHeight + 80) return;

    const bob = Math.sin(this.bobPhase) * 3;

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.translate(this.x, screenY + bob);

    // Body glow
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 32);
    glow.addColorStop(0, this.color + '55');
    glow.addColorStop(1, this.color + '00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();

    // Body oval
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 3, 10, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -16, 7, 0, Math.PI * 2);
    ctx.fill();

    // Flippers
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.lineTo(-22, 21);
    ctx.lineTo(-11, 25);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(8, 12);
    ctx.lineTo(22, 21);
    ctx.lineTo(11, 25);
    ctx.closePath();
    ctx.fill();

    // Name tag above head
    ctx.globalAlpha = 0.6;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.name, 0, -28);

    ctx.restore();
  }
}
