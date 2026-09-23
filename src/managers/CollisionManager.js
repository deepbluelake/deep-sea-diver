import Creature from '../entities/Creature.js';

export default class CollisionManager {
  static checkCollision(a, b) {
    const boundsA = a.getBounds();
    const boundsB = b.getBounds();

    return (
      boundsA.x < boundsB.x + boundsB.width
      && boundsA.x + boundsA.width > boundsB.x
      && boundsA.y < boundsB.y + boundsB.height
      && boundsA.y + boundsA.height > boundsB.y
    );
  }

  static checkPlayerVsCreatures(player, objects) {
    let collected = false;

    for (const object of objects) {
      if (object instanceof Creature && this.checkCollision(player, object)) {
        const wasAlive = object.alive;
        const previousHealth = player.health;
        object.onCollisionWithPlayer(player);

        if (object.type === 'collectible' && wasAlive && !object.alive) {
          collected = true;
        }

        if (player.health < previousHealth) {
          break;
        }
      }
    }

    return collected;
  }
}
