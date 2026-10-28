# Lữ khách — complete painted skin

Art backend: built-in ImageGen. Existing PixelLab artwork supplies the style,
proportion and walking-pose references. The new finished raster drawings are
not described as PixelLab generations.

All 14 sheets contain complete clothed people with their hair, hands and held
weapon already painted into each frame. Neutral stick figures and original
walk contacts are pose references only and are never shipped as game sprites.

The silver layered haircut is painted into each complete head, across all
directions and actions. Each held state contains one sword or one staff.

Native reference: 73-pixel adult, 144-square canvas, foot root 72/128, PPU48.
Directions S/E/N/SE/NE are drawn; west-facing counterparts are exact whole-frame
reflections. Row registration is one fixed uniform scale and translation for
every frame in that row. Bending, stepping and lying frames retain their pose
bounds; no individual pose is fitted to a new bounding box.

Source extraction retains the connected complete actor in a padded source
cell, excluding neighbouring figures' blade fragments. One uniform coverage
resample prevents narrow diagonal blades from becoming dotted. Final alpha is
binary and all actions share one 128-colour palette; runtime uses point sampling.
No body-part masks, pasted heads, detached hands, weapon anchors, mesh warps or
modular outfit overlays are used.

Final prompts are kept beside these notes and in sword-provenance/. Staff
prompts are also beside the corresponding source PNGs. The sword attack uses
attack-guided-final.prompt.txt followed by attack-head-correction.prompt.txt.
The staff cast uses staff-cast-guide03.prompt.txt. Rejected candidates remain
separate from the selected `*-drawn.png` files for provenance.
