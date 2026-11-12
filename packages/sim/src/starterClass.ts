import type {GearState} from './equipment.ts';
export const SWORD_TIERS=[
 {level:1,outfit:'swordsman_outfit_1',weapon:'swordsman_blade_1'},
 {level:5,outfit:'swordsman_outfit_5',weapon:'swordsman_blade_5'},
 {level:10,outfit:'swordsman_outfit_10',weapon:'swordsman_blade_10'},
] as const;
/** Chỉ cấp bộ/kiếm tân thủ. Hai bậc sau mới là yêu cầu cấp, chưa tự đặt giá hoặc nguồn nhận. */
export function starterSwordGear():GearState{return{seq:2,bag:[],equip:{body:{uid:'i1',id:SWORD_TIERS[0].outfit},main:{uid:'i2',id:SWORD_TIERS[0].weapon}}};}
/** Hình luôn có bộ/kiếm cơ bản, không có giá trị cởi đồ/null; không sửa kho khi chỉ giải hình. */
export function resolveSwordAppearance(gear:GearState,level:number){
 const body=SWORD_TIERS.find(t=>t.outfit===gear.equip.body?.id&&t.level<=level)??SWORD_TIERS[0];
 const blade=SWORD_TIERS.find(t=>t.weapon===gear.equip.main?.id&&t.level<=level)??SWORD_TIERS[0];
 return{outfit:body.outfit,weapon:blade.weapon};
}

/**
 * Bộ tân thủ theo class của mẫu nhân vật (`classId` trong danh mục roster, 06/11/2026). Vào game chưa từng nhận thì phát và mặc sẵn vào ô
 * Áo; tháo bộ ra (ô Áo trống) thì hình đổi sang bản tháo áo `<mẫu>_bare` — thân nền nam quần đùi / nữ bikini, vẫn đeo vũ khí class.
 */
export const CLASS_STARTER_OUTFIT:Record<string,string>={sword:'swordsman_outfit_1',staff:'mage_outfit_1',spear:'lancer_outfit_1',shield:'guard_outfit_1',bow:'archer_outfit_1'};
/** Bộ shop 2 đúng từng class; giá và chỉ số đang là bản tạm chờ chủ dự án duyệt. */
export const CLASS_SHOP2_OUTFIT:Record<string,string>={sword:'swordsman_outfit_2',staff:'mage_outfit_2',spear:'lancer_outfit_2',shield:'guard_outfit_2',bow:'archer_outfit_2'};
