export default class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /** Return a new vector with another vector added. */
  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /** Return a new vector with another vector subtracted. */
  subtract(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /** Return a new vector scaled by a scalar value. */
  scale(s) {
    return new Vector2(this.x * s, this.y * s);
  }

  /** Return the magnitude of this vector. */
  length() {
    return Math.hypot(this.x, this.y);
  }

  /** Return a new unit vector in the same direction. */
  normalize() {
    const magnitude = this.length();

    if (magnitude === 0) {
      return new Vector2();
    }

    return new Vector2(this.x / magnitude, this.y / magnitude);
  }

  /** Return the distance from this vector to another vector. */
  distanceTo(v) {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  /** Return a new vector with the same coordinates. */
  clone() {
    return new Vector2(this.x, this.y);
  }

  /** Set this vector's coordinates and return itself. */
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
}
