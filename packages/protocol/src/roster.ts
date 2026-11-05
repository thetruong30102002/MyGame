// Sinh từ roster V18: ID ngoại hình cố định khi tạo nhân vật.
export type PlayerClass = 'sword' | 'bow' | 'staff' | 'spear' | 'shield';
const LEGACY_PLAYER_MODELS = [
	{"id": "player_verdant_sword", "classId": "sword", "gender": "male", "name": "Lục Phong"},
	{"id": "player_sword_m02", "classId": "sword", "gender": "male", "name": "Lam Kiếm"},
	{"id": "player_sword_m03", "classId": "sword", "gender": "male", "name": "Xích Ảnh"},
	{"id": "player_sword_f01", "classId": "sword", "gender": "female", "name": "Thanh Vũ"},
	{"id": "player_sword_f02", "classId": "sword", "gender": "female", "name": "Ngân Kiếm"},
	{"id": "player_sword_f03", "classId": "sword", "gender": "female", "name": "Tử Yên"},
	{"id": "player_staff_m01", "classId": "staff", "gender": "male", "name": "Tinh Vân"},
	{"id": "player_staff_m02", "classId": "staff", "gender": "male", "name": "Mộc Linh"},
	{"id": "player_staff_m03", "classId": "staff", "gender": "male", "name": "Dạ Huyền"},
	{"id": "player_ivory_staff", "classId": "staff", "gender": "female", "name": "Nguyệt Thạch"},
	{"id": "player_staff_f02", "classId": "staff", "gender": "female", "name": "Hỏa Vũ"},
	{"id": "player_staff_f03", "classId": "staff", "gender": "female", "name": "Tuyết Linh"},
	{"id": "player_bow_m01", "classId": "bow", "gender": "male", "name": "Lâm Tiễn"},
	{"id": "player_bow_m02", "classId": "bow", "gender": "male", "name": "Dạ Tiễn"},
	{"id": "player_bow_m03", "classId": "bow", "gender": "male", "name": "Sa Ưng"},
	{"id": "player_bow_f01", "classId": "bow", "gender": "female", "name": "Hoa Tiễn"},
	{"id": "player_bow_f02", "classId": "bow", "gender": "female", "name": "Tử Tinh"},
	{"id": "player_bow_f03", "classId": "bow", "gender": "female", "name": "Kim Yến"},
	{"id": "player_spear_m01", "classId": "spear", "gender": "male", "name": "Hồng Thương"},
	{"id": "player_spear_m02", "classId": "spear", "gender": "male", "name": "Bích Kích"},
	{"id": "player_spear_m03", "classId": "spear", "gender": "male", "name": "Viêm Thương"},
	{"id": "player_spear_f01", "classId": "spear", "gender": "female", "name": "Lam Thương"},
	{"id": "player_spear_f02", "classId": "spear", "gender": "female", "name": "Ngân Nguyệt"},
	{"id": "player_spear_f03", "classId": "spear", "gender": "female", "name": "Mộc Lan"},
	{"id": "player_shield_m01", "classId": "shield", "gender": "male", "name": "Thiết Vệ"},
	{"id": "player_shield_m02", "classId": "shield", "gender": "male", "name": "Cổ Mộc"},
	{"id": "player_shield_m03", "classId": "shield", "gender": "male", "name": "Huyết Thành"},
	{"id": "player_shield_f01", "classId": "shield", "gender": "female", "name": "Băng Vệ"},
	{"id": "player_shield_f02", "classId": "shield", "gender": "female", "name": "Nhật Quang"},
	{"id": "player_shield_f03", "classId": "shield", "gender": "female", "name": "Tử Vệ"},
] as const;
export const PIXELLAB_MALE_MODELS = [
  {
    "id": "player_pl_human_sword_m1",
    "classId": "sword",
    "gender": "male",
    "name": "Nhân tộc",
    "raceId": "human"
  },
  {
    "id": "player_pl_elf_sword_m1",
    "classId": "sword",
    "gender": "male",
    "name": "Elf",
    "raceId": "elf"
  },
  {
    "id": "player_pl_demon_sword_m1",
    "classId": "sword",
    "gender": "male",
    "name": "Ma tộc",
    "raceId": "demon"
  },
  {
    "id": "player_pl_beast_sword_m1",
    "classId": "sword",
    "gender": "male",
    "name": "Thú nhân",
    "raceId": "beast"
  },
  {
    "id": "player_pl_dragon_sword_m1",
    "classId": "sword",
    "gender": "male",
    "name": "Long tộc",
    "raceId": "dragon"
  },
  {
    "id": "player_pl_human_staff_m1",
    "classId": "staff",
    "gender": "male",
    "name": "Nhân tộc",
    "raceId": "human"
  },
  {
    "id": "player_pl_elf_staff_m1",
    "classId": "staff",
    "gender": "male",
    "name": "Elf",
    "raceId": "elf"
  },
  {
    "id": "player_pl_demon_staff_m1",
    "classId": "staff",
    "gender": "male",
    "name": "Ma tộc",
    "raceId": "demon"
  },
  {
    "id": "player_pl_beast_staff_m1",
    "classId": "staff",
    "gender": "male",
    "name": "Thú nhân",
    "raceId": "beast"
  },
  {
    "id": "player_pl_dragon_staff_m1",
    "classId": "staff",
    "gender": "male",
    "name": "Long tộc",
    "raceId": "dragon"
  },
  {
    "id": "player_pl_human_spear_m1",
    "classId": "spear",
    "gender": "male",
    "name": "Nhân tộc",
    "raceId": "human"
  },
  {
    "id": "player_pl_elf_spear_m1",
    "classId": "spear",
    "gender": "male",
    "name": "Elf",
    "raceId": "elf"
  },
  {
    "id": "player_pl_demon_spear_m1",
    "classId": "spear",
    "gender": "male",
    "name": "Ma tộc",
    "raceId": "demon"
  },
  {
    "id": "player_pl_beast_spear_m1",
    "classId": "spear",
    "gender": "male",
    "name": "Thú nhân",
    "raceId": "beast"
  },
  {
    "id": "player_pl_dragon_spear_m1",
    "classId": "spear",
    "gender": "male",
    "name": "Long tộc",
    "raceId": "dragon"
  },
  {
    "id": "player_pl_human_bow_m1",
    "classId": "bow",
    "gender": "male",
    "name": "Nhân tộc",
    "raceId": "human"
  },
  {
    "id": "player_pl_elf_bow_m1",
    "classId": "bow",
    "gender": "male",
    "name": "Elf",
    "raceId": "elf"
  },
  {
    "id": "player_pl_demon_bow_m1",
    "classId": "bow",
    "gender": "male",
    "name": "Ma tộc",
    "raceId": "demon"
  },
  {
    "id": "player_pl_beast_bow_m1",
    "classId": "bow",
    "gender": "male",
    "name": "Thú nhân",
    "raceId": "beast"
  },
  {
    "id": "player_pl_dragon_bow_m1",
    "classId": "bow",
    "gender": "male",
    "name": "Long tộc",
    "raceId": "dragon"
  },
  {
    "id": "player_pl_human_shield_m1",
    "classId": "shield",
    "gender": "male",
    "name": "Nhân tộc",
    "raceId": "human"
  },
  {
    "id": "player_pl_elf_shield_m1",
    "classId": "shield",
    "gender": "male",
    "name": "Elf",
    "raceId": "elf"
  },
  {
    "id": "player_pl_demon_shield_m1",
    "classId": "shield",
    "gender": "male",
    "name": "Ma tộc",
    "raceId": "demon"
  },
  {
    "id": "player_pl_beast_shield_m1",
    "classId": "shield",
    "gender": "male",
    "name": "Thú nhân",
    "raceId": "beast"
  },
  {
    "id": "player_pl_dragon_shield_m1",
    "classId": "shield",
    "gender": "male",
    "name": "Long tộc",
    "raceId": "dragon"
  }
] as const;
// Cỡ NPC 8 hướng (04/11, scripts/export-npc-roster.mts).
export const NPC_MODELS = [
  {
    "id": "player_npc_human1_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Nhân tộc 1",
    "raceId": "human",
    "variant": 1
  },
  {
    "id": "player_npc_elf1_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Elf 1",
    "raceId": "elf",
    "variant": 1
  },
  {
    "id": "player_npc_beast1_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Thú nhân 1",
    "raceId": "beast",
    "variant": 1
  },
  {
    "id": "player_npc_demon1_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Ma tộc 1",
    "raceId": "demon",
    "variant": 1
  },
  {
    "id": "player_npc_human2_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Nhân tộc 2",
    "raceId": "human",
    "variant": 2
  },
  {
    "id": "player_npc_human3_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Nhân tộc 3",
    "raceId": "human",
    "variant": 3
  },
  {
    "id": "player_npc_elf2_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Elf 2",
    "raceId": "elf",
    "variant": 2
  },
  {
    "id": "player_npc_elf3_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Elf 3",
    "raceId": "elf",
    "variant": 3
  },
  {
    "id": "player_npc_demon2_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Ma tộc 2",
    "raceId": "demon",
    "variant": 2
  },
  {
    "id": "player_npc_demon3_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Ma tộc 3",
    "raceId": "demon",
    "variant": 3
  },
  {
    "id": "player_npc_beast2_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Thú nhân 2",
    "raceId": "beast",
    "variant": 2
  },
  {
    "id": "player_npc_beast3_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Thú nhân 3",
    "raceId": "beast",
    "variant": 3
  },
  {
    "id": "player_npc_dragon1_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Long tộc 1",
    "raceId": "dragon",
    "variant": 1
  },
  {
    "id": "player_npc_dragon2_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Long tộc 2",
    "raceId": "dragon",
    "variant": 2
  },
  {
    "id": "player_npc_dragon3_sword_m",
    "classId": "sword",
    "gender": "male",
    "name": "Long tộc 3",
    "raceId": "dragon",
    "variant": 3
  },
  {
    "id": "player_npc_human1_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Nhân tộc 1",
    "raceId": "human",
    "variant": 1
  },
  {
    "id": "player_npc_elf1_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Elf 1",
    "raceId": "elf",
    "variant": 1
  },
  {
    "id": "player_npc_beast1_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Thú nhân 1",
    "raceId": "beast",
    "variant": 1
  },
  {
    "id": "player_npc_demon1_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Ma tộc 1",
    "raceId": "demon",
    "variant": 1
  },
  {
    "id": "player_npc_human2_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Nhân tộc 2",
    "raceId": "human",
    "variant": 2
  },
  {
    "id": "player_npc_human3_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Nhân tộc 3",
    "raceId": "human",
    "variant": 3
  },
  {
    "id": "player_npc_elf2_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Elf 2",
    "raceId": "elf",
    "variant": 2
  },
  {
    "id": "player_npc_elf3_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Elf 3",
    "raceId": "elf",
    "variant": 3
  },
  {
    "id": "player_npc_demon2_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Ma tộc 2",
    "raceId": "demon",
    "variant": 2
  },
  {
    "id": "player_npc_demon3_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Ma tộc 3",
    "raceId": "demon",
    "variant": 3
  },
  {
    "id": "player_npc_beast2_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Thú nhân 2",
    "raceId": "beast",
    "variant": 2
  },
  {
    "id": "player_npc_beast3_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Thú nhân 3",
    "raceId": "beast",
    "variant": 3
  },
  {
    "id": "player_npc_dragon1_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Long tộc 1",
    "raceId": "dragon",
    "variant": 1
  },
  {
    "id": "player_npc_dragon2_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Long tộc 2",
    "raceId": "dragon",
    "variant": 2
  },
  {
    "id": "player_npc_dragon3_staff_m",
    "classId": "staff",
    "gender": "male",
    "name": "Long tộc 3",
    "raceId": "dragon",
    "variant": 3
  },
  {
    "id": "player_npc_human1_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Nhân tộc 1",
    "raceId": "human",
    "variant": 1
  },
  {
    "id": "player_npc_elf1_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Elf 1",
    "raceId": "elf",
    "variant": 1
  },
  {
    "id": "player_npc_beast1_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Thú nhân 1",
    "raceId": "beast",
    "variant": 1
  },
  {
    "id": "player_npc_demon1_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Ma tộc 1",
    "raceId": "demon",
    "variant": 1
  },
  {
    "id": "player_npc_human2_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Nhân tộc 2",
    "raceId": "human",
    "variant": 2
  },
  {
    "id": "player_npc_human3_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Nhân tộc 3",
    "raceId": "human",
    "variant": 3
  },
  {
    "id": "player_npc_elf2_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Elf 2",
    "raceId": "elf",
    "variant": 2
  },
  {
    "id": "player_npc_elf3_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Elf 3",
    "raceId": "elf",
    "variant": 3
  },
  {
    "id": "player_npc_demon2_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Ma tộc 2",
    "raceId": "demon",
    "variant": 2
  },
  {
    "id": "player_npc_demon3_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Ma tộc 3",
    "raceId": "demon",
    "variant": 3
  },
  {
    "id": "player_npc_beast2_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Thú nhân 2",
    "raceId": "beast",
    "variant": 2
  },
  {
    "id": "player_npc_beast3_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Thú nhân 3",
    "raceId": "beast",
    "variant": 3
  },
  {
    "id": "player_npc_dragon1_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Long tộc 1",
    "raceId": "dragon",
    "variant": 1
  },
  {
    "id": "player_npc_dragon2_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Long tộc 2",
    "raceId": "dragon",
    "variant": 2
  },
  {
    "id": "player_npc_dragon3_spear_m",
    "classId": "spear",
    "gender": "male",
    "name": "Long tộc 3",
    "raceId": "dragon",
    "variant": 3
  },
  {
    "id": "player_npc_human1_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Nhân tộc 1",
    "raceId": "human",
    "variant": 1
  },
  {
    "id": "player_npc_elf1_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Elf 1",
    "raceId": "elf",
    "variant": 1
  },
  {
    "id": "player_npc_beast1_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Thú nhân 1",
    "raceId": "beast",
    "variant": 1
  },
  {
    "id": "player_npc_demon1_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Ma tộc 1",
    "raceId": "demon",
    "variant": 1
  },
  {
    "id": "player_npc_human2_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Nhân tộc 2",
    "raceId": "human",
    "variant": 2
  },
  {
    "id": "player_npc_human3_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Nhân tộc 3",
    "raceId": "human",
    "variant": 3
  },
  {
    "id": "player_npc_elf2_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Elf 2",
    "raceId": "elf",
    "variant": 2
  },
  {
    "id": "player_npc_elf3_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Elf 3",
    "raceId": "elf",
    "variant": 3
  },
  {
    "id": "player_npc_demon2_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Ma tộc 2",
    "raceId": "demon",
    "variant": 2
  },
  {
    "id": "player_npc_demon3_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Ma tộc 3",
    "raceId": "demon",
    "variant": 3
  },
  {
    "id": "player_npc_beast2_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Thú nhân 2",
    "raceId": "beast",
    "variant": 2
  },
  {
    "id": "player_npc_beast3_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Thú nhân 3",
    "raceId": "beast",
    "variant": 3
  },
  {
    "id": "player_npc_dragon1_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Long tộc 1",
    "raceId": "dragon",
    "variant": 1
  },
  {
    "id": "player_npc_dragon2_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Long tộc 2",
    "raceId": "dragon",
    "variant": 2
  },
  {
    "id": "player_npc_dragon3_bow_m",
    "classId": "bow",
    "gender": "male",
    "name": "Long tộc 3",
    "raceId": "dragon",
    "variant": 3
  },
  {
    "id": "player_npc_human1_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Nhân tộc 1",
    "raceId": "human",
    "variant": 1
  },
  {
    "id": "player_npc_elf1_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Elf 1",
    "raceId": "elf",
    "variant": 1
  },
  {
    "id": "player_npc_beast1_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Thú nhân 1",
    "raceId": "beast",
    "variant": 1
  },
  {
    "id": "player_npc_demon1_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Ma tộc 1",
    "raceId": "demon",
    "variant": 1
  },
  {
    "id": "player_npc_human2_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Nhân tộc 2",
    "raceId": "human",
    "variant": 2
  },
  {
    "id": "player_npc_human3_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Nhân tộc 3",
    "raceId": "human",
    "variant": 3
  },
  {
    "id": "player_npc_elf2_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Elf 2",
    "raceId": "elf",
    "variant": 2
  },
  {
    "id": "player_npc_elf3_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Elf 3",
    "raceId": "elf",
    "variant": 3
  },
  {
    "id": "player_npc_demon2_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Ma tộc 2",
    "raceId": "demon",
    "variant": 2
  },
  {
    "id": "player_npc_demon3_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Ma tộc 3",
    "raceId": "demon",
    "variant": 3
  },
  {
    "id": "player_npc_beast2_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Thú nhân 2",
    "raceId": "beast",
    "variant": 2
  },
  {
    "id": "player_npc_beast3_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Thú nhân 3",
    "raceId": "beast",
    "variant": 3
  },
  {
    "id": "player_npc_dragon1_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Long tộc 1",
    "raceId": "dragon",
    "variant": 1
  },
  {
    "id": "player_npc_dragon2_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Long tộc 2",
    "raceId": "dragon",
    "variant": 2
  },
  {
    "id": "player_npc_dragon3_shield_m",
    "classId": "shield",
    "gender": "male",
    "name": "Long tộc 3",
    "raceId": "dragon",
    "variant": 3
  },
  {
    "id": "player_npc_human1_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Nhân tộc 1",
    "raceId": "human",
    "variant": 1
  },
  {
    "id": "player_npc_human2_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Nhân tộc 2",
    "raceId": "human",
    "variant": 2
  },
  {
    "id": "player_npc_human3_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Nhân tộc 3",
    "raceId": "human",
    "variant": 3
  },
  {
    "id": "player_npc_elf1_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Elf 1",
    "raceId": "elf",
    "variant": 1
  },
  {
    "id": "player_npc_elf2_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Elf 2",
    "raceId": "elf",
    "variant": 2
  },
  {
    "id": "player_npc_elf3_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Elf 3",
    "raceId": "elf",
    "variant": 3
  },
  {
    "id": "player_npc_beast1_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Thú nhân 1",
    "raceId": "beast",
    "variant": 1
  },
  {
    "id": "player_npc_beast2_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Thú nhân 2",
    "raceId": "beast",
    "variant": 2
  },
  {
    "id": "player_npc_beast3_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Thú nhân 3",
    "raceId": "beast",
    "variant": 3
  },
  {
    "id": "player_npc_demon1_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Ma tộc 1",
    "raceId": "demon",
    "variant": 1
  },
  {
    "id": "player_npc_demon2_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Ma tộc 2",
    "raceId": "demon",
    "variant": 2
  },
  {
    "id": "player_npc_demon3_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Ma tộc 3",
    "raceId": "demon",
    "variant": 3
  },
  {
    "id": "player_npc_dragon1_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Long tộc 1",
    "raceId": "dragon",
    "variant": 1
  },
  {
    "id": "player_npc_dragon2_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Long tộc 2",
    "raceId": "dragon",
    "variant": 2
  },
  {
    "id": "player_npc_dragon3_sword_f",
    "classId": "sword",
    "gender": "female",
    "name": "Long tộc 3",
    "raceId": "dragon",
    "variant": 3
  },
  {
    "id": "player_npc_human1_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Nhân tộc 1",
    "raceId": "human",
    "variant": 1
  },
  {
    "id": "player_npc_human2_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Nhân tộc 2",
    "raceId": "human",
    "variant": 2
  },
  {
    "id": "player_npc_human3_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Nhân tộc 3",
    "raceId": "human",
    "variant": 3
  },
  {
    "id": "player_npc_elf1_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Elf 1",
    "raceId": "elf",
    "variant": 1
  },
  {
    "id": "player_npc_elf2_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Elf 2",
    "raceId": "elf",
    "variant": 2
  },
  {
    "id": "player_npc_elf3_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Elf 3",
    "raceId": "elf",
    "variant": 3
  },
  {
    "id": "player_npc_beast1_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Thú nhân 1",
    "raceId": "beast",
    "variant": 1
  },
  {
    "id": "player_npc_beast2_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Thú nhân 2",
    "raceId": "beast",
    "variant": 2
  },
  {
    "id": "player_npc_beast3_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Thú nhân 3",
    "raceId": "beast",
    "variant": 3
  },
  {
    "id": "player_npc_demon1_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Ma tộc 1",
    "raceId": "demon",
    "variant": 1
  },
  {
    "id": "player_npc_demon2_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Ma tộc 2",
    "raceId": "demon",
    "variant": 2
  },
  {
    "id": "player_npc_demon3_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Ma tộc 3",
    "raceId": "demon",
    "variant": 3
  },
  {
    "id": "player_npc_dragon1_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Long tộc 1",
    "raceId": "dragon",
    "variant": 1
  },
  {
    "id": "player_npc_dragon2_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Long tộc 2",
    "raceId": "dragon",
    "variant": 2
  },
  {
    "id": "player_npc_dragon3_staff_f",
    "classId": "staff",
    "gender": "female",
    "name": "Long tộc 3",
    "raceId": "dragon",
    "variant": 3
  },
  {
    "id": "player_npc_human1_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Nhân tộc 1",
    "raceId": "human",
    "variant": 1
  },
  {
    "id": "player_npc_human2_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Nhân tộc 2",
    "raceId": "human",
    "variant": 2
  },
  {
    "id": "player_npc_human3_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Nhân tộc 3",
    "raceId": "human",
    "variant": 3
  },
  {
    "id": "player_npc_elf1_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Elf 1",
    "raceId": "elf",
    "variant": 1
  },
  {
    "id": "player_npc_elf2_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Elf 2",
    "raceId": "elf",
    "variant": 2
  },
  {
    "id": "player_npc_elf3_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Elf 3",
    "raceId": "elf",
    "variant": 3
  },
  {
    "id": "player_npc_beast1_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Thú nhân 1",
    "raceId": "beast",
    "variant": 1
  },
  {
    "id": "player_npc_beast2_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Thú nhân 2",
    "raceId": "beast",
    "variant": 2
  },
  {
    "id": "player_npc_beast3_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Thú nhân 3",
    "raceId": "beast",
    "variant": 3
  },
  {
    "id": "player_npc_demon1_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Ma tộc 1",
    "raceId": "demon",
    "variant": 1
  },
  {
    "id": "player_npc_demon2_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Ma tộc 2",
    "raceId": "demon",
    "variant": 2
  },
  {
    "id": "player_npc_demon3_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Ma tộc 3",
    "raceId": "demon",
    "variant": 3
  },
  {
    "id": "player_npc_dragon1_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Long tộc 1",
    "raceId": "dragon",
    "variant": 1
  },
  {
    "id": "player_npc_dragon2_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Long tộc 2",
    "raceId": "dragon",
    "variant": 2
  },
  {
    "id": "player_npc_dragon3_spear_f",
    "classId": "spear",
    "gender": "female",
    "name": "Long tộc 3",
    "raceId": "dragon",
    "variant": 3
  },
  {
    "id": "player_npc_human1_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Nhân tộc 1",
    "raceId": "human",
    "variant": 1
  },
  {
    "id": "player_npc_human2_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Nhân tộc 2",
    "raceId": "human",
    "variant": 2
  },
  {
    "id": "player_npc_human3_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Nhân tộc 3",
    "raceId": "human",
    "variant": 3
  },
  {
    "id": "player_npc_elf1_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Elf 1",
    "raceId": "elf",
    "variant": 1
  },
  {
    "id": "player_npc_elf2_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Elf 2",
    "raceId": "elf",
    "variant": 2
  },
  {
    "id": "player_npc_elf3_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Elf 3",
    "raceId": "elf",
    "variant": 3
  },
  {
    "id": "player_npc_beast1_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Thú nhân 1",
    "raceId": "beast",
    "variant": 1
  },
  {
    "id": "player_npc_beast2_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Thú nhân 2",
    "raceId": "beast",
    "variant": 2
  },
  {
    "id": "player_npc_beast3_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Thú nhân 3",
    "raceId": "beast",
    "variant": 3
  },
  {
    "id": "player_npc_demon1_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Ma tộc 1",
    "raceId": "demon",
    "variant": 1
  },
  {
    "id": "player_npc_demon2_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Ma tộc 2",
    "raceId": "demon",
    "variant": 2
  },
  {
    "id": "player_npc_demon3_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Ma tộc 3",
    "raceId": "demon",
    "variant": 3
  },
  {
    "id": "player_npc_dragon1_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Long tộc 1",
    "raceId": "dragon",
    "variant": 1
  },
  {
    "id": "player_npc_dragon2_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Long tộc 2",
    "raceId": "dragon",
    "variant": 2
  },
  {
    "id": "player_npc_dragon3_bow_f",
    "classId": "bow",
    "gender": "female",
    "name": "Long tộc 3",
    "raceId": "dragon",
    "variant": 3
  },
  {
    "id": "player_npc_human1_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Nhân tộc 1",
    "raceId": "human",
    "variant": 1
  },
  {
    "id": "player_npc_human2_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Nhân tộc 2",
    "raceId": "human",
    "variant": 2
  },
  {
    "id": "player_npc_human3_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Nhân tộc 3",
    "raceId": "human",
    "variant": 3
  },
  {
    "id": "player_npc_elf1_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Elf 1",
    "raceId": "elf",
    "variant": 1
  },
  {
    "id": "player_npc_elf2_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Elf 2",
    "raceId": "elf",
    "variant": 2
  },
  {
    "id": "player_npc_elf3_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Elf 3",
    "raceId": "elf",
    "variant": 3
  },
  {
    "id": "player_npc_beast1_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Thú nhân 1",
    "raceId": "beast",
    "variant": 1
  },
  {
    "id": "player_npc_beast2_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Thú nhân 2",
    "raceId": "beast",
    "variant": 2
  },
  {
    "id": "player_npc_beast3_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Thú nhân 3",
    "raceId": "beast",
    "variant": 3
  },
  {
    "id": "player_npc_demon1_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Ma tộc 1",
    "raceId": "demon",
    "variant": 1
  },
  {
    "id": "player_npc_demon2_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Ma tộc 2",
    "raceId": "demon",
    "variant": 2
  },
  {
    "id": "player_npc_demon3_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Ma tộc 3",
    "raceId": "demon",
    "variant": 3
  },
  {
    "id": "player_npc_dragon1_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Long tộc 1",
    "raceId": "dragon",
    "variant": 1
  },
  {
    "id": "player_npc_dragon2_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Long tộc 2",
    "raceId": "dragon",
    "variant": 2
  },
  {
    "id": "player_npc_dragon3_shield_f",
    "classId": "shield",
    "gender": "female",
    "name": "Long tộc 3",
    "raceId": "dragon",
    "variant": 3
  }
] as const;
export const PLAYER_MODELS = [...NPC_MODELS, ...PIXELLAB_MALE_MODELS, ...LEGACY_PLAYER_MODELS] as const;
export const playerModel = (id: unknown) => PLAYER_MODELS.find(m => m.id === id);
export const defaultPlayerModel = (gender: string) => PLAYER_MODELS.find(m => m.gender === gender && m.classId === (gender === 'female' ? 'staff' : 'sword'))!;
