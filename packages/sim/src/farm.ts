import {DECOR_DEFAULT,DECOR_DOORS,DECOR_FIXED,DECOR_FLOOR,DECOR_ITEMS} from './farmDecor.generated.ts';
export {DECOR_ITEMS};
/** Gia viên: luật máy chủ dùng chung, thời gian thật; giá tạm để thử, chưa chốt cân bằng. */
/**
 * Giá cân lại 12/11 (chủ dự án: "Giá các đồ bạn căn chỉnh hợp lý giúp tôi"). Mốc thu nhập: quái cho 4 + 1,2 × cấp xu (cấp 10 ≈ 16, cấp 50
 * ≈ 64 xu / con, ~2–3 con / phút), nhiệm vụ 120–300 xu, bộ đồ shop cấp 5 = 450 xu. Ruộng là nguồn thu song song: một ô lãi ~70 xu / giờ
 * với cây ngắn (phải chăm liên tục) giảm dần còn ~40 xu / giờ với cây dài (trồng rồi đi đánh quái / offline); cây hiếm lãi mỗi lần lớn hơn.
 */
export const FARM_CROPS = [
 {id:'wheat',name:'Lúa mì',ms:5*60000,seed:4,sell:10},
 {id:'carrot',name:'Cà rốt',ms:15*60000,seed:8,sell:22},
 {id:'potato',name:'Khoai',ms:30*60000,seed:12,sell:36},
 {id:'strawberry',name:'Dâu',ms:60*60000,seed:20,sell:60},
 {id:'haven_pumpkin',name:'Bí ngô Haven',ms:180*60000,seed:40,sell:140},
 {id:'silver_grass',name:'Cỏ bạc',ms:480*60000,seed:70,sell:280},
 {id:'rice',name:'Lúa nước',ms:20*60000,seed:8,sell:26},{id:'corn',name:'Ngô',ms:25*60000,seed:9,sell:30},
 {id:'tomato',name:'Cà chua',ms:40*60000,seed:14,sell:44},{id:'watermelon',name:'Dưa hấu',ms:120*60000,seed:30,sell:110},
 {id:'grape',name:'Nho',ms:90*60000,seed:24,sell:84},{id:'chili',name:'Ớt',ms:45*60000,seed:14,sell:46},
 {id:'tea',name:'Chè',ms:120*60000,seed:32,sell:112},{id:'sunflower',name:'Hướng dương',ms:50*60000,seed:16,sell:52},
 {id:'glowcap',name:'Nấm sáng',ms:180*60000,seed:45,sell:160},{id:'moonflower',name:'Hoa trăng',ms:240*60000,seed:60,sell:220},
 {id:'starfruit',name:'Quả sao',ms:360*60000,seed:90,sell:340},{id:'golden_wheat',name:'Lúa vàng',ms:600*60000,seed:150,sell:600},
] as const;
/** Hạt tặng khi mở Gia viên: chỉ 6 cây vùng 1 đầu tiên. */
export const FARM_STARTER_CROPS = ['wheat','carrot','potato','strawberry','haven_pumpkin','silver_grass'] as const;
export const FARM_FISH = [
 {id:'crucian',name:'Cá diếc',weight:30,sell:8,night:false,rare:false},
 {id:'carp',name:'Cá chép',weight:23,sell:12,night:false,rare:false},
 {id:'perch',name:'Cá rô',weight:20,sell:11,night:false,rare:false},
 {id:'eel',name:'Lươn đồng',weight:12,sell:20,night:false,rare:false},
 {id:'prawn',name:'Tôm càng',weight:10,sell:22,night:false,rare:false},
 {id:'golden_carp',name:'Cá chép vàng',weight:3,sell:150,night:false,rare:false},
 {id:'night_catfish',name:'Cá trê đêm',weight:14,sell:30,night:true,rare:false},
 {id:'haven',name:'Cá Haven',weight:2,sell:250,night:false,rare:false},
 // 16 cá hiếm sưu tầm (tấm F14 / F15) — chủ dự án 12/11: "cho 16 loại cá hiếm vào hồ … tỉ lệ cá hiếm phải 0,001 %": MỖI loài 0,001 %
 // một lần cá cắn (FISH_RARE_CHANCE), cả 16 loài ≈ 0,016 % ≈ 1 / 6.250 lần. Khoẻ nhất khi kéo; thả bể sưu tầm hoặc bán.
 {id:'lantern',name:'Cá đèn lồng đầm lầy',weight:0,sell:20000,night:false,rare:true},
 {id:'swamp_pike',name:'Cá chó độc tím',weight:0,sell:20000,night:false,rare:true},
 {id:'oasis_carp',name:'Chép vàng ốc đảo',weight:0,sell:20000,night:false,rare:true},
 {id:'oasis_jewel',name:'Cá ngọc lam ốc đảo',weight:0,sell:20000,night:false,rare:true},
 {id:'feather_trout',name:'Cá hồi cánh lông',weight:0,sell:20000,night:false,rare:true},
 {id:'cloud_koi',name:'Cá koi mây',weight:0,sell:20000,night:false,rare:true},
 {id:'crystal_salmon',name:'Cá hồi pha lê',weight:0,sell:20000,night:false,rare:true},
 {id:'frost_pike',name:'Cá chó băng',weight:0,sell:20000,night:false,rare:true},
 {id:'magma',name:'Cá dung nham',weight:0,sell:20000,night:false,rare:true},
 {id:'ember_betta',name:'Cá betta lửa',weight:0,sell:20000,night:false,rare:true},
 {id:'rainbow_parrot',name:'Cá vẹt cầu vồng',weight:0,sell:20000,night:false,rare:true},
 {id:'pearl_seahorse',name:'Cá ngựa ngọc trai',weight:0,sell:20000,night:false,rare:true},
 {id:'moon_carp',name:'Cá chép trăng bạc',weight:0,sell:20000,night:false,rare:true},
 {id:'cave_glow',name:'Cá hang đốm sáng',weight:0,sell:20000,night:false,rare:true},
 {id:'dragon_koi',name:'Cá koi rồng Haven',weight:0,sell:20000,night:false,rare:true},
 {id:'rune_arowana',name:'Cá rồng cổ khắc rune',weight:0,sell:20000,night:false,rare:true},
] as const;
/** Hồ câu: MỘT map câu cá duy nhất trong game, mỗi nhà một hồ riêng sau Gia viên `home/<tài khoản>_pond` (chủ dự án 12/11: "Câu cá chỉ
 * có 1 map thôi sau gia viên và bạn bè có thể vào hồ nhà nhau câu cá chung với bạn bè tối đa 6 người trong một hồ"): cổng ở mép nam
 * khuôn viên (`pondGate*`), trong hồ có cổng về (`pondBack*`) và 6 chỗ câu dọc bờ tây + đầu cầu (nước ở phía đông người câu). */
