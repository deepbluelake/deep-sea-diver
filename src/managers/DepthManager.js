const ZONES = [
  {
    // Bright tropical teal-blue
    name: 'SUNLIT',
    start: 0,
    top: [0, 180, 210],
    bottom: [0, 100, 175],
  },
  {
    // Deep cobalt blue — starts at 400m instead of 250m
    name: 'TWILIGHT',
    start: 400,
    top: [10, 55, 130],
    bottom: [5, 25, 95],
  },
  {
    // Dark indigo-purple — starts at 900m instead of 600m
    name: 'MIDNIGHT',
    start: 900,
    top: [18, 8, 72],
    bottom: [10, 4, 52],
  },
  {
    // Near-black deep blue — starts at 1600m instead of 1000m
    name: 'ABYSS',
    start: 1600,
    top: [6, 2, 28],
    bottom: [2, 1, 16],
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
    // Full darkness now reached at 2200m instead of 1100m — colours last much longer
    const normalizedDepth = Math.min(depth / 2200, 1);
    const smooth = normalizedDepth * normalizedDepth * (3 - 2 * normalizedDepth);

    return smooth * 0.85;
  }

  static getZoneName(depth) {
    if (depth >= 1600) {
      return 'ABYSS';
    }

    if (depth >= 900) {
      return 'MIDNIGHT';
    }

    if (depth >= 400) {
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
