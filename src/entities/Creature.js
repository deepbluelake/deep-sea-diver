import GameObject from '../core/GameObject.js';

export default class Creature extends GameObject {
  constructor(x, y, config = {}) {
    super(x, y);

    this.health = config.health ?? 1;
    this.damage = config.damage ?? 1;
    this.scoreValue = config.scoreValue ?? 10;
    this.radius = config.radius ?? 12;
    this.glowColor = config.glowColor ?? 'rgba(0, 255, 200, 0.3)';
    this.glowRadius = config.glowRadius ?? 40;
    this.type = 'neutral';
  }

  /** Return a bounding box sized from this creature's radius. */
  getBounds() {
    return {
      x: this.pos.x - this.radius,
      y: this.pos.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }

  /** Draw this creature's soft bioluminescent halo. */
  drawGlow(ctx) {
    const glow = ctx.createRadialGradient(
      this.pos.x,
      this.pos.y,
      2,
      this.pos.x,
      this.pos.y,
      this.glowRadius,
    );

    glow.addColorStop(0, this.glowColor);
    glow.addColorStop(1, 'rgba(0, 255, 200, 0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  /** React to a player collision; subclasses define behavior. */
  onCollisionWithPlayer(player) {}

  /** Return true when this creature is far above the camera view. */
  isOffScreen(camera, canvas) {
    const extraMargin = Math.max(this.glowRadius, 80);
    const topLimit = camera.y - extraMargin;

    return this.pos.y + this.radius < topLimit;
  }
}
