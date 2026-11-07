# 🌊 Deep Sea Diver

> An endless descent underwater arcade game — how deep can you go?

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![HTML5 Canvas](https://img.shields.io/badge/HTML5_Canvas-E34F26?style=flat&logo=html5&logoColor=white)

**[▶ Play Live](https://deep-sea-diver.vercel.app)**

---

## 🎮 Gameplay

Dive as deep as possible through four increasingly hostile ocean zones. Collect GlowFish to replenish oxygen, grab ElixirShells for a temporary shield, and survive the creatures lurking in the dark.

The deeper you go, the faster your oxygen drains — and the more dangerous it gets.

---

## 🌍 Ocean Zones

| Zone | Depth | Description |
|------|-------|-------------|
| 🟦 **SUNLIT** | 0 – 400m | Bright tropical waters, gentle creatures |
| 🔵 **TWILIGHT** | 400 – 900m | Deep cobalt blue, jellyfish start appearing |
| 🟣 **MIDNIGHT** | 900 – 1600m | Dark indigo, anglerfish hunt you |
| ⚫ **ABYSS** | 1600m+ | Near-black deep water, maximum danger |

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| `↑ / W` | Dive down faster |
| `↓ / S` | Slow descent / rise |
| `← / A` | Move left |
| `→ / D` | Move right |
| `P` | Pause / Resume |

---

## 🐠 Creatures

- **GlowFish** — collect to restore +15% oxygen and earn points
- **Jellyfish** — drift sideways, deal 1 damage on contact
- **Anglerfish** — lurk in the dark, chase you on sight, deal 1 damage
- **ElixirShell** — rare collectible (8% chance below 300m), grants 10s shield that destroys enemies on contact

---

## ⚙️ Tech Stack

- Vanilla JavaScript (ES6 classes)
- HTML5 Canvas 2D
- Vite (build tool)
- No frameworks, no dependencies

---

## 🚀 Run Locally

```bash
npm install
npm run dev
```

---

## 🏗️ Project Structure

```
src/
├── core/           # GameObject, Vector2, InputManager, Camera
├── entities/       # Player, GlowFish, Jellyfish, Anglerfish, ElixirShell
├── managers/       # SpawnManager, DepthManager
└── ui/             # PauseMenu
```
