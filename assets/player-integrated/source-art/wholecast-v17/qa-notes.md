# Core animation candidate review

- Inspected native master comparisons for both characters, five authored directions, walk/run/combat. Revised sword south run, north locomotion and south/east/north attacks before export. Whole-frame reflections supply west-facing clips.
- All 30 selected sheets cleared source-edge and final-canvas clipping checks. Rejected original sheets remain as source history and are excluded by registration-options.json.
- All 464 exported frames round-trip from trimmed atlas rectangles to native RGBA byte for byte. Packing does not introduce blur. No palette quantization or interpolated scaling is used in this export.
- Review JavaScript passes syntax compilation. Browser review visibly renders both role choices, eight-direction controls, pause and manual frame stepping. Screenshot saved as review/review-screen.png.
- Review is for the core animation set. Static idle is one pose. Trúng đòn/né/gục and other lifecycle clips are not authored here. Production manifest, Unity import and release are not changed; artApproved remains false. Technical pixel preservation must not be described as an artistic approval or proof of identical anatomy in separately drawn poses.