export const FARM_LAYOUT = {tile:32,width:48,height:32,plots:12,plotsMax:48,plotCols:8,plotX:352,plotY:544,shopX:780,shopY:470,stewardX:232,stewardY:278,doorX:576,doorY:264,exitX:832,exitY:416,
 pondGateX:240,pondGateY:960,pondBackX:96,pondBackY:352,
 pondSpots:[[360,160],[360,240],[480,352],[360,440],[360,520],[360,592]] as readonly (readonly [number,number])[],pondMax:6};
export const pondMap=(account:number)=>`home/${account}_pond`;
export const isPondMap=(map:string)=>/^home\/\d+_pond$/.test(map);
/** Nhà 3 phòng, mỗi phòng một map (chủ dự án 11/11 "nhà thì phải có đủ phòng", "Mỗi phòng là 1 map", "Phòng ngủ nên để trên tầng"):
 * phòng khách `house` (cửa dưới ra vườn, cửa trái sang bếp, cầu thang góc phải lên phòng ngủ), bếp `kitchen`, phòng ngủ tầng 2 `bedroom`
 * (tủ quần áo đổi bộ đồ ở nhà). Toạ độ cửa khớp `scripts/export-home-maps.mts`. */
export const FARM_ROOMS = {
 house:{garden:[320,400],kitchen:[48,288],bedroom:[548,158]},
 kitchen:{house:[464,288]},
 bedroom:{house:[416,358]},
} as const;
export const FARM_WARDROBE = [332,158] as const;
/** Bể cá — món trang trí trong nhà (chủ dự án 12/11: "Bể cá cũng là trang trí trong nhà nhé"): đặt ở phòng khách, thả cá đã câu từ kho
 * vào để ngắm / sưu tầm, lấy lại được. `water` = vùng nước tính từ chân bể (neo giữa đáy) để client cho cá bơi. Hình bể tạm vẽ bằng code
 * (`scripts/export-home-maps.mts`), thay bằng hình GPT khi có. */
