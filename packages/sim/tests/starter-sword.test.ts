import assert from 'node:assert/strict';
import {ITEMS,equipItem,addItem} from '../src/equipment.ts';
import {starterSwordGear,resolveSwordAppearance,SWORD_TIERS} from '../src/starterClass.ts';
const base=starterSwordGear();assert.equal(base.bag.length,0);assert.equal(base.equip.body?.id,'swordsman_outfit_1');assert.equal(base.equip.main?.id,'swordsman_blade_1');assert.equal(new Set([base.equip.body?.uid,base.equip.main?.uid]).size,2);
for(const tier of SWORD_TIERS)for(const id of [tier.outfit,tier.weapon]){const result=addItem(base,id),it=result.g.bag.at(-1)!;assert.equal(ITEMS[id]!.levelReq,tier.level);if(tier.level>1)assert.equal(typeof equipItem(result.g,it.uid,undefined,tier.level-1,16),'string');const equipped=equipItem(result.g,it.uid,undefined,tier.level,16);assert.notEqual(typeof equipped,'string');}
assert.deepEqual(resolveSwordAppearance({seq:0,bag:[],equip:{}},10),{outfit:'swordsman_outfit_1',weapon:'swordsman_blade_1'});
assert.deepEqual(resolveSwordAppearance({seq:2,bag:[],equip:{body:{uid:'i1',id:'swordsman_outfit_5'},main:{uid:'i2',id:'swordsman_blade_10'}}},5),{outfit:'swordsman_outfit_5',weapon:'swordsman_blade_1'});
assert.deepEqual(base,starterSwordGear(),'Giải hình không được đổi kho hoặc cấp đồ5/10');console.log('PASS quà kiếm sĩ,6 món/mốc1-5-10, chặn mặc sớm, hình fallback luôn mặc đồ.');
