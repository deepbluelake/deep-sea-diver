const ZONES = [
  {
    name: 'SUNLIT',
    start: 0,
    top: [64, 196, 190],
    bottom: [28, 107, 160],
  },
  {
    name: 'TWILIGHT',
    start: 250,
    top: [30, 110, 130],
    bottom: [15, 55, 95],
  },
  {
    name: 'MIDNIGHT',
    start: 600,
    top: [12, 40, 70],
    bottom: [6, 20, 45],
  },
  {
    name: 'ABYSS',
    start: 1000,
    top: [4, 10, 25],
    bottom: [1, 3, 12],
  },
];

export default class DepthManager {
  static getBackgroundColors(depth) {
    const { zone, nextZone, progress } = this.getZoneProgress(depth);

    return {
      top: this.toRgb(this.lerpColor(zone.top, nextZone.top, progress)),
      bottom: this.toRgb(this.lerpColor(zone.bottom, nextZone.bottom, progress)),
    };
  }

  static getDarkness(depth) {
    const normalizedDepth = Math.min(depth / 1100, 1);
    const smooth = normalizedDepth * normalizedDepth * (3 - 2 * normalizedDepth);

    return smooth * 0.85;
  }

  static getZoneName(depth) {
    if (depth >= 1000) {
      return 'ABYSS';
    }

    if (depth >= 600) {
      return 'MIDNIGHT';
    }

    if (depth >= 250) {
      return 'TWILIGHT';
    }

    return 'SUNLIT';
  }

  static getZoneProgress(depth) {
    for (let i = 0; i < ZONES.length; i += 1) {
      const zone = ZONES[i];
      const nextZone = ZONES[i + 1] ?? zone;

      if (!ZONES[i + 1] || depth < nextZone.start) {
        const span = Math.max(1, nextZone.start - zone.start);
        const progress = Math.max(0, Math.min(1, (depth - zone.start) / span));

        return { zone, nextZone, progress };
      }
    }

    return { zone: ZONES[3], nextZone: ZONES[3], progress: 1 };
  }

  static lerpColor(a, b, t) {
    return a.map((channel, index) => Math.round(channel + (b[index] - channel) * t));
  }

  static toRgb(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }
}