export const FARM_TANK = {item:'gv_be_ca',slots:6,water:{x0:-38,x1:38,y0:-70,y1:-36}} as const;
/**
 * Cửa hàng Gia viên của NPC Quản gia đứng ở khuôn viên (chủ dự án 12/11: "1 npc ở gia viên để mua đồ đạc: mua nhà, mua đồ vật, mua bể cá",
 * "chỗ trồng cây gia viên nữa cần rộng còn mở ô đất nữa"). GIÁ THỬ — chủ dự án chưa chốt giá; nhà / đồ vật chưa mở bán (chờ chốt giá
 * và cách đặt đồ). Mở ô ruộng: mỗi lần +4 ô, giá tăng dần theo số lần đã mở.
 */
export const FARM_SHOP = [
 {id:'plots',name:'Mở thêm 4 ô ruộng',coins:600,step:300},
 {id:'tank',name:'Bể cá trong nhà',coins:2000,step:0},
] as const;
/**
 * Thú cưng quay kim cương (kế hoạch 9.9, chủ dự án 11/11 duyệt "ok"; 12/11: "Thú cưng chỉ là con vật di chuyển tự do ở gia viên và trong
 * nhà"): 22 loài 4 độ hiếm, tỉ lệ công khai Thường 70 · Hiếm 22 · Sử thi 7 · Huyền thoại 1 (%). 1 lượt 100 kim cương; 10 lượt 900 và chắc
 * chắn ≥ 1 Hiếm trở lên; 80 lượt chưa ra Huyền thoại thì lượt sau chắc chắn ra. Trùng → mảnh theo độ hiếm, gom mảnh đổi con muốn.
 * Thú chỉ làm đẹp, không tăng chỉ số; tối đa PET_OUT con thả đi lại trong Gia viên cùng lúc.
 */
