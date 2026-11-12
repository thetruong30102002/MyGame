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
export const FARM_LAYOUT = {tile:32,width:48,height:32,plots:12,plotX:192,plotY:320,doorX:576,doorY:264,exitX:832,exitY:416,
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
export type FarmRoom = keyof typeof FARM_ROOMS;
/** Chỗ câu gần nhất trong bán kính `r` px (null = không đứng ở bờ hồ). */
export function pondSpotNear(x:number,y:number,r=70):readonly [number,number]|null{let best:readonly [number,number]|null=null,d=r;for(const s of FARM_LAYOUT.pondSpots){const k=Math.hypot(x-s[0],y-s[1]);if(k<=d){d=k;best=s;}}return best;}
export interface FarmPlot {tilled:boolean;crop:string|null;plantedAt:number;lastAt:number;growth:number;watered:boolean}
export interface FarmState {version:1;visited:string[];unlocked:boolean;plots:FarmPlot[];inventory:Record<string,number>;outfit:'farmer1'|'gardener';fish:{nonce:string;biteAt:number;expires:number;reward:string}|null;lastAction:number;lastEntry?:number}
export function newFarm():FarmState{return{version:1,visited:[],unlocked:false,plots:Array.from({length:12},()=>({tilled:false,crop:null,plantedAt:0,lastAt:0,growth:0,watered:false})),inventory:{},outfit:'farmer1',fish:null,lastAction:0};}
export function growPlot(p:FarmPlot,now:number):void {if(!p.crop)return;const c=FARM_CROPS.find(x=>x.id===p.crop);if(!c)return;p.growth=Math.min(c.ms,p.growth+Math.max(0,now-p.lastAt)*(p.watered?1:.5));p.lastAt=Math.max(p.lastAt,now);}
export function cropStage(p:FarmPlot):number{const c=FARM_CROPS.find(x=>x.id===p.crop);return c?Math.min(3,Math.floor(p.growth/c.ms*4)):0;}
export function plotPoint(i:number){return{x:FARM_LAYOUT.plotX+(i%4)*32,y:FARM_LAYOUT.plotY+Math.floor(i/4)*32};}
export function havenHour(now:number):number{return(now%(48*60000))/(48*60000)*24;}
export function chooseFarmFish(now:number,roll:number):string{const h=havenHour(now);const list=FARM_FISH.filter(x=>!x.night||h>=20||h<4.5);let n=Math.max(0,Math.min(.999999,roll))*list.reduce((s,x)=>s+x.weight,0);for(const f of list){n-=f.weight;if(n<0)return f.id;}return list[0]!.id;}
