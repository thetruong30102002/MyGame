# V14 — Lữ khách with a complete new hairstyle and premium skin

## Selected artwork

The selected character is `player_integrated`. Built-in ImageGen drew the new
complete character, using the existing PixelLab character artwork and walking
poses as references. Hair, face, clothing, hands and each held weapon are painted
together in every source frame. The haircut is smoky silver, layered and swept
to the side. The outfit is navy and gold with compact silver shoulders and boots.

There are 14 source sheets: 600 painted poses across S/E/N/SE/NE, expanded by
exact complete-frame reflections to 960 logical eight-direction frames. Idle
has 4 frames, walking and genuine running have 8, sword attack and staff casting
have 12. Hit, dodge and death each have 4 frames per held state; revive reverses
the complete death frames. Each held frame contains one sword or one staff.

Sources and exact prompts: `assets/player-integrated/source-art/` and
`assets/player-integrated/source-art/fullhero-v14/`. Rejected candidates are
separate from the selected `*-drawn.png` inputs.

The standard character atlas is `assets/characters/player_integrated/`, using
144-square logical cells, root72/128, PPU48, a native 73-pixel adult reference,
binary alpha and one shared 128-colour palette. Each source row uses a fixed
uniform complete-frame registration. Atlas trimming preserves the logical root.
The final atlas is 2048-square. Runtime character rendering uses one body sprite.

## Runtime and verification

- New complete character is the default for local and remote player visuals.
- Experimental modular character/hair/outfit selectors are disabled.
- Sword/staff selection uses complete corresponding movement and combat clips.
- Windows build **426376**, Android build **426386**; public version
  **2026.10.24-0930**.
- Windows build exited0. Integrated runtime exited0: 672 core frames checked
  across all8 directions, one body renderer, fixed logical canvas/root/PPU/scale,
  remote default, sword release/hit and staff release/projectile/hit.
- UI runtime exited0. Inventory portrait and default identity share the complete
  character. Same-camera photographs compare idle/walk/strike with original Mira:
  nominal body73/71, PPU48/48, world scale1/1 and equal footY.
- Android build exited0. Package `com.nttrg.aether`, ARM64, minSDK25; signature,
  ZIP alignment and previous-release signer compatibility passed. No Android
  device was connected, so this does not claim device gameplay verification.

Evidence, package hashes and release receipts are under
`.aether-stage/wholehero/v14/`. Production database data remains in place.

## Download routes

Public server: `https://admin.tail024813.ts.net/game/`.
`api/client/latest/windows`, `windows-zip` and `android` returned200 with exact
new package lengths. Landing and download-page buttons serve these verified new
binaries directly. Announcement #10 and the static news fallback contain the
new release notice.

Google Drive mirror upload is **pending**: the shared rclone Google API project
returned403 `rateLimitExceeded` (per-project queries/minute) after upload chunks.
Bounded HTTP/1 retries also failed. The existing file identities/content remain
at V13; they are not presented as current downloads. The in-app browser is open
on the exact release folder, but its Google session is not signed in. Owner login
is required to upload replacement versions through that browser. No credentials,
new OAuth app or purchase is requested.
