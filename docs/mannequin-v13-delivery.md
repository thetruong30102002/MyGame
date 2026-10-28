# V13 — 23/10/2026

Published to the existing Drive files and live update service. Landing-page
announcement **#9** was published at **21:35, 23/10/2026 (Asia/Saigon)**.
The public manifest and news were independently verified after publication.

## Builds

- Windows **425654**, Unity IL2CPP, version `2026.10.23-2122`.
- Android **425663**, ARM64, Android 7.1/API 25 or newer, version
  `2026.10.23-2130`.
- Local Windows launcher: `Chay-Ngan-Lam.cmd`, now points to
  `UnityGame/Build/Windows/Aether.exe`.

## Character system

Complete male/female body frames include the face and hair. Three appearance
choices use their own complete bodies: chestnut short, silver swept and brown
ponytail. The female ponytail sits low at the nape. There is no separate runtime
head or wig layer.

Standing, walking and combat use the same native body proportions, root and
PPU. Clothes follow the current action/direction/frame. Thirteen item choices
cover five tops, four pants and four boots. Sword attacks have nine frames with
an overhead two-handed chop; staff casts have six frames. Walking has eight
foot poses, also used at the running cadence.

Five directions are drawn. The other three reflect the complete raster,
including equipment, hands, weapons and the curved slash trail. Carried staff
angles keep the orb away from the face while retaining the actual palm grip.

See `mannequin-v13-standard.md` for the export and import contract. Final export:
four 2048 atlases, 6,448 physical sprites and 26,496 logical names.

## Verification

- Windows and Android production build processes both exited 0.
- Shipped atlas checks: **9,024** exact reflected-layer comparisons passed;
  shared 64-color palette, binary alpha and compact sprite pivots checked.
- Staff: **1,088** actual palm/hilt contact checks passed.
- Actual atlas inspection confirmed preserved face/skin, corrected silver
  crown/nape and attached low ponytail.
- Final Windows player test exited 0: **979 screenshots**, equipment changes,
  all complete-body hairstyle bindings, eight-direction movement and combat.
- UI test exited 0: **40 screenshots**, including Mira, inventory/settings and
  an original NPC beside the new idle/walk/strike body. Both use scale 1 and
  PPU 48; native nominal heights are 74 and 71 pixels.
- APK package/version, ARM64, cryptographic signature and ZIP alignment passed.
  Its signing certificate matches the previous release, preserving upgrade
  compatibility. **No Android device was connected for runtime testing.**

Evidence lives in `.aether-stage/mannequin/v13/` (`art-review.json`,
`runtime-verification.json`, `apk-verification.json`) and the final runtime/UI
screenshot folders beside it. Final native PNG/GIF previews are in
`.aether-stage/mannequin/modular-v13-review/`.

Publication evidence: `release-verified.json`, `announcement-published.json`
and `parent-public-verification.json` in the same V13 evidence folder. Drive
file IDs and final binary hashes were verified; the existing demo was kept.

## Download locations

- [Windows installer](https://drive.google.com/file/d/1IEa9-lmmHxEwTUYIRD6oNFnAkmE2O7kJ/view)
- [Android APK](https://drive.google.com/file/d/1K-tv26sy3tRuqbej6OxMXqrx9IE5uLR9/view)
- [Download page](https://admin.tail024813.ts.net/game/tai-game)
- [News](https://admin.tail024813.ts.net/game/tin-tuc)

The landing-page buttons now select the appropriate individual Drive file.
Use **Thử chiêu → Ngân Lam mới** to inspect the full equipment kit. Mira offers
the three complete-body hairstyle choices in the main game.
