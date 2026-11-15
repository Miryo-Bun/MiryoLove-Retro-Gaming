<p align="center">
  <a href="README.md">🇬🇧 English</a>
  &nbsp; | &nbsp;
  <a href="README.ru.md">🇷🇺 Русский</a>
</p>

<h1 align="center">🎮 MiryoLove Retro Gaming</h1>

<p align="center">
  <strong>MiryoLove Product</strong>
  <br>
  <em>Retro games. Classic spirit. Freedom through technology. ❤️</em>
</p>

---

**MiryoLove Retro Gaming** is an open-source gaming initiative by MiryoLove dedicated to retro-inspired games, classic gameplay, and independent game development.

Our goal is to preserve the spirit of classic gaming and bring it into modern open-source projects.

## 🎮 Games

### OMEGA STATION

**OMEGA STATION** is an original retro first-person shooter inspired by classic 1990s FPS games.

**Features:**

- Raycasting-based pseudo-3D graphics.
- Pixel-art visual style.
- 3 story episodes and 36 individually named levels.
- 36 deterministic, level-specific blueprints with rectangular maps from 53×55 to 81×79.
- 16 architecture generators with different construction rules: industrial bays, technical spine, research wings, ring concourse, maintenance maze, atrium branches, cargo aisles, security checkpoints, multi-wing, dense room web, long facility, zone network, asymmetric campus, reactor radial, open yard, and organic hive.
- Twelve environmental identities—production, research, reactor, military, logistics, residential, maintenance, communications, underground, experimental, biohazard, and infernal—affect wall materials, floor/ceiling palettes, and light level.
- Three episode art packs—Industrial Nightmare, Biohazard, and Infernal Dimension—with pixel materials for metal, organic surfaces, stone, and grating.
- Secrets, keycards, themed bridge/stair floorways, and paired lift pads that transport between map sectors. True vertical geometry is not supported by the existing single-floor raycaster.
- 50 environment themes.
- 12 location types.
- 15 weapons, including a contact-damage chainsaw with an engine sound.
- Enemies, interactive items, and ammunition systems.
- Three unique bosses, campaign saves, level statistics, and unlocked-level selection.
- Deterministic generation with reproducible seeds, alternate branches, optional key doors, secrets, paired elevator pads, and enemy placement.
- Retro HUD, 36 procedural music arrangements, episode ambience, enemy sound cues, and pixel-blood decals.
- Calm mode for a more comfortable experience.

## 🚀 Running the Game

Python 3 is required.

**Windows:**

```bash
cd "OMEGA STATION"
python -m http.server 8000
```

**Linux:**

```bash
cd "OMEGA STATION"
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

Press `Ctrl+C` to stop the server.

### Level-generation validation

With the same server running, open [http://localhost:8000/tools/level-validation.html](http://localhost:8000/tools/level-validation.html). The page generates and renders 100 seeded maps and reports room-size buckets, corridor tiles, junctions, dead ends, graph cycle rank, secrets, map dimensions, key/exit reachability, and elevator endpoints. It also checks the 36 runtime `Level` instances.

Near-duplicates are compared using normalized spatial occupancy (including rotations and reflections) and a structural graph signature; a spatial Jaccard score of 0.94 or higher with a matching graph signature is flagged. The checked 100-map seed batch had 0 unreachable exits, disconnected components, or near-duplicates. The 36 default campaign maps also passed key/exit progression and runtime-level checks. Examples include the ring concourse in *The Beginning*, the cargo aisles in *Research Laboratory*, and the maintenance maze in *Maintenance Tunnels*.

## 🛠️ Technologies

- HTML5
- CSS3
- JavaScript
- Canvas API
- Web Audio API

## 🚀 Philosophy

- Open-source game development.
- Freedom to study, modify, and distribute software.
- Original games and independent creativity.
- Preservation of classic gaming spirit.

## 📜 License

Original games and source code in this repository are licensed under the **GNU General Public License v3.0 only (GPL-3.0-only)** unless otherwise stated.

See [LICENSE](LICENSE) for details.

Third-party components and assets may have separate licenses, which must be respected.

## ❤️ MiryoLove

<p align="center">
  <strong>Freedom through technology. ❤️</strong>
</p>
