import GameObject from '../core/GameObject.js';
import { InputManager } from '../core/InputManager.js';
import Vector2 from '../core/Vector2.js';

const THRUST = 380;
const DRAG = 0.985;
const BUOYANCY = 60;
const MAX_SPEED = 320;
const DIVE_GRAVITY = 90;

export default class Player extends GameObject {
  constructor(x, y) {
    super(x, y);

    this.oxygen = 100;
    this.health = 3;
    this.depth = 0;
    this.score = 0;
    this.startY = y;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
  }

  update(dt) {
    if (this.invulnerable) {
      this.invulnerableTimer -= dt;

      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
        this.invulnerableTimer = 0;
      }
    }

    const inputDirection = InputManager.direction();

    this.applyForce(new Vector2(0, -BUOYANCY));
    this.applyForce(new Vector2(0, DIVE_GRAVITY));

    if (inputDirection.length() > 0) {
      this.applyForce(inputDirection.scale(THRUST));
    }

    super.update(dt);

    this.vel = this.vel.scale(DRAG);

    if (this.vel.length() > MAX_SPEED) {
      this.vel = this.vel.normalize().scale(MAX_SPEED);
    }

    this.oxygen = Math.max(0, Math.min(100, this.oxygen - 4 * dt));
    this.depth = Math.max(0, (this.pos.y - this.startY) * 0.1);
  }

  draw(ctx) {
    if (this.invulnerable && Math.floor(this.invulnerableTimer / 0.1) % 2 === 0) {
      return;
    }

    this.drawTorchGlow(ctx);
    this.drawBubbles(ctx);

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    ctx.fillStyle = '#071827';
    ctx.beginPath();
    ctx.ellipse(0, 3, 10, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0c2338';
    ctx.beginPath();
    ctx.arc(0, -16, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#03111f';
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

    ctx.restore();
  }

  getBounds() {
    return {
      x: this.pos.x - 12,
      y: this.pos.y - 24,
      width: 24,
      height: 48,
    };
  }

  drawTorchGlow(ctx) {
    const glow = ctx.createRadialGradient(
      this.pos.x,
      this.pos.y,
      4,
      this.pos.x,
      this.pos.y,
      62,
    );

    glow.addColorStop(0, 'rgba(255, 219, 128, 0.45)');
    glow.addColorStop(0.35, 'rgba(255, 181, 74, 0.2)');
    glow.addColorStop(1, 'rgba(255, 181, 74, 0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 62, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBubbles(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(235, 252, 255, 0.68)';

    for (let i = 0; i < 3; i += 1) {
      const jitter = Math.sin(performance.now() * 0.004 + i * 2.4) * 2;
      const radius = 2 + i;
      const x = this.pos.x - 14 - i * 5 + jitter;
      const y = this.pos.y - 18 - i * 10 - jitter;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