export const FARM_PETS = [
 {id:'pet2_cat_tabby',name:'Mèo mướp cam',rarity:1},{id:'pet2_cat_black',name:'Mèo mun',rarity:1},{id:'pet2_cat_white',name:'Mèo trắng',rarity:1},{id:'pet2_cat_grey',name:'Mèo xám',rarity:1},
 {id:'pet2_dog_golden',name:'Chó vàng',rarity:1},{id:'pet2_dog_black',name:'Chó mực',rarity:1},{id:'pet2_dog_spotted',name:'Chó đốm',rarity:1},{id:'pet2_dog_corgi',name:'Chó Corgi',rarity:1},
 {id:'pet2_cat_calico',name:'Mèo tam thể',rarity:2},{id:'pet2_cat_siamese',name:'Mèo Xiêm',rarity:2},{id:'pet2_cat_persian',name:'Mèo Ba Tư',rarity:2},
 {id:'pet2_dog_husky',name:'Chó Husky',rarity:2},{id:'pet2_dog_shiba',name:'Chó Shiba',rarity:2},{id:'pet2_dog_poodle',name:'Chó Poodle xù',rarity:2},
 {id:'pet2_cat_oddeye',name:'Mèo mắt hai màu',rarity:3},{id:'pet2_cat_royal',name:'Mèo trắng nơ hoàng gia',rarity:3},{id:'pet2_dog_samoyed',name:'Chó Samoyed bông tuyết',rarity:3},{id:'pet2_dog_hound',name:'Chó săn Haven lông bạc',rarity:3},
 {id:'pet2_cat_spirit',name:'Mèo linh hồn lam',rarity:4},{id:'pet2_cat_fire',name:'Mèo lửa',rarity:4},{id:'pet_moonwolf_002',name:'Sói trăng con',rarity:4},{id:'pet2_dog_cloud',name:'Chó thần mây',rarity:4},
] as const;
export const PET_GACHA = {one:30,ten:270,rates:[70,22,7,1],pity:80,shards:[1,3,8,20],trade:[30,60,120,300],out:6} as const;
export const PET_RARITY = ['','Thường','Hiếm','Sử thi','Huyền thoại'] as const;
/** Một lượt quay: `rollRarity`, `rollPet` ∈ [0, 1); `minRarity` = bảo đảm (lượt 10 / mốc 80). */
export function rollPet(rollRarity:number,rollPet:number,minRarity=1):string{
 const total=PET_GACHA.rates.reduce((s,x,i)=>i+1>=minRarity?s+x:s,0);let n=Math.max(0,Math.min(.999999,rollRarity))*total,rarity=4;
 for(let i=0;i<4;i++){if(i+1<minRarity)continue;n-=PET_GACHA.rates[i]!;if(n<0){rarity=i+1;break;}}
 const pool=FARM_PETS.filter(p=>p.rarity===rarity);return pool[Math.min(pool.length-1,Math.floor(Math.max(0,rollPet)*pool.length))]!.id;
}
/** Đồ bày trí của một phòng (chưa sắp xếp lần nào = bố cục mặc định). */
export function decorOf(state:Pick<FarmState,'decor'>,room:string):{id:string;x:number;y:number}[]{return state.decor?.[room]??(DECOR_DEFAULT[room]??[]).map(p=>({...p}));}
/** Đặt được không: nằm trọn trên sàn, chân không chồng đồ khác / khối cố định, chừa lối cửa và cầu thang (null = được). */
/** Chân đèn treo: đèn móc gờ trần (đáy đèn cách đỉnh tường 16 px + cao ảnh), client vẽ xích từ gờ xuống. */
export const DECOR_LAMP_TOP = 16;
/** Toạ độ đặt theo cách đặt của món, tính từ chỗ người chơi đứng: đồ sàn ngay trước mặt, thảm giữa chân, đèn ngay trên đầu ở gờ trần. */
export function decorSpot(id:string,px:number,py:number):{x:number;y:number}{const it=DECOR_ITEMS[id];if(!it)return{x:px,y:py};
 if(it.place==='lamp')return{x:Math.round(px),y:DECOR_LAMP_TOP+it.h};if(it.place==='rug')return{x:Math.round(px),y:Math.round(py+it.h/2)};return{x:Math.round(px),y:Math.round(py)-24};}
