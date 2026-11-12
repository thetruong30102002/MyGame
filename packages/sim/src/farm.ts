/** Gia viên: luật máy chủ dùng chung, thời gian thật; giá tạm để thử, chưa chốt cân bằng. */
export const FARM_CROPS = [
 {id:'wheat',name:'Lúa mì',ms:5*60000,seed:5,sell:9},
 {id:'carrot',name:'Cà rốt',ms:15*60000,seed:8,sell:16},
 {id:'potato',name:'Khoai',ms:30*60000,seed:12,sell:26},
 {id:'strawberry',name:'Dâu',ms:60*60000,seed:20,sell:45},
 {id:'haven_pumpkin',name:'Bí ngô Haven',ms:180*60000,seed:35,sell:85},
 {id:'silver_grass',name:'Cỏ bạc',ms:480*60000,seed:60,sell:150},
] as const;
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
/** Hồ câu là MAP RIÊNG dùng chung `home/pond` (chủ dự án 12/11: "Hồ câu cá là một map bên cạnh … câu cùng bạn bè"): cổng ở mép nam
 * khuôn viên (`pondGate*`), trong map hồ có cổng về (`pondBack*`) và các chỗ câu dọc bờ tây + đầu cầu (nước ở phía đông người câu). */
export const FARM_LAYOUT = {tile:32,width:48,height:32,plots:12,plotsMax:48,plotCols:8,plotX:352,plotY:544,stewardX:780,stewardY:470,doorX:576,doorY:264,exitX:832,exitY:416,
 pondGateX:240,pondGateY:960,pondBackX:96,pondBackY:352,
 pondSpots:[[360,192],[360,288],[480,352],[360,448],[360,544]] as readonly (readonly [number,number])[]};
export const POND_MAP='home/pond';
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
export const FARM_TANK = {room:'house',x:492,y:328,slots:6,water:{x0:-38,x1:38,y0:-70,y1:-36}} as const;
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
export function shopPrice(id:string,state:Pick<FarmState,'plots'>):number{const it=FARM_SHOP.find(x=>x.id===id);if(!it)return Infinity;return id==='plots'?it.coins+it.step*Math.max(0,(state.plots.length-FARM_LAYOUT.plots)/4):it.coins;}
export type FarmRoom = keyof typeof FARM_ROOMS;
/** Chỗ câu gần nhất trong bán kính `r` px (null = không đứng ở bờ hồ). */
export function pondSpotNear(x:number,y:number,r=70):readonly [number,number]|null{let best:readonly [number,number]|null=null,d=r;for(const s of FARM_LAYOUT.pondSpots){const k=Math.hypot(x-s[0],y-s[1]);if(k<=d){d=k;best=s;}}return best;}
export interface FarmPlot {tilled:boolean;crop:string|null;plantedAt:number;lastAt:number;growth:number;watered:boolean}
export interface FarmState {version:1;visited:string[];unlocked:boolean;plots:FarmPlot[];inventory:Record<string,number>;outfit:'farmer1'|'gardener';fish:{nonce:string;biteAt:number;expires:number;reward:string}|null;lastAction:number;lastEntry?:number;tank?:string[];owned?:string[];pets?:string[];petsOut?:string[];petShards?:number;petPity?:number;lastSpin?:{pet:string;dup:boolean}[]}
export function newFarm():FarmState{return{version:1,visited:[],unlocked:false,plots:Array.from({length:12},()=>({tilled:false,crop:null,plantedAt:0,lastAt:0,growth:0,watered:false})),inventory:{},outfit:'farmer1',fish:null,lastAction:0,tank:[]};}
export function growPlot(p:FarmPlot,now:number):void {if(!p.crop)return;const c=FARM_CROPS.find(x=>x.id===p.crop);if(!c)return;p.growth=Math.min(c.ms,p.growth+Math.max(0,now-p.lastAt)*(p.watered?1:.5));p.lastAt=Math.max(p.lastAt,now);}
export function cropStage(p:FarmPlot):number{const c=FARM_CROPS.find(x=>x.id===p.crop);return c?Math.min(3,Math.floor(p.growth/c.ms*4)):0;}
export function plotPoint(i:number){return{x:FARM_LAYOUT.plotX+(i%FARM_LAYOUT.plotCols)*32,y:FARM_LAYOUT.plotY+Math.floor(i/FARM_LAYOUT.plotCols)*32};}
export function havenHour(now:number):number{return(now%(48*60000))/(48*60000)*24;}
export function chooseFarmFish(now:number,roll:number):string{const h=havenHour(now);const list=FARM_FISH.filter(x=>!x.night||h>=20||h<4.5);let n=Math.max(0,Math.min(.999999,roll))*list.reduce((s,x)=>s+x.weight,0);for(const f of list){n-=f.weight;if(n<0)return f.id;}return list[0]!.id;}
