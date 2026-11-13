import type {NpcDef} from './story/storyTypes.ts';
import {SERVICE_KEEPER_NPCS} from './serviceTowns.ts';
import {Q2_NPCS} from './quests2.ts';
/** Vùng 1: dùng hình đã có, các tên / giá mới là bản thử chờ duyệt cốt truyện. */
export const VILLAGE_NPCS:Record<string,NpcDef>={
 village_armor:{name:'Ela',title:'Người bán trang bị',sprite:'npc_mirelle_001',region:'human',at:{spot:'svc_tb_keeper'},stationary:true,idle:['Một bộ áo tốt phải giúp người mặc trở về. Bộ thứ hai của mỗi nghề hiện có ở quầy trang bị.']},
 village_smith:{name:'Orin',title:'Thợ rèn vũ khí và trang bị',sprite:'npc_garrick_001',region:'human',at:{spot:'svc_lr_keeper'},stationary:true,idle:['Ta nhận rèn cả vũ khí lẫn trang bị. Đe vẫn còn chờ số thép của đoàn buôn mất tích; công thức rèn sẽ mở cùng tuyến truyện mới.']},
 village_weapon:{name:'Ren',title:'Người bán vũ khí',sprite:'npc_aldric_001',region:'human',at:{spot:'svc_vk_keeper'},stationary:true,idle:['Chọn đúng món của nghề mình. Đừng để một thanh kiếm đẹp quyết định thay cậu sẽ trở thành ai.']},
 village_food:{name:'Maya',title:'Người bán đồ ăn',sprite:'npc_elin_001',region:'human',at:{spot:'plaza',dx:260,dy:180},stationary:true,idle:['Ăn một bữa ấm rồi hãy ra đường. Món hầm của ta giúp cậu vững tay trong chuyến đi.']},
 village_heal:{name:'Lena',title:'Người bán vật phẩm hồi phục',sprite:'npc_ysolde_001',region:'human',at:{spot:'svc_hp_keeper'},stationary:true,idle:['Đừng đợi kiệt sức mới nhớ mang thuốc. Ta vẫn giữ sổ tên những người chưa quay về.']},
 // Gia viên (chủ dự án 12/11): người bán đồ ở khuôn viên (hạt, ô ruộng, bể cá, nhà, quay thú cưng) + Quản gia trong phòng khách mở bảng bày trí. Hình PixelLab riêng, đứng yên.
 village_homeshop:{name:'Ruby',title:'Người bán đồ Gia viên',sprite:'npc_homeshop_001',region:'home',at:{spot:'shop'},stationary:true,idle:['Hạt giống, ô ruộng, bể cá hay một chú mèo con — muốn gì cứ hỏi.']},
 village_steward:{name:'Tobias',title:'Quản gia',sprite:'npc_steward_001',region:'home',at:{spot:'steward'},stationary:true,idle:['Cậu muốn kê lại đồ đạc trong nhà à? Cứ bảo ta.']},
 // 13/11: Ela / Orin / Ren / Lan đứng quầy trong nhà dịch vụ Thistlewood (`serviceTowns.ts`); NPC quầy các khu khác thêm dưới.
 ...SERVICE_KEEPER_NPCS,
 // NPC truyện hệ nhiệm vụ mới (13/11/2026, `quests2.ts`).
 ...Q2_NPCS,
 village_event:{name:'Iris',title:'Sứ giả sự kiện',sprite:'npc_silver_youth_f',region:'human',at:{spot:'plaza',dx:390,dy:110},stationary:true,idle:['Ta mang tin giữa các vùng. Dù chưa có hội lễ, cậu vẫn có thể ghé hỏi thăm; việc nhận nhà không phải đợi sự kiện.']},
};
export const VILLAGE_SHOP=[
 {id:'village_heal',npc:'village_heal',name:'Túi thuốc hồi phục',coins:12,potions:1},
 {id:'village_food',npc:'village_food',name:'Món hầm ấm bụng · tăng sức đánh 10 phút',coins:30,buff:true},
] as const;