export function decorPlaceIssue(room:string,list:readonly {id:string;x:number;y:number}[],id:string,x:number,y:number):string|null{
 const it=DECOR_ITEMS[id],floor=DECOR_FLOOR[room];if(!it||!floor)return'Không đặt được món này ở đây';
 // Đèn: chỉ cần nằm trong bề ngang phòng, không chồng đèn khác. Thảm: nằm trọn trên sàn, không chồng thảm khác (đồ đặt đè lên thảm được).
 if(it.place==='lamp'){if(x-it.w/2<floor.x0||x+it.w/2>floor.x1)return'Đèn phải treo trong phòng';return list.some(q=>DECOR_ITEMS[q.id]?.place==='lamp'&&Math.abs(q.x-x)<(DECOR_ITEMS[q.id]!.w+it.w)/2+8)?'Chỗ này đã có đèn':null;}
 if(it.place==='rug'){if(x-it.w/2<floor.x0||x+it.w/2>floor.x1||y-it.h<floor.y0||y>floor.y1)return'Thảm phải nằm trọn trên sàn';
  return list.some(q=>{const m=DECOR_ITEMS[q.id];return m?.place==='rug'&&Math.abs(q.x-x)<(m.w+it.w)/2&&Math.abs((q.y-m.h/2)-(y-it.h/2))<(m.h+it.h)/2;})?'Chỗ này đã có thảm':null;}
 if(x-it.w/2<floor.x0||x+it.w/2>floor.x1||y>floor.y1||y-Math.max(it.fh,8)<floor.y0)return'Đồ phải nằm trọn trên sàn phòng';
 const box=(q:{id:string;x:number;y:number})=>{const m=DECOR_ITEMS[q.id]!;return{x0:q.x+m.fx,x1:q.x+m.fx+Math.max(m.fw,8),y0:q.y-Math.max(m.fh,8),y1:q.y};};
 const a=box({id,x,y});const hit=(b:{x0:number;x1:number;y0:number;y1:number})=>a.x0<b.x1+4&&b.x0<a.x1+4&&a.y0<b.y1+4&&b.y0<a.y1+4;
 if(list.some(q=>DECOR_ITEMS[q.id]&&DECOR_ITEMS[q.id]!.place==='floor'&&hit(box(q)))||(DECOR_FIXED[room]??[]).some(hit))return'Chỗ này vướng đồ khác';
 if((DECOR_DOORS[room]??[]).some(d=>d.x>a.x0-40&&d.x<a.x1+40&&d.y>a.y0-40&&d.y<a.y1+40))return'Phải chừa lối cửa / cầu thang';
 return null;
}
/**
 * Vườn cây ăn quả (kế hoạch 9.8, hình T1): trồng cây giống (mua ở người bán đồ Gia viên) vào FARM_TREE_SPOTS; cây non → cây lớn sau
 * `growMs`, từ đó ra quả mỗi `fruitMs`, hái nhiều lần. Thời gian / giá thử, chưa cân bằng.
 */
export const FARM_FRUIT = [
 {id:'apple',name:'Táo',sapling:400,growMs:120*60000,fruitMs:60*60000,sell:15},
 {id:'orange',name:'Cam',sapling:450,growMs:150*60000,fruitMs:60*60000,sell:18},
 {id:'peach',name:'Đào Haven',sapling:800,growMs:240*60000,fruitMs:120*60000,sell:35},
] as const;
export const FARM_TREE_SPOTS = [[360,800],[440,800],[520,800],[600,800]] as const;
/** Giai đoạn cây ăn quả: 0 non · 1 lớn · 2 có quả. */
export function treeStage(t:{plantedAt:number;lastHarvest:number},kind:string,now:number):0|1|2{const f=FARM_FRUIT.find(x=>x.id===kind);if(!f)return 0;if(now-t.plantedAt<f.growMs)return 0;return now-Math.max(t.lastHarvest,t.plantedAt+f.growMs)>=f.fruitMs?2:1;}
/**
 * Máy chế biến (hình M1): mua ở người bán đồ Gia viên, đứng ở FARM_MACHINE_SPOTS ngoài khuôn viên. Bỏ nguyên liệu trong kho → chờ → lấy
 * thành phẩm; thành phẩm bán ở hộp gửi hàng (sau: nấu ăn). Công thức / giá / thời gian thử.
 */
