# V13 character frame contract

## Complete body masters

Each hairstyle is a complete adult body sprite, including its face and hair.
Runtime never adds a separate skull, face or hair layer in this catalog mode.
Male and female bodies have three styles: `chestnut_short`, `silver_swept`, and
`brown_ponytail`. Their underwear is part of the complete body master.

Authored frames use a 144 × 144 canvas, with feet at `[72, 128]`. The exported
logical canvas is 176 × 176, root `[88, 152]`, 48 pixels per Unity unit, and
ordinary standing body height 74 pixels. Hair volume may extend above that
height. Sprites use binary alpha, nearest filtering, and one shared palette of
at most 64 colors. Do not fit or resize individual limbs, heads, or frames.

| Action | Frames per direction | Playback |
| --- | ---: | ---: |
| Idle | 1 | 6 fps |
| Walk | 8 | 9 fps |
| Run | Same eight drawn walk poses | Catalog run cadence |
| Sword attack | 9 | 12 fps, hit frame 5 |
| Staff cast | 6 | 8 fps, release frame 3 |

Draw S, E, N, SE and NE. W, SW and NW are exact pixel reflections of E, SE and
NE, including gear, weapons, hand overlays and slash trails. Reflect grip
coordinates at the same time. A west-facing weapon must not be independently
rotated and rasterized from a new angle.

## Equipment

Clothes reference the same action, direction and phase as the body. The three
slots are upper, pants and boots. Every slot has its own frame for each pose;
the 13 item choices include shared base drawings and color variants. Equipment
is shared across male/female and hairstyle bodies. Body masks remove covered
underwear; clothes do not contain a second face, hair, bare arm or baked boot.

Sword and staff are rigid sprites registered to actual palm coordinates. The
hand overlay covers the hilt. Occluded hands are explicitly marked; they must
not become visible foreground fingers. The sword attack raises both arms above
the head, strikes downward, then recovers. Curved slash trails appear only in
the strike phases.

## Export and import

The source manifest is `assets/mannequin/v13/source-art/authored/manifest.json`.
Run from the repository root:

```powershell
npm run mannequin:warden -w @aether/asset-pipeline
npm run test:warden -w @aether/asset-pipeline
npm run review:warden -w @aether/asset-pipeline
```

The four 2048 × 2048 atlas pages use compact crops. Every slice records its
original logical rectangle. Unity reconstructs the pivot from that rectangle;
it must not center the cropped image. Identical cells share one physical Unity
Sprite through `aliases.json`, while all logical frame names remain available.

Build using `Aether.Importer.NativeBodyRelease.BuildWindowsBatch` or
`BuildAndroidBatch`. These entry points import V13 and item icons before
building. The older `GameSetup` batch entry points do not import this artwork.

## Release verification

The shipped-pixel test checks body/action completeness, the shared palette,
compact crop pivots, alias geometry and exact reflected layers. The existing
Windows player test exercises inventory, all supported body/action bindings,
equipment combinations, grip/weapon rendering and actual combat timing.

Review the exported contact sheets and actual player screenshots separately.
Passing a data test does not approve the art. Keep a release receipt with the
reviewed catalog hash, exact Windows/Android build numbers and artifact hashes.
Publish the landing-page announcement only after the builds and Drive upload
have been verified.
