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
export const PLAYER_MODELS = [...PIXELLAB_MALE_MODELS, ...LEGACY_PLAYER_MODELS] as const;
export const playerModel = (id: unknown) => PLAYER_MODELS.find(m => m.id === id);
export const defaultPlayerModel = (gender: string) => PLAYER_MODELS.find(m => m.gender === gender && m.classId === (gender === 'female' ? 'staff' : 'sword'))!;
