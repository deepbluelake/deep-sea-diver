import Creature from './Creature.js';

const BODY_COLORS = ['#30f2ff', '#9dff57', '#ffd84a', '#ff54d2', '#ff7f6e'];

export default class GlowFish extends Creature {
  constructor(x, y) {
    super(x, y, {
      health: 1,
      damage: 0,
      scoreValue: 25,
      glowColor: 'rgba(0, 255, 180, 0.5)',
      glowRadius: 42,
      radius: 10,
    });

    this.type = 'collectible';
    this.baseY = y;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.bobSpeed = 1.5 + Math.random();
    this.bobAmplitude = 15 + Math.random() * 10;
    this.bodyColor = BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)];
    this.tailPhase = 0;
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    this.tailPhase += dt * 10;

    this.pos.y = this.baseY + Math.sin(this.bobOffset + this.time * this.bobSpeed) * this.bobAmplitude;
  }

  draw(ctx) {
    this.drawGlow(ctx);
    this.drawPulseRing(ctx);

    const tailWiggle = Math.sin(this.tailPhase) * 4;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    ctx.fillStyle = this.bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(-19, -7 + tailWiggle);
    ctx.lineTo(-19, 7 + tailWiggle);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(5, -2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#061522';
    ctx.beginPath();
    ctx.arc(5.5, -2, 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  onCollisionWithPlayer(player) {
    player.oxygen = Math.min(player.oxygen + 15, 100);
    player.score += this.scoreValue;
    this.alive = false;
  }

  drawPulseRing(ctx) {
    const alpha = 0.12 + Math.sin(this.time * 4) * 0.06;

    ctx.strokeStyle = `rgba(205, 255, 238, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 17 + Math.sin(this.time * 4) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}
