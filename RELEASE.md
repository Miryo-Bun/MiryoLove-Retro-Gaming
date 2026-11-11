# OMEGA STATION — Release Notes

**MiryoLove Retro Gaming**

OMEGA STATION is an original retro first-person shooter inspired by classic 1990s FPS games.

## Features

- 10 episodes and 100 levels.
- 50 environment themes.
- 12 location types.
- 14 weapons.
- Procedurally generated maps using seeds.
- Enemies, items, ammunition, and level progression.
- Navigation assistance.
- Calm mode for a more comfortable experience.
- HTML5, CSS3, JavaScript, Canvas API, and Web Audio API.

## Gameplay and Content

The campaign contains 100 levels across 10 episodes. Environment themes change every two levels.

Locations include laboratories, factories, warehouses, technical corridors, hangars, abandoned residential areas, courtyards, ruins, caves, underground complexes, power stations, and boss arenas.

Maps are generated using seeds. The project includes progression checks for exits and key objectives, while secrets are optional.

## Comfort Features

OMEGA STATION includes a Calm mode intended to provide a more comfortable gameplay experience.

The game also includes sensitivity and visual-effect settings. Camera shake and light flickering are disabled in Calm mode, and flashes are limited.

## Testing

A total of 123 automated tests have been reported as passing:

- 66 newly added tests.
- 57 previously existing tests.

The tests were run in Node.js using stubbed browser-related APIs.

**Important:** These results do not represent full browser testing. Rendering, audio playback, pointer lock, local storage, navigation, performance, and memory usage have not yet been fully verified in real browsers.

## Known Limitations

- Gameplay balance and level design have not undergone human play-testing.
- The engine uses a flat level structure and does not support true multi-storey rooms.
- Lifts and moving platforms are not implemented.
- No new bosses were added in this release.

## Running the Game

Python 3 is required.

From the repository root:

```bash
cd "OMEGA STATION"
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser.

Press `Ctrl+C` to stop the server.

## License

OMEGA STATION is distributed under the **GNU General Public License v3.0 only (GPL-3.0-only)** unless otherwise stated.

See the repository's [LICENSE](LICENSE) file for details.

---

**MiryoLove Retro Gaming**

_Retro games. Classic spirit. Freedom through technology. ❤️_
