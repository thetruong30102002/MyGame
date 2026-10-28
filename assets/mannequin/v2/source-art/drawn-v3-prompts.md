# ImageGen production prompt set — 22 October 2026

Tool: built-in `image_gen.imagegen`, `transparent_background=true`. All returned source files are kept in this project. The following is the normalized prompt set; the raw canvas dimensions are measured, not assumed from requested dimensions.

## Bare body edits

Edit the supplied sprite sheet in place. Preserve every existing character cell, direction, complete pose, head size, body proportions, hand/finger location, leg placement and ground line. Replace all navy coats, scarves/collars, ivory mantles, teal sashes, sleeves/gloves, trousers and boots with fully drawn coherent bare male anatomy wearing only short charcoal boxer shorts, bare hands and bare feet. Draw connected shoulders, chest/back, abdomen, two arms/hands and two legs/feet. Preserve silver/teal hair and full face and chin with no dark face mask. Match the source detailed sharp pixel JRPG rendering with clear pixel clusters and contours. True transparent background; no weapon, effects, text, guides, grid, shadow, additional clothing or watermark. The bare source must register to its clothed counterpart for per-frame equipment layers.

Targets and references:

- `warden-bare-core-v3.png` from `warden-sheet.png`: 8 columns × 8 pose rows, 1254×1254. Only the idle row is used by v3.
- `warden-bare-walk-v3.png` from `warden-walk-frames.png`: 8×4, 1774×887.
- `warden-bare-run-v3.png` from `warden-run-v3.png`: 8×4, 1774×887.
- `warden-bare-attack-v3.png` from `warden-attack-v3.png`: 8×7, 1267×1241.
- `warden-bare-cast-v3.png` from `warden-cast-frames.png`: 8×4, 1774×887.

## Running source

Create the running counterpart of the walking sheet, same silver/teal hero, navy gold-trim coat, ivory mantle, teal sash, trousers and brown boots. Same eight directions and four phase rows, body scale and clean pixel art. Natural lean, hips and shoulders rotate, active knees, longer stride, elbows bent, fists ready for a separate weapon. Phases: left drive, passing/airborne, right drive, opposite passing. Full clear face/chin; no mask, weapon, effects, text, grid or watermark; real transparent background.

## New attack source

Use the navy silver-haired hero as identity/style reference and the original game's brown-haired hero's eight-frame `attack` contact sheet as the required motion study. Trace the economical slash choreography: initial hand low beside hip, compact torso coil, sword hand across the front of torso at waist/chest height, committed horizontal cut with torso twist, follow-through, controlled return. Empty gripping fist, no sword drawn into body. Avoid an overhead raised arm, punching, waving or repeated elbow flapping. Eight directions across columns, consistent anatomy and head size, all full bodies grounded, detailed sharp pixel JRPG art, transparent background, no effects or labels. Eight phase rows were requested; the tool returned seven usable phase rows, recorded as seven in the pipeline.

## Silver equipment edits

Edit each supplied clothed sprite sheet in place. Preserve all poses, directions, exact head/face/hair, body proportions, hand/finger locations, arm/leg placement, baseline and cell positions. Replace the entire navy outfit with a coherent fitted silver armor suit: integrated silver breastplate, modest rounded shoulder plates naturally connected to articulated sleeves/elbows/forearms, restrained gold trim, small turquoise chest jewel, dark chainmail trousers/greaves and silver armored boots. Draw the armor as the same complete coherent body in this pose, not a pasted equipment icon or floating plates. Fully replace old coat, ivory mantle, teal sash and boots. Neckline below full clear chin; no face mask, extra limbs, weapons, effects, shadows, text, grid or watermark. Sharp clear pixel clusters, actual transparent background, same source canvas shape and layout.

Outputs `warden-silver-core/walk/run/attack/cast-v3.png` use their corresponding clothed sources. Canvas/grid sizes match the bare edits above. Native sheets and metadata are in `authored-v3/`; later registration uses one fixed eight-direction head set to avoid generation-related head scale changes.
