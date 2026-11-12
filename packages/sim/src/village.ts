import type {NpcDef} from './story/storyTypes.ts';
/** Vùng 1: dùng hình đã có, các tên / giá mới là bản thử chờ duyệt cốt truyện. */
export const VILLAGE_NPCS:Record<string,NpcDef>={
 village_armor:{name:'Ela',title:'Người bán trang bị',sprite:'npc_mirelle_001',region:'human',at:{spot:'plaza',dx:-240,dy:40},ages:[16,99],stationary:true,idle:['Một bộ áo tốt phải giúp người mặc trở về. Bộ thứ hai của mỗi nghề hiện có ở quầy trang bị.']},
 village_smith:{name:'Orin',title:'Thợ rèn vũ khí và trang bị',sprite:'npc_garrick_001',region:'human',at:{spot:'plaza',dx:-340,dy:150},ages:[16,99],stationary:true,idle:['Ta nhận rèn cả vũ khí lẫn trang bị. Đe vẫn còn chờ số thép của đoàn buôn mất tích; công thức rèn sẽ mở cùng tuyến truyện mới.']},
 village_weapon:{name:'Ren',title:'Người bán vũ khí',sprite:'npc_aldric_001',region:'human',at:{spot:'plaza',dx:260,dy:40},ages:[16,99],stationary:true,idle:['Chọn đúng món của nghề mình. Đừng để một thanh kiếm đẹp quyết định thay cậu sẽ trở thành ai.']},
 village_food:{name:'Mai',title:'Người bán đồ ăn',sprite:'npc_elin_001',region:'human',at:{spot:'plaza',dx:260,dy:180},ages:[16,99],stationary:true,idle:['Ăn một bữa ấm rồi hãy ra đường. Món hầm của ta giúp cậu vững tay trong chuyến đi.']},
 village_heal:{name:'Lan',title:'Người bán vật phẩm hồi phục',sprite:'npc_ysolde_001',region:'human',at:{spot:'church',dx:96,dy:100},ages:[16,99],stationary:true,idle:['Đừng đợi kiệt sức mới nhớ mang thuốc. Ta vẫn giữ sổ tên những người chưa quay về.']},
 village_event:{name:'Iris',title:'Sứ giả sự kiện',sprite:'npc_silver_youth_f',region:'human',at:{spot:'plaza',dx:390,dy:110},ages:[16,99],stationary:true,idle:['Ta mang tin giữa các vùng. Dù chưa có hội lễ, cậu vẫn có thể ghé hỏi thăm; việc nhận nhà không phải đợi sự kiện.']},
};
export const VILLAGE_SHOP=[
 {id:'village_heal',npc:'village_heal',name:'Túi thuốc hồi phục',coins:12,potions:1},
 {id:'village_food',npc:'village_food',name:'Món hầm ấm bụng · tăng sức đánh 10 phút',coins:30,buff:true},
] as const;
