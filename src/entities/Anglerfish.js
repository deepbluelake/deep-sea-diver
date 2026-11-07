cls
import Vector2 from '../core/Vector2.js';
import Creature from './Creature.js';

export default class Anglerfish extends Creature {
  constructor(x, y) {
    super(x, y, {
      health: 2,
      damage: 1,
      scoreValue: 0,
      glowColor: 'rgba(255, 200, 50, 0.3)',
      glowRadius: 25,
      radius: 20,
    });

    this.type = 'predator';
    this.state = 'lurk';
    this.detectionRange = 180;
    this.chaseSpeed = 140;
    this.retreatTimer = 0;
    this.lurePhase = Math.random() * Math.PI * 2;
    this.jawOpen = 0;
    this.facing = 1;
  }

  update(dt, player) {
    this.lurePhase += dt * 5;

    if (!player) {
      return;
    }

    const distance = this.pos.distanceTo(player.pos);

    if (this.state === 'lurk') {
      this.vel = new Vector2();

      if (distance < this.detectionRange) {
        this.state = 'chase';
      }

      return;
    }

    if (this.state === 'chase') {
      const direction = player.pos.subtract(this.pos).normalize();
      this.vel = direction.scale(this.chaseSpeed);
      this.facing = direction.x >= 0 ? 1 : -1;
      this.jawOpen += (1 - this.jawOpen) * 4 * dt;

      if (distance > this.detectionRange * 2) {
        this.state = 'retreat';
        this.retreatTimer = 0;
      }
    } else if (this.state === 'retreat') {
      this.vel = this.vel.scale(0.95);
      this.jawOpen += (0 - this.jawOpen) * 4 * dt;
      this.retreatTimer += dt;

      if (this.retreatTimer >= 2) {
        this.state = 'lurk';
      }
    }

    super.update(dt);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.scale(this.facing, 1);

    this.drawBody(ctx);
    this.drawJaw(ctx);
    this.drawEye(ctx);
    this.drawLure(ctx);

    ctx.restore();
  }

  onCollisionWithPlayer(player) {
    if (player.shieldTimer > 0) {
      this.alive = false; // shield absorbs the hit
      return;
    }
    player.health -= this.damage;
    this.alive = false;
  }

  drawBody(ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.quadraticCurveTo(-12, -14, 6, -12);
    ctx.quadraticCurveTo(25, -8, 24, 4);
    ctx.quadraticCurveTo(10, 18, -14, 12);
    ctx.quadraticCurveTo(-26, 8, -20, 0);
    ctx.fill();
  }

  drawLure(ctx) {
    const pulse = 1 + Math.sin(this.lurePhase) * 0.18;
    const lureX = 25;
    const lureY = -25 + Math.sin(this.lurePhase) * 2;

    ctx.strokeStyle = 'rgba(210, 190, 130, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(11, -8);
    ctx.bezierCurveTo(18, -22, 19, -31, lureX, lureY);
    ctx.stroke();

    const glow = ctx.createRadialGradient(lureX, lureY, 1, lureX, lureY, 22 * pulse);
    glow.addColorStop(0, 'rgba(255, 231, 126, 0.95)');
    glow.addColorStop(0.35, 'rgba(255, 188, 62, 0.42)');
    glow.addColorStop(1, 'rgba(255, 188, 62, 0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lureX, lureY, 22 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffe77e';
    ctx.beginPath();
    ctx.arc(lureX, lureY, 3.5 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  drawJaw(ctx) {
    const open = this.jawOpen;

    ctx.strokeStyle = 'rgba(18, 18, 30, 0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 4);
    ctx.lineTo(24, 7 + open * 10);
    ctx.moveTo(6, 4);
    ctx.lineTo(24, 5 - open * 6);
    ctx.stroke();

    if (open < 0.2) {
      return;
    }

    ctx.fillStyle = 'rgba(240, 245, 235, 0.9)';

    for (let i = 0; i < 4; i += 1) {
      const x = 11 + i * 3.5;
      ctx.beginPath();
      ctx.moveTo(x, 5);
      ctx.lineTo(x + 1.5, 5 + open * 7);
      ctx.lineTo(x + 3, 5);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawEye(ctx) {
    ctx.fillStyle = '#ff435f';
    ctx.shadowColor = 'rgba(255, 67, 95, 0.85)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(8, -5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
