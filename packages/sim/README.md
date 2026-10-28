# @havenlord/sim

Lõi luật chơi THUẦN (không Pixi / DOM) dùng chung cho web và máy chủ — mốc M3 (`docs/ke-hoach-m3-may-chu-chien-dau.md`):
dữ liệu kỹ năng (`skills`), luật đòn (`skillRules`), cây tiềm năng (`talents`), luật boss (`bossRules`), trang bị (`equipment`).

- Import theo đường con: `import { HERO_SKILLS } from '@havenlord/sim/skills'`.
- Import tương đối TRONG gói phải ghi đuôi `.ts` (`./skillRules.ts`): máy chủ biên dịch theo NodeNext.
- Web giữ file cũ ở `apps/web/src/game/...` dạng chuyển tiếp (`export * from '@havenlord/sim/...'`).
