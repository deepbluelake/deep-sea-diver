const LAYERS = [
  { count: 40, radius: 1, speed: 8, parallax: 0.3, alpha: 0.14 },
  { count: 40, radius: 2, speed: 14, parallax: 0.6, alpha: 0.2 },
  { count: 40, radius: 3, speed: 22, parallax: 1, alpha: 0.26 },
];

export default class ParticleField {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.layers = LAYERS.map((layer) => ({
      ...layer,
      particles: this.createParticles(layer.count),
    }));
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  update(dt, camera) {
    this.time += dt;

    for (const layer of this.layers) {
      for (const particle of layer.particles) {
        particle.y -= layer.speed * dt;
        particle.sway += dt * particle.swaySpeed;

        const screenY = particle.y - camera.y * layer.parallax;

        if (screenY < -20) {
          particle.x = Math.random() * this.width;
          particle.y = camera.y * layer.parallax + this.height + Math.random() * 80;
          particle.sway = Math.random() * Math.PI * 2;
        }
      }
    }
  }

  draw(ctx, camera, depth) {
    const depthFade = Math.max(0.28, 1 - depth / 1400);
    const blueTint = Math.min(depth / 1000, 1);

    ctx.save();

    for (const layer of this.layers) {
      for (const particle of layer.particles) {
        const x = particle.x + Math.sin(particle.sway) * particle.swayRange;
        const y = particle.y - camera.y * layer.parallax;
        const alpha = layer.alpha * particle.alpha * depthFade;

        if (y < -20 || y > this.height + 20) {
          continue;
        }

        ctx.fillStyle = `rgba(${220 - blueTint * 35}, ${250 - blueTint * 25}, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, layer.radius * particle.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  createParticles(count) {
    const particles = [];

    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        scale: 0.75 + Math.random() * 0.6,
        alpha: 0.55 + Math.random() * 0.45,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.25 + Math.random() * 0.45,
        swayRange: 5 + Math.random() * 10,
      });
    }

    return particles;
  }
}
