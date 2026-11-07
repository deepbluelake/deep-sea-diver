import Creature from './Creature.js';

/**
 * ElixirShell — rare shiny collectible that grants 6s invincibility.
 *
 * OOP: extends Creature → polymorphic onCollisionWithPlayer().
 * Visual: iridescent shell with rainbow shimmer, rotating sparkles,
 *         and a golden pulse ring.
 */

const SHIELD_DURATION = 6; // seconds of invincibility

export default class ElixirShell extends Creature {
  constructor(x, y) {
    super(x, y, {
      health: 1,
      damage: 0,
      scoreValue: 100,
      glowColor: 'rgba(255, 215, 80, 0.5)',
      glowRadius: 55,
      radius: 14,
    });

    this.type = 'collectible';
    this.baseY = y;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.time = 0;
    this.sparklePhase = 0;
  }

  update(dt) {
    this.time += dt;
    this.sparklePhase += dt * 2.5;

    // Gentle hovering bob
    this.pos.y = this.baseY + Math.sin(this.bobOffset + this.time * 1.2) * 12;
  }

  draw(ctx) {
    this.drawGlow(ctx);
    this.drawPulseRing(ctx);
    this.drawSparkles(ctx);

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    // ── Shell body — iridescent gradient ──
    const shimmer = Math.sin(this.time * 3) * 0.5 + 0.5;
    const r = Math.floor(200 + shimmer * 55);
    const g = Math.floor(160 + Math.sin(this.time * 2.3) * 60);
    const b = Math.floor(220 + Math.sin(this.time * 1.7) * 35);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

    // Shell shape — a scallop/fan
    ctx.beginPath();
    ctx.arc(0, 2, 12, Math.PI, 0);  // top dome
    ctx.lineTo(10, 2);
    ctx.quadraticCurveTo(0, 14, -10, 2);
    ctx.closePath();
    ctx.fill();

    // Shell ridges
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + shimmer * 0.2})`;
    ctx.lineWidth = 0.8;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 4, 2);
      ctx.lineTo(i * 2.5, -9);
      ctx.stroke();
    }

    // Inner highlight
    const innerGlow = ctx.createRadialGradient(0, -2, 1, 0, -2, 8);
    innerGlow.addColorStop(0, `rgba(255, 255, 220, ${0.5 + shimmer * 0.3})`);
    innerGlow.addColorStop(1, 'rgba(255, 255, 220, 0)');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(0, -2, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  onCollisionWithPlayer(player) {
    // Grant shield (invincibility without damage)
    player.shieldTimer = SHIELD_DURATION;
    player.score += this.scoreValue;
    this.alive = false;
  }

  drawPulseRing(ctx) {
    const wave = Math.sin(this.time * 3.5);
    const alpha = 0.18 + wave * 0.1;
    const radius = 22 + wave * 4;

    ctx.strokeStyle = `rgba(255, 215, 100, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawSparkles(ctx) {
    ctx.save();
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = this.sparklePhase + (i * Math.PI * 2) / count;
      const dist = 20 + Math.sin(this.time * 2 + i) * 6;
      const sx = this.pos.x + Math.cos(angle) * dist;
      const sy = this.pos.y + Math.sin(angle) * dist;
      const size = 1.5 + Math.sin(this.time * 4 + i * 1.8) * 1;
      const alpha = 0.5 + Math.sin(this.time * 5 + i * 2) * 0.3;

      ctx.fillStyle = `rgba(255, 245, 180, ${alpha})`;
      // 4-point star sparkle
      ctx.beginPath();
      ctx.moveTo(sx, sy - size * 2);
      ctx.lineTo(sx + size * 0.6, sy);
      ctx.lineTo(sx, sy + size * 2);
      ctx.lineTo(sx - size * 0.6, sy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
