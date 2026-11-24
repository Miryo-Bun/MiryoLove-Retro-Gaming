# RetroCity Open World — Release Notes

## Release Status

RetroCity is distributed as a standalone top-down 2D game while preserving the existing project structure:
world map, districts, interiors, vehicles, NPCs, missions, economy, wanted system, saves, and UI.

This release is prepared for publication in the MiryoLove Retro Gaming repository.

## What's New

- Economy converted to Russian rubles with the `₽` symbol.
- Save format v4 with validation of required player data.
- Legacy and corrupted saves are not loaded again.
- Improved wanted system: threat-based police response, witness reports, escalation, last-known-location tracking,
  and search behavior after line of sight is lost.
- Cinematic cutscenes for key campaign moments with camera movement, view changes, subtitles,
  sound effects, and skip support.
- Existing campaign, shops, garage, dealership, bank, hospital, police, time-of-day cycle, and weather remain intact.
- Controllable helicopters retain altitude, fuel, damage, and landing state.
- Real estate can be purchased and generates passive income.

## Running the Game

### Windows

```bat
cd RetroCity
run.bat
```

Or:

```bat
cd RetroCity
python -m http.server 8000
```

### Linux

```bash
cd RetroCity
./run.sh
```

Or:

```bash
cd RetroCity
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser.

## Controls

| Action | Control |
|---|---|
| Move | WASD or arrow keys |
| Run | Shift |
| Action / enter vehicle or building | E |
| Inventory | I |
| Quick heal | H |
| Switch weapon | Q / R |
| Fire or melee | Left mouse or Space |
| Vehicle control | W/S/A/D, Space |
| Map | N |
| Save | F5 |
| Pause | Esc |
| Skip cutscene | Space or Enter |

## Saves

- Browser storage primary key: `retrocity3d_save`.
- A backup key is written when a subsequent save is created.
- Save progress is validated before loading.
- Legacy versions are not imported.
- On the first launch of an updated build, legacy player-progress keys are cleared.
- Developer settings, source files, and game resources are not player saves and are not removed.

## Pre-Publication Checks

Before release, verify:

- launch through a local HTTP server;
- loading of the main menu and game world;
- character selection and starting a new game;
- creation and reload of a v4 save;
- rejection of legacy or corrupted saves;
- saving of missions, money, vehicles, inventory, real estate, and settings;
- starting and skipping cutscenes;
- all six wanted levels;
- arrest, hospital, and wanted clearance;
- no JavaScript errors in Playwright;
- no keys, passwords, private data, or temporary player saves in release files.

## Known Limitations

- Full schedules for every NPC are not implemented.
- Not every mission in the 50-mission campaign has a completely unique cutscene branch.
- Voice acting is not included; the game uses subtitles and procedural effects.
- Aircraft are world objects and airport scenery rather than fully controllable vehicles.
- Weather accumulation and flame animation may depend on device performance.

## Repository Contents

The playable game is located in `RetroCity`.

The repository must not contain browser-local player saves, test scratch files, or private backups.

## License

The source code is licensed under GPL-3.0-only unless an individual file or third-party asset states another license.
