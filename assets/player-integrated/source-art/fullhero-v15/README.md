# V15 complete-motion sources and mechanical assembly

Production atlas is unchanged until an explicitly approved export.

## Exact references

`references/index.json` binds each idle frame to the saved V14 baseline atlas. `idle-{none,sword,staff}-{S,E,N,SE,NE}-4x.png` are literal nearest enlargements of frame 0. Matching `walk-guide-{state}-{direction}-2x.png` contain the original eight complete PixelLab walk poses. `run-guide-{direction}-2x.png` contain eight neutral run-pose skeletons. These guides are reference only.

## Trace candidates

The trace tool supports eight walk/run poses in a 4×2 layout, twelve attack/cast poses in a 4×3 layout, or sixteen combined walk/run poses in a 4×4 layout. Combined locomotion takes the first eight for walk and last eight for run. Every frame must contain one complete connected clothed actor with its held weapon.

```powershell
python packages/asset-pipeline/scripts/prepare-integrated-v15.py trace --file assets/player-integrated/source-art/fullhero-v15/walk-sword-S-drawn.png --state sword --direction S --kind walk
```

Trace detects whole actors globally, so uneven row spacing and weapons entering a neighboring nominal cell do not cut the actor. It rejects an unexpected number of substantial actors. The tool proposes a uniform whole-sprite scale from neutral crown/sole measurements, fixed row foot baselines, and a fitted source-column grid. Source grid tracing changes placement only; it does not resize individual frames or body parts.

Review `traces/<candidate>/trace.json`, `frame-checks.json`, and native/nearest-4× contacts. Override the proposed `registration` values only to correct source-grid/crown/sole measurements. A pose such as a crouched run must not be individually enlarged to fill idle height. `--neutral '[0,7]'` selects representative source measurements; `--overrides` accepts a JSON registration override. Both `artApproved` and `registrationApproved` initially remain false.

After adjusting measurements, rerender the analysis:

```powershell
python packages/asset-pipeline/scripts/prepare-integrated-v15.py review --trace assets/player-integrated/source-art/fullhero-v15/traces/walk-sword-S-drawn/trace.json
```

## Assemble after all drawings pass review

A selection file contains the accepted trace paths relative to this directory, for example:

```json
{"traces":[{"path":"traces/walk-sword-S-drawn/trace.json","approved":true}]}
```

The active premium family covers sword/staff walk/run plus attack and cast, in all five authored directions: thirty accepted traces. The old unarmed idle/walk/run/reaction clips remain unchanged as internal compatibility data; they are not new approved art or an active visual family. Each selected trace must explicitly approve both art and registration. Assembly rejects logical clipping or duplicate/missing direction selections.

```powershell
python packages/asset-pipeline/scripts/prepare-integrated-v15.py assemble --selection assets/player-integrated/source-art/fullhero-v15/selection.json
```

This creates native 144×144-cell canonical sheets and a V15 registration copy. It keeps the V14 idle/reaction sources and locks the exact baseline idle frames and palette through `paletteReference`. Final registration retains `artApproved:false` until the complete combined family is reviewed. Assembly does not run the production exporter, Unity importer, build or publication.