export const FARM_MACHINES = [
 {id:'flour_mill',name:'Cối xay bột',price:800,recipes:[{id:'flour',in:{farm_wheat:2},out:'prod_flour',ms:5*60000}]},
 {id:'oven',name:'Lò nướng bánh',price:1200,recipes:[{id:'bread',in:{prod_flour:1},out:'prod_bread',ms:10*60000}]},
 {id:'pickle_jar',name:'Hũ muối dưa',price:1000,recipes:[{id:'pickles_chili',in:{farm_chili:2},out:'prod_pickles',ms:30*60000},{id:'pickles_tomato',in:{farm_tomato:2},out:'prod_pickles',ms:30*60000}]},
 {id:'fruit_press',name:'Máy ép quả',price:1200,recipes:[{id:'juice_apple',in:{farm_apple:2},out:'prod_juice',ms:15*60000},{id:'juice_orange',in:{farm_orange:2},out:'prod_juice',ms:15*60000}]},
 {id:'wine_barrel',name:'Thùng ủ rượu',price:2500,recipes:[{id:'wine',in:{farm_grape:3},out:'prod_wine',ms:120*60000}]},
 {id:'drying_rack',name:'Giá sấy quả',price:900,recipes:[{id:'dried_peach',in:{farm_peach:2},out:'prod_dried_fruit',ms:45*60000},{id:'dried_apple',in:{farm_apple:3},out:'prod_dried_fruit',ms:45*60000}]},
] as const;
export const FARM_MACHINE_SPOTS:Record<string,readonly [number,number]> = {flour_mill:[612,566],oven:[680,566],pickle_jar:[748,566],fruit_press:[816,566],wine_barrel:[748,636],drying_rack:[816,636]};
/** Giá bán ở hộp gửi hàng của quả và thành phẩm (giá thử). */
export const FARM_PRODUCT_SELL:Record<string,number> = {
 // thịt / sản phẩm chăn nuôi
 farm_egg:25,farm_milk:70,farm_wool:90,farm_honey:80,meat_chicken:45,meat_beef:120,meat_lamb:100,
 // quả + thành phẩm máy (chế biến lãi thêm ~30–60 % so với bán nguyên liệu)
 farm_apple:15,farm_orange:18,farm_peach:35,prod_flour:32,prod_bread:55,prod_pickles:130,prod_juice:50,prod_wine:400,prod_dried_fruit:110,
 // món nấu chín tới (tái / chín kỹ / cháy nhân theo COOK_QUALITY)
 dish_grilled_fish:90,dish_fish_soup:85,dish_fried_rice:130,dish_pumpkin_soup:240,dish_strawberry_cake:230,dish_roast_chicken:140,dish_beef_stew:250,dish_lamb_skewer:220,
};
/**
 * Nấu ăn (kế hoạch 2.4 / 9.2 / 9.11, hình K1): đứng cạnh bếp lò củi đã đặt trong nhà (`gv_bep_lo_cui`, dời được khi bày trí) → nấu món từ
 * nông sản / cá / thành phẩm máy; ăn món nhận bùa ngắn (sát thương / giáp / kinh nghiệm), hoặc bán ở hộp gửi hàng. Món thịt cần thịt từ
 * chăn nuôi (chưa mở). Công thức / hiệu ứng / giá thử, chưa cân bằng.
 */
