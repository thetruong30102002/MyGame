import {DECOR_DEFAULT,DECOR_DOORS,DECOR_FIXED,DECOR_FLOOR,DECOR_ITEMS} from './farmDecor.generated.ts';
export {DECOR_ITEMS};
/** Gia viên: luật máy chủ dùng chung, thời gian thật; giá tạm để thử, chưa chốt cân bằng. */
export const FARM_CROPS = [
 {id:'wheat',name:'Lúa mì',ms:5*60000,seed:5,sell:9},
 {id:'carrot',name:'Cà rốt',ms:15*60000,seed:8,sell:16},
 {id:'potato',name:'Khoai',ms:30*60000,seed:12,sell:26},
 {id:'strawberry',name:'Dâu',ms:60*60000,seed:20,sell:45},
 {id:'haven_pumpkin',name:'Bí ngô Haven',ms:180*60000,seed:35,sell:85},
 {id:'silver_grass',name:'Cỏ bạc',ms:480*60000,seed:60,sell:150},
 // Mở rộng 11/11 (kế hoạch 9.8) — giá / thời gian thử, chưa cân bằng; hạt mua ở người bán đồ Gia viên / quầy Bram.
 {id:'rice',name:'Lúa nước',ms:20*60000,seed:10,sell:20},{id:'corn',name:'Ngô',ms:25*60000,seed:10,sell:22},
 {id:'tomato',name:'Cà chua',ms:40*60000,seed:15,sell:34},{id:'watermelon',name:'Dưa hấu',ms:120*60000,seed:30,sell:75},
 {id:'grape',name:'Nho',ms:90*60000,seed:25,sell:60},{id:'chili',name:'Ớt',ms:45*60000,seed:15,sell:36},
 {id:'tea',name:'Chè',ms:120*60000,seed:28,sell:70},{id:'sunflower',name:'Hướng dương',ms:50*60000,seed:18,sell:42},
 {id:'glowcap',name:'Nấm sáng',ms:180*60000,seed:40,sell:100},{id:'moonflower',name:'Hoa trăng',ms:240*60000,seed:50,sell:130},
 {id:'starfruit',name:'Quả sao',ms:360*60000,seed:70,sell:180},{id:'golden_wheat',name:'Lúa vàng',ms:600*60000,seed:120,sell:320},
] as const;
/** Hạt tặng khi mở Gia viên: chỉ 6 cây vùng 1 đầu tiên. */
export const FARM_STARTER_CROPS = ['wheat','carrot','potato','strawberry','haven_pumpkin','silver_grass'] as const;
export const FARM_FISH = [
 {id:'crucian',name:'Cá diếc',weight:30,sell:7,night:false},
 {id:'carp',name:'Cá chép',weight:23,sell:10,night:false},
 {id:'perch',name:'Cá rô',weight:20,sell:9,night:false},
 {id:'eel',name:'Lươn đồng',weight:12,sell:15,night:false},
 {id:'prawn',name:'Tôm càng',weight:10,sell:18,night:false},
 {id:'golden_carp',name:'Cá chép vàng',weight:3,sell:70,night:false},
 {id:'night_catfish',name:'Cá trê đêm',weight:14,sell:23,night:true},
 {id:'haven',name:'Cá Haven',weight:2,sell:100,night:false},
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
 {id:'plots',name:'Mở thêm 4 ô ruộng',coins:150,step:50},
 {id:'tank',name:'Bể cá trong nhà',coins:500,step:0},
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
export const PET_GACHA = {one:100,ten:900,rates:[70,22,7,1],pity:80,shards:[1,3,8,20],trade:[30,60,120,300],out:6} as const;
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
export function decorPlaceIssue(room:string,list:readonly {id:string;x:number;y:number}[],id:string,x:number,y:number):string|null{
 const it=DECOR_ITEMS[id],floor=DECOR_FLOOR[room];if(!it||!floor)return'Không đặt được món này ở đây';
 if(x-it.w/2<floor.x0||x+it.w/2>floor.x1||y>floor.y1||y-Math.max(it.fh,8)<floor.y0)return'Đồ phải nằm trọn trên sàn phòng';
 const box=(q:{id:string;x:number;y:number})=>{const m=DECOR_ITEMS[q.id]!;return{x0:q.x+m.fx,x1:q.x+m.fx+Math.max(m.fw,8),y0:q.y-Math.max(m.fh,8),y1:q.y};};
 const a=box({id,x,y});const hit=(b:{x0:number;x1:number;y0:number;y1:number})=>a.x0<b.x1+4&&b.x0<a.x1+4&&a.y0<b.y1+4&&b.y0<a.y1+4;
 if(list.some(q=>DECOR_ITEMS[q.id]&&hit(box(q)))||(DECOR_FIXED[room]??[]).some(hit))return'Chỗ này vướng đồ khác';
 if((DECOR_DOORS[room]??[]).some(d=>d.x>a.x0-40&&d.x<a.x1+40&&d.y>a.y0-40&&d.y<a.y1+40))return'Phải chừa lối cửa / cầu thang';
 return null;
}
/**
 * Vườn cây ăn quả (kế hoạch 9.8, hình T1): trồng cây giống (mua ở người bán đồ Gia viên) vào FARM_TREE_SPOTS; cây non → cây lớn sau
 * `growMs`, từ đó ra quả mỗi `fruitMs`, hái nhiều lần. Thời gian / giá thử, chưa cân bằng.
 */
export const FARM_FRUIT = [
 {id:'apple',name:'Táo',sapling:80,growMs:60*60000,fruitMs:30*60000,sell:25},
 {id:'orange',name:'Cam',sapling:90,growMs:75*60000,fruitMs:35*60000,sell:28},
 {id:'peach',name:'Đào Haven',sapling:150,growMs:120*60000,fruitMs:60*60000,sell:55},
] as const;
export const FARM_TREE_SPOTS = [[360,800],[440,800],[520,800],[600,800]] as const;
/** Giai đoạn cây ăn quả: 0 non · 1 lớn · 2 có quả. */
export function treeStage(t:{plantedAt:number;lastHarvest:number},kind:string,now:number):0|1|2{const f=FARM_FRUIT.find(x=>x.id===kind);if(!f)return 0;if(now-t.plantedAt<f.growMs)return 0;return now-Math.max(t.lastHarvest,t.plantedAt+f.growMs)>=f.fruitMs?2:1;}
/**
 * Máy chế biến (hình M1): mua ở người bán đồ Gia viên, đứng ở FARM_MACHINE_SPOTS ngoài khuôn viên. Bỏ nguyên liệu trong kho → chờ → lấy
 * thành phẩm; thành phẩm bán ở hộp gửi hàng (sau: nấu ăn). Công thức / giá / thời gian thử.
 */
export const FARM_MACHINES = [
 {id:'flour_mill',name:'Cối xay bột',price:300,recipes:[{id:'flour',in:{farm_wheat:2},out:'prod_flour',ms:5*60000}]},
 {id:'oven',name:'Lò nướng bánh',price:400,recipes:[{id:'bread',in:{prod_flour:1},out:'prod_bread',ms:10*60000}]},
 {id:'pickle_jar',name:'Hũ muối dưa',price:250,recipes:[{id:'pickles_chili',in:{farm_chili:2},out:'prod_pickles',ms:30*60000},{id:'pickles_tomato',in:{farm_tomato:2},out:'prod_pickles',ms:30*60000}]},
 {id:'fruit_press',name:'Máy ép quả',price:350,recipes:[{id:'juice_apple',in:{farm_apple:2},out:'prod_juice',ms:15*60000},{id:'juice_orange',in:{farm_orange:2},out:'prod_juice',ms:15*60000}]},
 {id:'wine_barrel',name:'Thùng ủ rượu',price:500,recipes:[{id:'wine',in:{farm_grape:3},out:'prod_wine',ms:120*60000}]},
 {id:'drying_rack',name:'Giá sấy quả',price:200,recipes:[{id:'dried_peach',in:{farm_peach:2},out:'prod_dried_fruit',ms:45*60000},{id:'dried_apple',in:{farm_apple:2},out:'prod_dried_fruit',ms:45*60000}]},
] as const;
export const FARM_MACHINE_SPOTS:Record<string,readonly [number,number]> = {flour_mill:[612,566],oven:[680,566],pickle_jar:[748,566],fruit_press:[816,566],wine_barrel:[748,636],drying_rack:[816,636]};
/** Giá bán ở hộp gửi hàng của quả và thành phẩm (giá thử). */
export const FARM_PRODUCT_SELL:Record<string,number> = {farm_apple:25,farm_orange:28,farm_peach:55,farm_honey:60,prod_flour:24,prod_bread:45,prod_pickles:90,prod_juice:70,prod_wine:260,prod_dried_fruit:130};
export function shopPrice(id:string,state:Pick<FarmState,'plots'>):number{const it=FARM_SHOP.find(x=>x.id===id);if(!it)return Infinity;return id==='plots'?it.coins+it.step*Math.max(0,(state.plots.length-FARM_LAYOUT.plots)/4):it.coins;}
export type FarmRoom = keyof typeof FARM_ROOMS;
/** Chỗ câu gần nhất trong bán kính `r` px (null = không đứng ở bờ hồ). */
export function pondSpotNear(x:number,y:number,r=70):readonly [number,number]|null{let best:readonly [number,number]|null=null,d=r;for(const s of FARM_LAYOUT.pondSpots){const k=Math.hypot(x-s[0],y-s[1]);if(k<=d){d=k;best=s;}}return best;}
export interface FarmPlot {tilled:boolean;crop:string|null;plantedAt:number;lastAt:number;growth:number;watered:boolean}
export interface FarmState {version:1;visited:string[];unlocked:boolean;plots:FarmPlot[];inventory:Record<string,number>;outfit:'farmer1'|'gardener';fish:{nonce:string;biteAt:number;expires:number;reward:string}|null;lastAction:number;lastEntry?:number;tank?:string[];owned?:string[];pets?:string[];petsOut?:string[];petShards?:number;petPity?:number;lastSpin?:{pet:string;dup:boolean}[];decor?:Record<string,{id:string;x:number;y:number}[]>;storage?:Record<string,number>;trees?:({kind:string;plantedAt:number;lastHarvest:number}|null)[];machines?:Record<string,{recipe:string;readyAt:number}|null>}
export function newFarm():FarmState{return{version:1,visited:[],unlocked:false,plots:Array.from({length:12},()=>({tilled:false,crop:null,plantedAt:0,lastAt:0,growth:0,watered:false})),inventory:{},outfit:'farmer1',fish:null,lastAction:0,tank:[]};}
export function growPlot(p:FarmPlot,now:number):void {if(!p.crop)return;const c=FARM_CROPS.find(x=>x.id===p.crop);if(!c)return;p.growth=Math.min(c.ms,p.growth+Math.max(0,now-p.lastAt)*(p.watered?1:.5));p.lastAt=Math.max(p.lastAt,now);}
export function cropStage(p:FarmPlot):number{const c=FARM_CROPS.find(x=>x.id===p.crop);return c?Math.min(3,Math.floor(p.growth/c.ms*4)):0;}
export function plotPoint(i:number){return{x:FARM_LAYOUT.plotX+(i%FARM_LAYOUT.plotCols)*32,y:FARM_LAYOUT.plotY+Math.floor(i/FARM_LAYOUT.plotCols)*32};}
export function havenHour(now:number):number{return(now%(48*60000))/(48*60000)*24;}
export function chooseFarmFish(now:number,roll:number):string{const h=havenHour(now);const list=FARM_FISH.filter(x=>!x.night||h>=20||h<4.5);let n=Math.max(0,Math.min(.999999,roll))*list.reduce((s,x)=>s+x.weight,0);for(const f of list){n-=f.weight;if(n<0)return f.id;}return list[0]!.id;}
