import Vector2 from './Vector2.js';

class InputManagerClass {
  constructor() {
    this.keys = new Set();
    this.pressedKeys = new Set();
    this.touchKeys = new Set();
    this.activeTouches = new Map();
    this.isTouchDevice = 'ontouchstart' in window;

    window.addEventListener('keydown', (event) => {
      if (!this.keys.has(event.key)) {
        this.pressedKeys.add(event.key);
      }

      this.keys.add(event.key);
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.key);
    });

    window.addEventListener('touchstart', (event) => {
      this.trackTouches(event);
    }, { passive: false });

    window.addEventListener('touchmove', (event) => {
      this.trackTouches(event);
    }, { passive: false });

    window.addEventListener('touchend', (event) => {
      this.releaseTouches(event);
    });

    window.addEventListener('touchcancel', (event) => {
      this.releaseTouches(event);
    });
  }

  isDown(key) {
    return this.keys.has(key) || this.touchKeys.has(key);
  }

  consumePress(key) {
    const wasPressed = this.pressedKeys.has(key);

    if (wasPressed) {
      this.pressedKeys.delete(key);
    }

    return wasPressed;
  }

  direction() {
    const x = Number(this.isDown('ArrowRight') || this.isDown('d') || this.isDown('D'))
      - Number(this.isDown('ArrowLeft') || this.isDown('a') || this.isDown('A'));
    const y = Number(this.isDown('ArrowDown') || this.isDown('s') || this.isDown('S'))
      - Number(this.isDown('ArrowUp') || this.isDown('w') || this.isDown('W'));

    return new Vector2(x, y).normalize();
  }

  trackTouches(event) {
    event.preventDefault();

    for (const touch of event.changedTouches) {
      this.activeTouches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      });
    }

    this.updateTouchKeys();
  }

  releaseTouches(event) {
    for (const touch of event.changedTouches) {
      this.activeTouches.delete(touch.identifier);
    }

    this.updateTouchKeys();
  }

  updateTouchKeys() {
    this.touchKeys.clear();

    for (const touch of this.activeTouches.values()) {
      if (touch.x < window.innerWidth / 2) {
        this.touchKeys.add('ArrowLeft');
      } else {
        this.touchKeys.add('ArrowRight');
      }

      if (touch.y < window.innerHeight / 2) {
        this.touchKeys.add('ArrowUp');
      } else {
        this.touchKeys.add('ArrowDown');
      }
    }
  }
}

export const InputManager = new InputManagerClass();
