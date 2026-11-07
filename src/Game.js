import Camera from './Camera.js';
import { InputManager } from './core/InputManager.js';
import GlowFish from './entities/GlowFish.js';
import Player from './entities/Player.js';
import CollisionManager from './managers/CollisionManager.js';
import DepthManager from './managers/DepthManager.js';
import ParticleField from './managers/ParticleField.js';
import SpawnManager from './managers/SpawnManager.js';
import PauseMenu from './ui/PauseMenu.js';

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.objects = [];
    this.player = null;
    this.camera = new Camera();
    this.input = InputManager;
    this.spawnManager = new SpawnManager(this);
    this.particleField = new ParticleField(1, 1);
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d');
    this.titleFish = [];
    this.pauseMenu = new PauseMenu(this);
    this.paused = false;

    this.width = 0;
    this.height = 0;
    this.pixelRatio = 1;
    this.lastTime = 0;
    this.fps = 0;
    this.dt = 0;
    this.debugHud = false;
    this.flashTimer = 0;
    this.redFlashTimer = 0;
    this.shakeTimer = 0;
    this.shakeIntensity = 5;
    this.godRayTime = 0;
    this.titleTime = 0;
    this.gameOverTimer = 0;
    this.bestDepth = 0;
    this.state = 'title'; // 'title' | 'playing' | 'gameover'
    this.isRunning = false;
    this.isTouchDevice = 'ontouchstart' in window;

    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', (e) => {
      if (e.key === '`') this.debugHud = !this.debugHud;
      if ((e.key === 'p' || e.key === 'P') && this.state === 'playing') {
        this.paused = !this.paused;
      }
    });

    this.handleResize();
    this.setupTitleScreen();
  }

  // ── Setup ──────────────────────────────────────────────

  setupTitleScreen() {
    this.titleFish = [];
    for (let i = 0; i < 5; i++) {
      const fish = new GlowFish(
        Math.random() * this.width,
        100 + Math.random() * (this.height - 200)
      );
      this.titleFish.push(fish);
    }
  }

  handleResize() {
    this.pixelRatio = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.floor(this.width * this.pixelRatio);
    this.canvas.height = Math.floor(this.height * this.pixelRatio);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.lightCanvas.width = this.width;
    this.lightCanvas.height = this.height;
    this.particleField.resize(this.width, this.height);

    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  // ── Game loop ──────────────────────────────────────────

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    requestAnimationFrame(this.loop);
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;

    const elapsed = (timestamp - this.lastTime) / 1000;
    this.dt = Math.min(elapsed, 0.05);
    this.fps = this.dt > 0 ? 1 / this.dt : 0;
    this.lastTime = timestamp;

    this.update(this.dt);
    this.render();

    requestAnimationFrame(this.loop);
  }

  // ── Update by state ────────────────────────────────────

  update(dt) {
    if (this.state === 'title') {
      this.updateTitle(dt);
      return;
    }

    if (this.state === 'gameover') {
      this.gameOverTimer += dt;
      if (this.gameOverTimer >= 0.8 && (this.input.isDown('r') || this.input.isDown('R'))) {
        this.resetGame();
      }
      return;
    }

    // ── Playing state ──
    if (this.paused) return;

    // Update shield timer
    if (this.player.shieldTimer > 0) {
      this.player.shieldTimer -= dt;
      if (this.player.shieldTimer <= 0) {
        this.player.shieldTimer = 0;
      }
    }

    this.spawnManager.update(dt, this.camera, this.canvas);
    this.particleField.update(dt, this.camera);
    this.godRayTime += dt;

    for (const object of this.objects) {
      object.update(dt, this.player);
    }

    this.camera.update(this.player, dt);

    if (!this.player.invulnerable && this.player.shieldTimer <= 0) {
      const previousHealth = this.player.health;

      if (CollisionManager.checkPlayerVsCreatures(this.player, this.objects)) {
        this.flashTimer = 2;
      }

      if (this.player.health < previousHealth) {
        this.handlePlayerDamage();
      }
    } else {
      // Still collect collectibles while shielded/invulnerable
      CollisionManager.checkPlayerVsCreatures(this.player, this.objects);
    }

    this.objects = this.objects.filter((object) => (
      object.alive
      && (object === this.player || !object.isOffScreen(this.camera, this.canvas))
    ));

    this.shakeTimer = Math.max(0, this.shakeTimer - dt);
    this.redFlashTimer = Math.max(0, this.redFlashTimer - dt);

    if (this.player.health <= 0) {
      this.enterGameOver();
    }
  }

  updateTitle(dt) {
    this.titleTime += dt;
    this.godRayTime += dt;
    this.particleField.update(dt, this.camera);

    // Animate title fish
    for (const fish of this.titleFish) {
      fish.update(dt);
      // Wrap fish horizontally so they swim across forever
      if (fish.pos.x < -40) fish.pos.x = this.width + 40;
      if (fish.pos.x > this.width + 40) fish.pos.x = -40;
    }

    // Start game on Enter or Space
    if (this.input.isDown(' ') || this.input.isDown('Enter')) {
      this.startPlaying();
    }
  }

  startPlaying() {
    this.state = 'playing';
    this.paused = false;
    this.objects = [];
    this.camera = new Camera();
    this.spawnManager = new SpawnManager(this);
    this.particleField = new ParticleField(this.width, this.height);
    this.player = new Player(this.width / 2, this.height / 2);
    this.objects.push(this.player);
    this.flashTimer = 0;
    this.redFlashTimer = 0;
    this.shakeTimer = 0;
    this.gameOverTimer = 0;
    this.godRayTime = 0;
  }

  enterGameOver() {
    this.state = 'gameover';
    this.gameOverTimer = 0;
    if (this.player.depth > this.bestDepth) {
      this.bestDepth = this.player.depth;
    }
  }

  resetGame() {
    this.state = 'title';
    this.titleTime = 0;
    this.setupTitleScreen();
  }

  // ── Render by state ────────────────────────────────────

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.state === 'title') {
      this.renderTitle();
      return;
    }

    this.drawBackground();
    this.drawGodRays();
    this.particleField.draw(this.ctx, this.camera, this.player.depth);

    this.ctx.save();
    this.applyScreenShake();
    this.camera.applyToContext(this.ctx);

    for (const object of this.objects) {
      object.draw(this.ctx);
    }

    this.ctx.restore();
    this.drawDarknessOverlay();
    this.drawHud();
    this.drawFlashOverlay();
    this.drawRedFlashOverlay();

    if (this.isTouchDevice) this.drawTouchIndicators();

    if (this.player.shieldTimer > 0) {
      this.drawShieldEffect();
    }

    if (this.state === 'gameover') {
      this.drawGameOver();
    }

    if (this.paused) {
      this.pauseMenu.draw(this.ctx, this.width, this.height);
    }
  }

  renderTitle() {
    // Background — sunlit surface colors
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, 'rgb(64, 196, 190)');
    gradient.addColorStop(1, 'rgb(28, 107, 160)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // God rays on title
    this.drawGodRays();

    // Particles
    this.particleField.draw(this.ctx, this.camera, 0);

    // Draw title fish
    this.ctx.save();
    for (const fish of this.titleFish) {
      fish.draw(this.ctx);
    }
    this.ctx.restore();

    // Title text
    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Main title
    this.ctx.shadowColor = 'rgba(0, 220, 255, 0.7)';
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = '#f7fdff';
    this.ctx.font = 'bold 48px monospace';
    this.ctx.fillText('DEEP SEA DIVER', this.width / 2, this.height / 2 - 50);

    // Subtitle
    this.ctx.shadowBlur = 10;
    this.ctx.font = '16px monospace';
    this.ctx.fillStyle = 'rgba(220, 250, 255, 0.8)';
    this.ctx.fillText('How deep can you dive?', this.width / 2, this.height / 2 + 5);

    // Pulsing "press to start"
    const pulse = 0.4 + Math.sin(this.titleTime * 3) * 0.3 + 0.3;
    this.ctx.globalAlpha = pulse;
    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Press ENTER or SPACE to dive', this.width / 2, this.height / 2 + 50);
    this.ctx.globalAlpha = 1;

    // Controls hint
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = 'rgba(200, 240, 255, 0.45)';
    this.ctx.fillText('WASD or Arrow Keys to swim', this.width / 2, this.height - 40);

    // Best depth (if any)
    if (this.bestDepth > 0) {
      this.ctx.fillStyle = 'rgba(200, 240, 255, 0.55)';
      this.ctx.fillText(`Best dive: ${Math.floor(this.bestDepth)}m`, this.width / 2, this.height - 65);
    }

    this.ctx.restore();
  }

  // ── HUD ────────────────────────────────────────────────

  drawHud() {
    this.ctx.save();
    this.drawDepthHud();
    this.drawOxygenHud();
    this.drawHealthHud();
    this.drawPauseHint();
    if (this.player.shieldTimer > 0) this.drawShieldHud();
    if (this.debugHud) this.drawDebugStats();
    this.ctx.restore();
  }

  drawDepthHud() {
    const zoneName = DepthManager.getZoneName(this.player.depth);
    const textColor = this.getHudTextColor();

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.shadowColor = this.player.depth > 400 ? 'rgba(210, 248, 255, 0.9)' : 'rgba(230, 255, 255, 0.55)';
    this.ctx.shadowBlur = 12;
    this.ctx.fillStyle = textColor;
    this.ctx.font = '24px monospace';
    this.ctx.fillText(`${Math.floor(this.player.depth)}m`, this.width / 2, 18);
    this.ctx.font = '10px monospace';
    this.ctx.fillText(`- ${zoneName} -`, this.width / 2, 47);
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Score ${this.player.score}`, this.width / 2, 64);
  }

  drawOxygenHud() {
    const x = 18;
    const y = 22;
    const width = 130;
    const height = 7;
    const oxygenPercent = this.player.oxygen / 100;

    this.ctx.shadowBlur = 9;
    this.ctx.shadowColor = 'rgba(232, 251, 255, 0.55)';

    if (oxygenPercent < 0.25) {
      const pulse = 0.55 + Math.sin(performance.now() * 0.008) * 0.45;
      this.ctx.shadowColor = `rgba(255, 70, 80, ${0.35 + pulse * 0.45})`;
      this.ctx.shadowBlur = 12 + pulse * 8;
    }

    this.ctx.fillStyle = 'rgba(232, 251, 255, 0.25)';
    this.ctx.fillRect(x, y, width, height);
    this.ctx.fillStyle = this.getOxygenColor(oxygenPercent);
    this.ctx.fillRect(x, y, width * oxygenPercent, height);
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = this.getHudTextColor();
    this.ctx.fillText('O2', x, y + 13);
  }

  drawHealthHud() {
    const startX = this.width - 72;
    const y = 26;

    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = 'rgba(232, 251, 255, 0.65)';
    this.ctx.fillStyle = this.getHudTextColor();

    for (let i = 0; i < 3; i += 1) {
      this.ctx.globalAlpha = i < this.player.health ? 1 : 0.24;
      this.ctx.beginPath();
      this.ctx.arc(startX + i * 22, y, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;
  }

  drawPauseHint() {
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillStyle = 'rgba(180, 220, 240, 0.3)';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('P to pause', this.width - 14, this.height - 10);
  }

  drawShieldHud() {
    const secs = Math.ceil(this.player.shieldTimer);
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    const pulse = 0.6 + Math.sin(performance.now() * 0.008) * 0.4;
    this.ctx.fillStyle = `rgba(255, 215, 80, ${pulse})`;
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(`SHIELD ${secs}s`, this.width / 2, 84);
  }

  drawDebugStats() {
    this.ctx.shadowBlur = 0;
    this.ctx.font = '11px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = 'rgba(232, 251, 255, 0.7)';
    this.ctx.fillText(`FPS ${this.fps.toFixed(0)}`, 18, 52);
    this.ctx.fillText(`dt ${this.dt.toFixed(3)}s`, 18, 67);
  }

  // ── Touch indicators ───────────────────────────────────

  drawTouchIndicators() {
    const size = 28;
    const pad = 30;
    const alpha = 0.12;
    this.ctx.save();
    this.ctx.font = `${size}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;

    // Left
    this.ctx.fillText('◀', pad + size / 2, this.height / 2);
    // Right
    this.ctx.fillText('▶', this.width - pad - size / 2, this.height / 2);
    // Up
    this.ctx.fillText('▲', this.width / 2, pad + size / 2);
    // Down
    this.ctx.fillText('▼', this.width / 2, this.height - pad - size / 2);

    this.ctx.restore();
  }

  // ── Visual helpers ─────────────────────────────────────

  getOxygenColor(oxygenPercent) {
    if (oxygenPercent < 0.3) return '#ff6b5f';
    if (oxygenPercent < 0.6) return '#ffd166';
    return '#7df6b5';
  }

  getHudTextColor() {
    return this.player && this.player.depth > 400 ? '#f6fdff' : '#ddfbff';
  }

  drawBackground() {
    const colors = DepthManager.getBackgroundColors(this.player.depth);
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, colors.top);
    gradient.addColorStop(1, colors.bottom);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawGodRays() {
    const depth = this.player ? this.player.depth : 0;
    const alpha = Math.max(0, 1 - depth / 400) * 0.04;
    if (alpha <= 0) return;

    this.ctx.save();
    for (let i = 0; i < 4; i += 1) {
      const x = i * (this.width / 3) - 40 + Math.sin(this.godRayTime * 0.35 + i) * 18;
      const rayWidth = 65 + i * 16;
      const lean = 150 + i * 28;
      const grad = this.ctx.createLinearGradient(x, 0, x + lean, this.height);

      grad.addColorStop(0, `rgba(235, 255, 245, ${alpha})`);
      grad.addColorStop(0.55, `rgba(235, 255, 245, ${alpha * 0.35})`);
      grad.addColorStop(1, 'rgba(235, 255, 245, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x + rayWidth, 0);
      this.ctx.lineTo(x + lean + rayWidth * 0.35, this.height);
      this.ctx.lineTo(x + lean - rayWidth, this.height);
      this.ctx.closePath();
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  drawDarknessOverlay() {
    const darkness = DepthManager.getDarkness(this.player.depth);
    if (darkness <= 0.01) return;

    this.lightCtx.clearRect(0, 0, this.width, this.height);
    this.lightCtx.globalCompositeOperation = 'source-over';
    this.lightCtx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
    this.lightCtx.fillRect(0, 0, this.width, this.height);
    this.lightCtx.globalCompositeOperation = 'destination-out';

    // Player torch
    this.drawLightHole(this.player.pos.x, this.camera.worldToScreen(this.player.pos), 220);

    // Creature glows
    for (const object of this.objects) {
      if (object === this.player || !object.type) continue;

      if (object.type === 'collectible' && object.constructor.name === 'ElixirShell') {
        this.drawLightHole(object.pos.x, this.camera.worldToScreen(object.pos), 65);
      } else if (object.type === 'collectible') {
        this.drawLightHole(object.pos.x, this.camera.worldToScreen(object.pos), 50);
      } else if (object.type === 'hazard') {
        this.drawLightHole(object.pos.x, this.camera.worldToScreen(object.pos), 60);
      } else if (object.type === 'predator') {
        const lureX = object.pos.x + object.facing * 25;
        const lureY = object.pos.y - 25 + Math.sin(object.lurePhase) * 2;
        this.drawLightHole(lureX, lureY - this.camera.y, 40);
      }
    }

    this.lightCtx.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(this.lightCanvas, 0, 0, this.width, this.height);
  }

  drawLightHole(x, y, radius) {
    const grad = this.lightCtx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.62)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    this.lightCtx.fillStyle = grad;
    this.lightCtx.beginPath();
    this.lightCtx.arc(x, y, radius, 0, Math.PI * 2);
    this.lightCtx.fill();
  }

  drawFlashOverlay() {
    if (this.flashTimer <= 0) return;
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
    this.flashTimer -= 1;
  }

  drawRedFlashOverlay() {
    if (this.redFlashTimer <= 0) return;
    const alpha = 0.15 * (this.redFlashTimer / 0.2);
    this.ctx.save();
    this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  handlePlayerDamage() {
    this.player.health = Math.max(0, this.player.health);
    this.player.invulnerable = true;
    this.player.invulnerableTimer = 1.5;
    this.shakeTimer = 0.15;
    this.redFlashTimer = 0.2;
  }

  applyScreenShake() {
    if (this.shakeTimer <= 0) return;
    const x = (Math.random() * 2 - 1) * this.shakeIntensity;
    const y = (Math.random() * 2 - 1) * this.shakeIntensity;
    this.ctx.translate(x, y);
  }

  drawShieldEffect() {
    const screenY = this.camera.worldToScreen(this.player.pos);
    const sx = this.player.pos.x;
    const pulse = Math.sin(performance.now() * 0.006) * 0.15 + 0.35;
    const radius = 38 + Math.sin(performance.now() * 0.004) * 4;

    // Golden shield bubble
    const grad = this.ctx.createRadialGradient(sx, screenY, 0, sx, screenY, radius);
    grad.addColorStop(0, `rgba(255, 215, 80, ${pulse * 0.15})`);
    grad.addColorStop(0.7, `rgba(255, 200, 60, ${pulse * 0.25})`);
    grad.addColorStop(1, 'rgba(255, 200, 60, 0)');

    this.ctx.save();
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(sx, screenY, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Shield ring
    this.ctx.strokeStyle = `rgba(255, 230, 120, ${pulse})`;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(sx, screenY, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Timer indicator — arc that shrinks as shield wears off
    const remaining = this.player.shieldTimer / 6;
    this.ctx.strokeStyle = `rgba(255, 245, 180, ${0.6 + pulse * 0.3})`;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(
      sx, screenY, radius + 4,
      -Math.PI / 2,
      -Math.PI / 2 + remaining * Math.PI * 2,
    );
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawGameOver() {
    const fade = Math.min(this.gameOverTimer / 0.5, 1);

    this.ctx.save();
    this.ctx.globalAlpha = fade;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    this.ctx.shadowBlur = 12;
    this.ctx.fillStyle = '#f7fdff';
    this.ctx.font = '42px monospace';
    this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 50);
    this.ctx.font = '16px monospace';
    this.ctx.fillText(`Depth ${Math.floor(this.player.depth)}m`, this.width / 2, this.height / 2);
    this.ctx.fillText(`Score ${this.player.score}`, this.width / 2, this.height / 2 + 28);
    this.ctx.fillText(`Best ${Math.floor(this.bestDepth)}m`, this.width / 2, this.height / 2 + 56);

    if (this.gameOverTimer >= 0.8) {
      const pulse = 0.5 + Math.sin(this.gameOverTimer * 3) * 0.3 + 0.2;
      this.ctx.globalAlpha = fade * pulse;
      this.ctx.fillText('Press R to restart', this.width / 2, this.height / 2 + 96);
    }

    this.ctx.restore();
  }
}
