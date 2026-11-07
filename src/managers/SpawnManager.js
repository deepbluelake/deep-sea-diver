import Creature from '../entities/Creature.js';
import Anglerfish from '../entities/Anglerfish.js';
import ElixirShell from '../entities/ElixirShell.js';
import GlowFish from '../entities/GlowFish.js';
import Jellyfish from '../entities/Jellyfish.js';

const SPAWN_INTERVAL = 0.8;
const MAX_CREATURES = 20;

export default class SpawnManager {
  constructor(game) {
    this.game = game;
    this.timer = 0;
  }

  update(dt, camera, canvas) {
    this.timer += dt;

    if (this.timer < SPAWN_INTERVAL || this.creatureCount() >= MAX_CREATURES) {
      return;
    }

    this.timer = 0;
    this.spawnCreature(camera, canvas);
  }

  creatureCount() {
    return this.game.objects.filter((object) => object instanceof Creature).length;
  }

  spawnCreature(camera, canvas) {
    const depth = this.game.player.depth;
    const roll = Math.random();

    // Rare ElixirShell — 3% chance, only below 300m
    if (depth >= 300 && roll < 0.03) {
      this.spawnCreatureType(ElixirShell, camera, canvas);
      return;
    }

    if (depth >= 500) {
      if (roll < 0.2) {
        this.spawnCreatureType(Anglerfish, camera, canvas);
      } else if (roll < 0.5) {
        this.spawnCreatureType(Jellyfish, camera, canvas);
      } else if (roll < 0.85) {
        this.spawnCreatureType(GlowFish, camera, canvas);
      }

      return;
    }

    if (depth >= 200 && roll < 0.3) {
      this.spawnCreatureType(Jellyfish, camera, canvas);
      return;
    }

    this.spawnCreatureType(GlowFish, camera, canvas);
  }

  spawnCreatureType(CreatureClass, camera, canvas) {
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    const x = 24 + Math.random() * Math.max(1, width - 48);
    const y = camera.y + height + 100;

    this.game.objects.push(new CreatureClass(x, y));
  }
}
