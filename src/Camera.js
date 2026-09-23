export default class Camera {
  constructor() {
    this.y = 0;
  }

  update(player, dt) {
    const targetY = player.pos.y - window.innerHeight / 2;
    this.y += (targetY - this.y) * 6 * dt;
  }

  applyToContext(ctx) {
    ctx.translate(0, -this.y);
  }

  worldToScreen(pos) {
    return pos.y - this.y;
  }
}
