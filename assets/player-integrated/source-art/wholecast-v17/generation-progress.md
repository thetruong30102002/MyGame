# Wholecast V17 animation work

Complete characters with baked clothing, hair and one weapon. The native master is 112x112, root (56,100); runtime export pads the complete actor to 144x144, root (72,128), 48 PPU. Each direction/action uses one uniform actor scale and nearest-neighbor sampling. Crouched running poses must not be enlarged to fill the standing silhouette.

Core scope: sword and staff; idle master, 8 walk phases, 8 run phases, 12 combat phases; 5 authored directions and 3 whole-frame reflections. Bow, spear and shield are planned roles, not authored animations.

All 30 core source sheets have been generated, registered and exported as two candidate atlases (232 frames each). Revisions correct the sword south-run camera, north locomotion weapon-side switching, source-edge sword tips and north attack anatomy. See registration-notes.md for exact selection/reflection details. Native cards were inspected; all selected sources clear the source-edge/canvas clipping check. Atlas round-trip verification preserves all 464 frames byte for byte. The interactive review is review/index.html. These are core motion candidates, not a production import or release; no lifecycle/reaction clips are claimed.

Built-in ImageGen is used for drawing. Python only extracts, uniformly registers, reflects and packs whole sprites; it must not repaint or assemble body parts.
