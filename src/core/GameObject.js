import Vector2 from './Vector2.js';

export default class GameObject {
  constructor(x, y) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2();
    this.acc = new Vector2();
    this.alive = true;
  }

  /** Advance this object's velocity and position by delta time. */
  update(dt) {
    this.vel = this.vel.add(this.acc.scale(dt));
    this.pos = this.pos.add(this.vel.scale(dt));
    this.acc = new Vector2();
  }

  /** Draw this object; subclasses override this method. */
  draw(ctx) {}

  /** Return a default bounding box centered on this object's position. */
  getBounds() {
    return {
      x: this.pos.x - 10,
      y: this.pos.y - 10,
      width: 20,
      height: 20,
    };
  }

  /** Add a force vector to this object's accumulated acceleration. */
  applyForce(vector2) {
    this.acc = this.acc.add(vector2);
  }
}
