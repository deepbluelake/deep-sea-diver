import Creature from './Creature.js';

export default class Jellyfish extends Creature {
  constructor(x, y) {
    super(x, y, {
      health: 1,
      damage: 1,
      scoreValue: 0,
      glowColor: 'rgba(180, 50, 255, 0.35)',
      glowRadius: 45,
      radius: 14,
    });

    this.type = 'hazard';
    this.driftSpeed = 20 + Math.random() * 15;
    this.driftDir = Math.random() < 0.5 ? 1 : -1;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.tentaclePhase = 0;
  }

  update(dt) {
    this.pos.x += this.driftDir * this.driftSpeed * dt;
    this.pos.y -= 8 * dt;

    if (this.pos.x < this.radius || this.pos.x > window.innerWidth - this.radius) {
      this.driftDir *= -1;
    }

    this.pulsePhase += dt * 3;
    this.tentaclePhase += dt * 4;
  }

  draw(ctx) {
    this.drawGlow(ctx);

    const pulseScale = 0.925 + Math.sin(this.pulsePhase) * 0.075;
    const bellGradient = ctx.createRadialGradient(
      this.pos.x,
      this.pos.y - 4,
      2,
      this.pos.x,
      this.pos.y,
      18,
    );

    bellGradient.addColorStop(0, 'rgba(255, 185, 255, 0.72)');
    bellGradient.addColorStop(1, 'rgba(122, 55, 218, 0.42)');

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.scale(pulseScale, pulseScale);
    ctx.fillStyle = bellGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 15, Math.PI, 0);
    ctx.quadraticCurveTo(10, 9, 0, 9);
    ctx.quadraticCurveTo(-10, 9, -15, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    this.drawTentacles(ctx);
    this.drawInnerDetails(ctx);
  }

  onCollisionWithPlayer(player) {
    if (player.shieldTimer > 0) {
      this.alive = false; // shield absorbs the hit
      return;
    }
    player.health -= this.damage;
    this.alive = false;
  }

  drawTentacles(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(235, 185, 255, 0.55)';
    ctx.lineWidth = 1.2;

    for (let i = 0; i < 5; i += 1) {
      const startX = this.pos.x - 10 + i * 5;
      const startY = this.pos.y + 7;
      const sway = Math.sin(this.tentaclePhase + i * 0.8) * 6;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + sway, startY + 10, startX + sway * 0.35, startY + 24);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawInnerDetails(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 220, 255, 0.72)';
    ctx.shadowColor = 'rgba(255, 180, 255, 0.8)';
    ctx.shadowBlur = 7;

    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(this.pos.x - 5 + i * 5, this.pos.y + 1 + Math.sin(this.pulsePhase + i) * 1.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