export const FARM_STOVE = 'gv_bep_lo_cui';
export const FARM_DISHES = [
 {id:'dish_grilled_fish',name:'Cá nướng',cookMs:7000,in:{fish_carp:1,farm_chili:1},buff:{kind:'guard',mult:0.9,ms:15*60000},sell:40},
 {id:'dish_fish_soup',name:'Súp cá',cookMs:9000,in:{fish_crucian:2,farm_potato:1},buff:{kind:'exp',mult:1.1,ms:20*60000},sell:45},
 {id:'dish_fried_rice',name:'Cơm chiên dứa',cookMs:6000,in:{farm_rice:2,farm_corn:1},buff:{kind:'exp',mult:1.15,ms:20*60000},sell:80},
 {id:'dish_pumpkin_soup',name:'Súp bí',cookMs:9000,in:{farm_haven_pumpkin:1,farm_carrot:1},buff:{kind:'guard',mult:0.88,ms:20*60000},sell:140},
 {id:'dish_strawberry_cake',name:'Bánh kem dâu',cookMs:10000,in:{farm_strawberry:2,prod_flour:1},buff:{kind:'dmg',mult:1.12,ms:20*60000},sell:150},
 {id:'dish_roast_chicken',name:'Gà quay',cookMs:10000,in:{meat_chicken:1,farm_potato:1},buff:{kind:'dmg',mult:1.15,ms:20*60000},sell:120},
 {id:'dish_beef_stew',name:'Bò hầm',cookMs:11000,in:{meat_beef:1,farm_carrot:2},buff:{kind:'guard',mult:0.85,ms:20*60000},sell:130},
 {id:'dish_lamb_skewer',name:'Xiên cừu nướng',cookMs:7000,in:{meat_lamb:1,farm_chili:1},buff:{kind:'dmg',mult:1.12,ms:15*60000},sell:110},
] as const;
/**
 * Chăn nuôi (kế hoạch 2.3 / 9.8 / 9.11): con vật đi lại trong bãi quây (bò / cừu ở bãi đông bắc, gà ở sân đông nam), tổ ong cạnh bồn hoa.
 * Đứng ở cổng bãi: cho ăn (lúa mì / ngô trong kho) → sau một ngày Haven (48 phút) thu sản phẩm mỗi con một món; ong không cần cho ăn.
 * Xuất chuồng: đổi một con lấy thịt (món thịt ở bếp). Gia viên có sẵn 2 gà, 1 bò, 1 cừu, 1 đàn ong. Giá / thời gian / lượng thử.
 */
