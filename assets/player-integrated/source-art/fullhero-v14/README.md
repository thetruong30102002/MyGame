# Complete character source contract

Every cell contains the entire clothed character, including the same haircut,
face, outfit, hands and (where applicable) exactly one held weapon. The exporter
does not assemble body parts or weapons.

## Native geometry

- Logical canvas: **144 × 144**, foot root **72,128**, PPU **48**.
- Visible standing person: **73–74 native pixels**, matching the PixelLab hero.
- Directions by row: **S, E, N, SE, NE**. Westward directions are exact raster flips.
- Keep the foot root and anatomical proportions fixed across every action.
- The larger canvas provides space for a raised sword; it does not enlarge the body.

## Sheets

The registration JSON starts with 14 real drawn sheets:

| Sheets | Columns | Contents |
| --- | ---: | --- |
| idle-none, idle-sword, idle-staff | 4 | Complete breathing / resting poses |
| walk-none, walk-sword, walk-staff | 8 | Complete walking cycle |
| run-none, run-sword, run-staff | 8 | Genuine running cycle |
| attack-sword | 12 | Complete sword strike, including its held sword |
| cast-staff | 12 | Complete casting cycle, including its held staff |
| reactions-none, reactions-sword, reactions-staff | 12 | Columns 0–3 hit, 4–7 dodge, 8–11 death |

Each sheet has five direction rows. `groups` in the JSON selects column ranges;
multiple actual clips can therefore share one source sheet.

## Registration

Each sheet records `rawRegistration[direction]`: one **uniform whole-row**
scale and translation, reused for every phase. The row's traced crown/boot
landmarks and original source coordinates remain in its registration report.
Individual frame bounding boxes never determine their scale. Source margins are
cut explicitly, with padded whole-actor extraction to exclude neighbouring blades.
One coverage resample, binary alpha and a shared palette preserve thin diagonals.
The final runtime sprites use point sampling.

Sheets drawn using a smaller reference canvas must declare `referenceSize` and
`referenceRoot`. For example, a native 112-square reference with root 56,100 is
padded onto 144-square at offset 16,28; a 73-pixel body remains 73 pixels.

The configuration initially keeps colour reduction at one shared 128-colour
palette. No alpha smoothing, anatomy masks, hair layers, equipment anchors or
independent weapon transforms are supported.

## Export / import

```powershell
python packages/asset-pipeline/scripts/export-player-integrated.py
```

Outputs use the existing standard character schema:

- `assets/characters/player_integrated/player_integrated.png`
- `assets/characters/player_integrated/player_integrated.json`
- `assets/characters/player_integrated/player_integrated.provenance.json`
- One updated entry in `assets/manifest.json`.

The atlas trims transparent space and preserves the original logical root.
Packing verifies exact RGBA reconstruction. Missing genuine core clips fail the
production export. `--allow-pending --no-merge` supports local partial review.

Unity entry points:

- `Aether.Importer.IntegratedCharacterRelease.ImportBatch`
- `Aether.Importer.IntegratedCharacterRelease.BuildWindowsBatch`
- `Aether.Importer.IntegratedCharacterRelease.BuildAndroidBatch`

Release builds temporarily move only imported legacy Mannequin Resources outside
Resources, preserve their GUIDs, and restore the folder afterward. No source or
history is deleted. Set source `artApproved` only after reviewing the actual full
frames; the release wrapper validates provenance and the required core clips.
