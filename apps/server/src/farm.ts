import {randomInt,randomUUID} from 'node:crypto';
import {FARM_CROPS,FARM_FISH,FARM_LAYOUT,FARM_ROOMS,FARM_WARDROBE,POND_MAP,chooseFarmFish,growPlot,plotPoint,pondSpotNear,type FarmRoom,type FarmState} from '@havenlord/sim/farm';
import {STORY} from '@havenlord/sim/story/story';
import {VILLAGE_SHOP} from '@havenlord/sim/village';
import type {ServerMessage} from '@havenlord/protocol';
import {spotOf} from './maps.ts';
import type {Store} from './db.ts';

export interface FarmHost {where(id:string):{map:string;x:number;y:number}|null;send(id:string,msg:ServerMessage):void;move(id:string,map:string):void;refresh(id:string):void}
export const homeMap=(account:number,inside=false)=>`home/${account}${inside?'_inside':''}`;
/** Map từng phòng trong nhà: phòng khách giữ id cũ `_inside`, thêm bếp / phòng ngủ. */
export const roomMap=(account:number,room:FarmRoom)=>room==='house'?homeMap(account,true):`home/${account}_${room}`;
const roomOf=(account:number,map:string|undefined):FarmRoom|null=>(Object.keys(FARM_ROOMS) as FarmRoom[]).find(r=>roomMap(account,r)===map)??null;
/** Map Gia viên người này được vào: khuôn viên + nhà riêng + hồ câu dùng chung. */
export const farmMaps=(account:number)=>[homeMap(account),POND_MAP,...(Object.keys(FARM_ROOMS) as FarmRoom[]).map(r=>roomMap(account,r))];
export class Farm {
 constructor(private store:Store,private host:FarmHost,private mapsDir:string,private now:()=>number=Date.now,private random:()=>number=()=>randomInt(1000000)/1000000){}
 roster(){return Object.entries(STORY.npcs).flatMap(([id,n])=>{const s=spotOf(this.mapsDir,'human/town',n.at.spot);return n.sprite&&(!n.region||n.region==='human')&&s&&n.ages[0]<=16&&n.ages[1]>=16?[{id,name:n.name,x:s.x+(n.at.dx??0),y:s.y+(n.at.dy??0)}]:[];});}
 canEnter(account:number){return this.store.farm.read(account).unlocked;}
 private send(id:string,account:number,enter=false){const state=this.store.farm.read(account);for(const p of state.plots)growPlot(p,this.now());const at=this.host.where(id);const fish=state.fish?{nonce:state.fish.nonce,biteAt:state.fish.biteAt,expires:state.fish.expires}:null;const inRoom=roomOf(account,at?.map);const room=at?.map===POND_MAP?'pond':inRoom??'garden';this.host.send(id,{t:'farm',state:{...state,fish,required:this.roster(),map:room==='pond'?POND_MAP:inRoom?roomMap(account,inRoom):homeMap(account),room,now:this.now(),enter}});}
 handle(id:string,account:number,raw:{op?:unknown;plot?:unknown;crop?:unknown;npc?:unknown;nonce?:unknown;outfit?:unknown;item?:unknown;room?:unknown}):void{
  const op=String(raw.op||'');const at=this.host.where(id);if(!at)return;
  const near=(x:number,y:number,r=110)=>Math.hypot(at.x-x,at.y-y)<=r;
  try{
   if(op==='get'){this.send(id,account);return;}
   if(op==='leave'){if(!farmMaps(account).includes(at.map))throw new Error('Bạn chưa ở Gia viên');this.host.send(id,{t:'farm',state:{leave:true}});this.host.move(id,'human/town');return;}
   if(op==='pond'){
    // Đi bộ qua cổng: khuôn viên (cổng mép nam) ⇄ hồ câu dùng chung (cổng bờ tây).
    if(!this.canEnter(account))throw new Error('Hãy làm quen hết cư dân Thistlewood trước khi nhận Gia viên');
    const fromGarden=at.map===homeMap(account);if(!fromGarden&&at.map!==POND_MAP)throw new Error('Hồ câu nằm cạnh khuôn viên của bạn');
    if(fromGarden&&!near(FARM_LAYOUT.pondGateX,FARM_LAYOUT.pondGateY))throw new Error('Hãy tới cổng ra hồ câu');
    if(!fromGarden&&!near(FARM_LAYOUT.pondBackX,FARM_LAYOUT.pondBackY))throw new Error('Hãy tới cổng về khuôn viên');
    if(!fromGarden)this.store.farm.run(account,id,this.now(),s=>{s.fish=null;return{value:null};});
    const target=fromGarden?POND_MAP:homeMap(account);
    this.host.send(id,{t:'farm',state:{travel:fromGarden?'pond':'garden',spot:fromGarden?'from_garden':'from_pond',map:target}});this.host.move(id,target);this.send(id,account);return;
   }
   if(op==='enter'||op==='room'){
    if(!this.canEnter(account))throw new Error('Hãy làm quen hết cư dân Thistlewood trước khi nhận Gia viên');
    if(op==='enter'&&at.map!=='human/town')throw new Error('Hãy trở về Thistlewood để về nhà');
    if(op==='enter')this.store.farm.run(account,id,this.now(),s=>{if(s.lastEntry&&this.now()-s.lastEntry<300000)throw new Error('Về Gia viên đang hồi: tối đa một lần mỗi 5 phút');s.lastEntry=this.now();return{value:null};});
    if(op==='room'&&at.map!==homeMap(account)&&at.map!==homeMap(account,true))throw new Error('Ra vườn phải đi từ phòng khách');
    if(op==='room'&&at.map===homeMap(account)&&!near(FARM_LAYOUT.doorX,FARM_LAYOUT.doorY))throw new Error('Hãy tới cửa nhà');
    if(op==='room'&&at.map===homeMap(account,true)&&!near(...FARM_ROOMS.house.garden))throw new Error('Hãy tới cửa ra vườn');
    const target=homeMap(account,op==='room'&&at.map===homeMap(account));
    const inside=target.endsWith('_inside');
    this.host.send(id,{t:'farm',state:{travel:inside?'house':'garden',spot:op==='enter'?null:inside?'from_garden':'from_house',map:target}});this.host.move(id,target);this.send(id,account);return;
   }
   if(op==='go'){
    // Đi giữa các phòng trong nhà: phải đứng ở đúng cửa / đầu cầu thang của phòng hiện tại.
    const from=roomOf(account,at.map),to=String(raw.room||'') as FarmRoom;
    if(!from||!this.canEnter(account))throw new Error('Bạn chưa ở trong nhà');
    const door=(FARM_ROOMS[from] as Record<string,readonly [number,number]>)[to];
    if(!door||to==='garden' as never)throw new Error('Không có lối sang phòng này');
    if(!near(door[0],door[1]))throw new Error('Hãy tới cửa / cầu thang');
    const target=roomMap(account,to);
    this.host.send(id,{t:'farm',state:{travel:to,spot:`from_${from}`,map:target}});this.host.move(id,target);this.send(id,account);return;
   }
   this.store.farm.run<unknown>(account,id,this.now(),(s,coins)=>{
    if(op==='talk'){
     const npc=this.roster().find(n=>n.id===raw.npc);if(!npc||at.map!=='human/town'||!near(npc.x,npc.y,130))throw new Error('Hãy tới gần người muốn trò chuyện');
     if(!s.visited.includes(npc.id))s.visited.push(npc.id);
     if(!s.unlocked&&this.roster().every(n=>s.visited.includes(n.id))){s.unlocked=true;for(const c of FARM_CROPS)s.inventory[`seed_${c.id}`]=3;this.host.send(id,{t:'system',text:'Bạn đã quen cư dân Thistlewood. Gia viên đã mở; nhận 3 hạt mỗi loại trong kho!'});}
     return{value:null};
    }
    if(op==='buySeed'){
     const plaza=spotOf(this.mapsDir,'human/town','plaza');if(at.map!=='human/town'||!plaza||!near(plaza.x-110,plaza.y-40,240))throw new Error('Hãy tới quầy Bram mua hạt');
     const c=FARM_CROPS.find(c=>c.id===raw.crop);if(!c)throw new Error('Không có hạt này');if(coins<c.seed)throw new Error('Không đủ xu');s.inventory[`seed_${c.id}`]=(s.inventory[`seed_${c.id}`]||0)+1;return{value:null,coins:coins-c.seed};
    }
    if(op==='service'){
     const item=VILLAGE_SHOP.find(x=>x.id===raw.item);const npc=this.roster().find(n=>n.id===item?.npc);if(!item||!npc||at.map!=='human/town'||!near(npc.x,npc.y,160))throw new Error('Hãy tới đúng quầy hàng');if(coins<item.coins)throw new Error('Không đủ xu');return{value:null,coins:coins-item.coins,...('potions'in item?{potions:item.potions}:{buff:true})};
    }
    if(!s.unlocked||!farmMaps(account).includes(at.map))throw new Error('Chỉ chủ nhà được thao tác trong Gia viên đã mở');
    if(op==='outfit'){if(at.map!==roomMap(account,'bedroom')||!near(...FARM_WARDROBE))throw new Error('Hãy tới tủ quần áo trong phòng ngủ');if(raw.outfit!=='farmer1'&&raw.outfit!=='gardener')throw new Error('Không có bộ đồ này');s.outfit=raw.outfit;return{value:null};}
    const fishing=op==='cast'||op==='pull';if(fishing&&at.map!==POND_MAP)throw new Error('Hãy ra hồ câu cạnh khuôn viên');if(!fishing&&at.map!==homeMap(account))throw new Error('Hãy ra khuôn viên trước');
    if(op==='sell'){
     if(!near(736,352))throw new Error('Hãy tới hộp gửi hàng');let total=0;
     for(const c of FARM_CROPS){const k=`farm_${c.id}`;total+=(s.inventory[k]||0)*c.sell;s.inventory[k]=0;}
     for(const f of FARM_FISH){const k=`fish_${f.id}`;total+=(s.inventory[k]||0)*f.sell;s.inventory[k]=0;}
     if(!total)throw new Error('Kho chưa có nông sản hoặc cá để bán');return{value:null,coins:coins+total};
    }
    if(op==='pull'){
     const f=s.fish;if(!f||f.nonce!==raw.nonce)throw new Error('Lượt câu không hợp lệ');
     if(this.now()<f.biteAt)throw new Error('Cá chưa cắn câu');if(this.now()>f.expires){s.fish=null;return{value:'miss'};}
     if(!pondSpotNear(at.x,at.y))throw new Error('Bạn đã rời mép hồ');s.inventory[`fish_${f.reward}`]=(s.inventory[`fish_${f.reward}`]||0)+1;s.fish=null;return{value:null};
    }
    if(this.now()-s.lastAction<600)throw new Error('Chờ thao tác trước hoàn tất');
    if(op==='cast'){
     if(!pondSpotNear(at.x,at.y))throw new Error('Hãy tới chỗ câu bên bờ hồ');if(s.fish&&this.now()<s.fish.expires)throw new Error('Bạn đang câu cá');
     const biteAt=this.now()+3000+Math.floor(this.random()*9001);s.fish={nonce:randomUUID(),biteAt,expires:biteAt+1800,reward:chooseFarmFish(this.now(),this.random())};s.lastAction=this.now();return{value:null};
    }
    const i=Number(raw.plot);if(!Number.isInteger(i)||i<0||i>=12)throw new Error('Ô ruộng không hợp lệ');const point=plotPoint(i);if(!near(point.x,point.y,105))throw new Error('Hãy tới gần ô ruộng');const p=s.plots[i]!;growPlot(p,this.now());
    if(op==='hoe'){if(p.crop)throw new Error('Ô này đang có cây');p.tilled=true;}
    else if(op==='plant'){const c=FARM_CROPS.find(x=>x.id===raw.crop);if(!p.tilled||p.crop||!c)throw new Error('Cần ô đất đã xới và chưa có cây');const key=`seed_${c.id}`;if(!((s.inventory[key]??0)>0))throw new Error('Bạn hết hạt giống này');s.inventory[key]=(s.inventory[key]??0)-1;Object.assign(p,{crop:c.id,plantedAt:this.now(),lastAt:this.now(),growth:0,watered:false});}
    else if(op==='water'){if(!p.crop)throw new Error('Hãy gieo cây trước');p.watered=true;}
    else if(op==='harvest'){const c=FARM_CROPS.find(x=>x.id===p.crop);if(!c||p.growth<c.ms)throw new Error('Cây chưa chín');const key=`farm_${c.id}`;s.inventory[key]=(s.inventory[key]||0)+1;Object.assign(p,{crop:null,growth:0,watered:false,lastAt:0,plantedAt:0});}
    else throw new Error('Thao tác Gia viên không hợp lệ');s.lastAction=this.now();return{value:null};
   });
   this.host.refresh(id);this.send(id,account);
  }catch(e){this.host.send(id,{t:'system',text:e instanceof Error?e.message:'Không thực hiện được thao tác'});}
 }
}