export const HAVEN_DAY_MS = 48*60000;
export const FARM_ANIMALS = [
 {id:'chicken',name:'Gà',character:'farm_chicken_001',scale:0.6,pen:'chicken',max:8,price:300,feed:1,product:'farm_egg',meat:'meat_chicken',meatN:2,start:2},
 {id:'cow',name:'Bò sữa',character:'farm_cow_001',scale:2,pen:'pasture',max:3,price:1500,feed:2,product:'farm_milk',meat:'meat_beef',meatN:3,start:1},
 {id:'sheep',name:'Cừu',character:'farm_sheep_001',scale:1.5,pen:'pasture',max:4,price:1100,feed:2,product:'farm_wool',meat:'meat_lamb',meatN:2,start:1},
 {id:'bee',name:'Đàn ong',character:null,scale:1,pen:'hives',max:3,price:800,feed:0,product:'farm_honey',meat:null,meatN:0,start:1},
] as const;
/** Chỗ đứng (cổng bãi / tổ ong) và vùng trong bãi cho con vật đi lại — toạ độ khuôn viên (scripts/export-home-maps.mts). */
export const FARM_PENS:Record<string,{gate:readonly [number,number];area:{x0:number;x1:number;y0:number;y1:number}}> = {
 pasture:{gate:[1219,474],area:{x0:1000,x1:1440,y0:170,y1:375}},
 chicken:{gate:[1230,954],area:{x0:1110,x1:1440,y0:720,y1:880}},
 hives:{gate:[480,975],area:{x0:360,x1:610,y0:900,y1:950}},
};
export const FARM_FEED = ['farm_wheat','farm_corn'] as const;
/** Đàn của người chơi (chưa từng mua bán = đàn có sẵn). */
export function livestockOf(state:Pick<FarmState,'livestock'>):Record<string,{count:number;fedAt:number}>{const l=state.livestock??{};return Object.fromEntries(FARM_ANIMALS.map(a=>[a.id,l[a.id]??{count:a.start,fedAt:0}]));}
/** Giá đề xuất 12/11 cho nhà Gia viên theo thang 16 bậc (bậc 1 Đồng quê có sẵn) và đồ bày trí — CHƯA mở bán (cần hệ thống đổi nhà). */
export const FARM_HOUSE_PRICES:Record<string,number> = {dq:0,nk:8000,dv:15000,cx:22000,tt:30000,ns:40000,bh:52000,sm:65000,ct:80000,gd:100000,pd:125000,ln:155000,ld:190000,lk:230000,lb:280000,hv:350000};
export const FARM_FURNITURE_PRICE = {small:300,medium:800,large:2000,feature:5000} as const;
export function shopPrice(id:string,state:Pick<FarmState,'plots'>):number{const it=FARM_SHOP.find(x=>x.id===id);if(!it)return Infinity;return id==='plots'?it.coins+it.step*Math.max(0,(state.plots.length-FARM_LAYOUT.plots)/4):it.coins;}
export type FarmRoom = keyof typeof FARM_ROOMS;
/** Chỗ câu gần nhất trong bán kính `r` px (null = không đứng ở bờ hồ). */
export function pondSpotNear(x:number,y:number,r=70):readonly [number,number]|null{let best:readonly [number,number]|null=null,d=r;for(const s of FARM_LAYOUT.pondSpots){const k=Math.hypot(x-s[0],y-s[1]);if(k<=d){d=k;best=s;}}return best;}
export interface FarmPlot {tilled:boolean;crop:string|null;plantedAt:number;lastAt:number;growth:number;watered:boolean}
export interface FarmState {version:1;visited:string[];unlocked:boolean;plots:FarmPlot[];inventory:Record<string,number>;outfit:'farmer1'|'gardener';fish:{nonce:string;biteAt:number;expires:number;reward:string;hookedAt?:number;seed?:number;power?:number}|null;cooking?:{dish:string;startedAt:number}|null;lastAction:number;lastEntry?:number;tank?:string[];owned?:string[];pets?:string[];petsOut?:string[];petShards?:number;petPity?:number;lastSpin?:{pet:string;dup:boolean}[];decor?:Record<string,{id:string;x:number;y:number}[]>;storage?:Record<string,number>;trees?:({kind:string;plantedAt:number;lastHarvest:number}|null)[];livestock?:Record<string,{count:number;fedAt:number}>;machines?:Record<string,{recipe:string;readyAt:number}|null>}
export function newFarm():FarmState{return{version:1,visited:[],unlocked:false,plots:Array.from({length:12},()=>({tilled:false,crop:null,plantedAt:0,lastAt:0,growth:0,watered:false})),inventory:{},outfit:'farmer1',fish:null,lastAction:0,tank:[]};}
export function growPlot(p:FarmPlot,now:number):void {if(!p.crop)return;const c=FARM_CROPS.find(x=>x.id===p.crop);if(!c)return;p.growth=Math.min(c.ms,p.growth+Math.max(0,now-p.lastAt)*(p.watered?1:.5));p.lastAt=Math.max(p.lastAt,now);}
export function cropStage(p:FarmPlot):number{const c=FARM_CROPS.find(x=>x.id===p.crop);return c?Math.min(3,Math.floor(p.growth/c.ms*4)):0;}
export function plotPoint(i:number){return{x:FARM_LAYOUT.plotX+(i%FARM_LAYOUT.plotCols)*32,y:FARM_LAYOUT.plotY+Math.floor(i/FARM_LAYOUT.plotCols)*32};}
export function havenHour(now:number):number{return(now%(48*60000))/(48*60000)*24;}
/** Tỉ lệ MỖI loài cá hiếm trên một lần cá cắn: 0,001 %. */
export const FISH_RARE_CHANCE = 0.00001;
export function chooseFarmFish(now:number,roll:number):string{
 // Cá hiếm trước: roll < 16 × 0,001 % → loài thứ floor(roll / 0,001 %); còn lại chia lại roll cho cá thường theo trọng số.
 const rares=FARM_FISH.filter(x=>x.rare);if(roll<rares.length*FISH_RARE_CHANCE)return rares[Math.min(rares.length-1,Math.floor(roll/FISH_RARE_CHANCE))]!.id;
 roll=(roll-rares.length*FISH_RARE_CHANCE)/(1-rares.length*FISH_RARE_CHANCE);const h=havenHour(now);const list=FARM_FISH.filter(x=>!x.rare&&(!x.night||h>=20||h<4.5));let n=Math.max(0,Math.min(.999999,roll))*list.reduce((s,x)=>s+x.weight,0);for(const f of list){n-=f.weight;if(n<0)return f.id;}return list[0]!.id;}
