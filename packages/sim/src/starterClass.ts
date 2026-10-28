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
