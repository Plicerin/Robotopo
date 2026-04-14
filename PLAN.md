# Robotopo: "Build Tray" Assembly Strategy

This document outlines the proposed transition from a strict horizontal/vertical match assembly system to a modular, set-collection "Build Tray" system.

## ⚙️ Core Concept: The Build Tray
Instead of requiring a vertical stack (Head-Torso-Legs) to trigger a robot attack, the player collects components across the board in any order.

### 1. The Collection Mechanics
- **Collection**: Matching a robot part (or matching it with its corresponding color) "captures" that part into a UI **Build Tray**.
- **Parts Required**: A full set consists of **4 Pieces**:
    1.  **Head** (Vortex, Hammer, or Laser)
    2.  **Torso** (Sensor, Wild, or Random)
    3.  **Legs** (Soldier, Scout, or Titan)
    4.  **Weapon** (Saw, Gatling, Rocket, or Laser - *Modular*)
- **Any-Order**: Parts can be collected in any sequence with no board-position requirements.

### 2. High-Impact Moves
- **Magnet Pulse (Omni-Pull)**: Matching 4+ pieces triggers a high-intensity "Omni-Pull" that slides other robot parts on that row into holes.
- **Leveling**: Parts on the board can level up (LV1 -> LV2 -> LV3 -> LV4 -> MAX) before being collected.
- **MAX Pieces**: Collected MAX pieces provide a significant power multiplier to the final assembled robot attack.

## � Current Implementation Status (Workbench v2)
- [x] Dual-mode Match Engine: Color matches clear board; exact-type matches fill tray.
- [x] Multi-color "Mixed Chassis" Support: Majority-rules attack color; ultimate mono-color bonuses.
- [x] Power Scaling (3-8 parts): Match length (3-8) directly scales the attack magnitude.
- [x] Dynamic Asset System: Using Blue Robot parts as base images with real-time hue-tinting for other colors.
- [ ] Asset Replacement: Replace tinted versions with unique color-specific artwork (Green, Orange, Purple, Yellow) as they are finished.

## �🛠️ Visual & UI Requirements
- **The Workbench**: A dedicated side-panel UI showing the 4 slots.
- **Assembly Animation**: Once the 4th piece is collected, the board pauses for a high-quality assembly sequence involving the chosen parts.
- **Modular Variety**: The "Weapon" slot determines the attack pattern (AOE, Piercing, Multi-Target, or Bottom-Clear).

## 🚀 Technical Implementation Notes
- **State Sync**: Uses the `levelUps` vs `positions` logic in `MatchResult` to ensure parts are either leveled up OR collected/cleared atomically.
- **Assets**: Already integrated high-res PNGs for Battery, Bolt, Chip, Fuse, and Gear.
- **Name**: Project rebranded to **Robotopo**.
