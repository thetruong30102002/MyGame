import {randomInt,randomUUID} from 'node:crypto';
import {FARM_CROPS,FARM_FISH,FARM_LAYOUT,FARM_ROOMS,FARM_SHOP,FARM_TANK,FARM_PETS,FARM_STARTER_CROPS,FARM_WARDROBE,PET_GACHA,POND_MAP,DECOR_ITEMS,chooseFarmFish,decorOf,decorPlaceIssue,rollPet,growPlot,plotPoint,pondSpotNear,shopPrice,type FarmRoom,type FarmState} from '@havenlord/sim/farm';
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
   this.store.farm.run<unknown>(account,id,this.now(),(s,coins,gems)=>{
    if(op==='talk'){
     const npc=this.roster().find(n=>n.id===raw.npc);if(!npc||at.map!=='human/town'||!near(npc.x,npc.y,130))throw new Error('Hãy tới gần người muốn trò chuyện');
     if(!s.visited.includes(npc.id))s.visited.push(npc.id);
     if(!s.unlocked&&this.roster().every(n=>s.visited.includes(n.id))){s.unlocked=true;for(const c of FARM_STARTER_CROPS)s.inventory[`seed_${c}`]=3;this.host.send(id,{t:'system',text:'Bạn đã quen cư dân Thistlewood. Gia viên đã mở; nhận 3 hạt mỗi loại trong kho!'});}
     return{value:null};
    }
    if(op==='buySeed'){
     const plaza=spotOf(this.mapsDir,'human/town','plaza');const atShop=at.map===homeMap(account)&&near(FARM_LAYOUT.shopX,FARM_LAYOUT.shopY,130);if(!atShop&&(at.map!=='human/town'||!plaza||!near(plaza.x-110,plaza.y-40,240)))throw new Error('Hãy tới quầy Bram hoặc người bán đồ Gia viên mua hạt');
     const c=FARM_CROPS.find(c=>c.id===raw.crop);if(!c)throw new Error('Không có hạt này');if(coins<c.seed)throw new Error('Không đủ xu');s.inventory[`seed_${c.id}`]=(s.inventory[`seed_${c.id}`]||0)+1;return{value:null,coins:coins-c.seed};
    }
    if(op==='service'){
     const item=VILLAGE_SHOP.find(x=>x.id===raw.item);const npc=this.roster().find(n=>n.id===item?.npc);if(!item||!npc||at.map!=='human/town'||!near(npc.x,npc.y,160))throw new Error('Hãy tới đúng quầy hàng');if(coins<item.coins)throw new Error('Không đủ xu');return{value:null,coins:coins-item.coins,...('potions'in item?{potions:item.potions}:{buff:true})};
    }
    if(!s.unlocked||!farmMaps(account).includes(at.map))throw new Error('Chỉ chủ nhà được thao tác trong Gia viên đã mở');
    if(op==='gacha'||op==='petOut'||op==='petTrade'){
     if(!s.unlocked||!farmMaps(account).includes(at.map))throw new Error('Thú cưng ở trong Gia viên của bạn');
     const pets=s.pets??(s.pets=[]),out=s.petsOut??(s.petsOut=[]);
     if(op==='gacha'){
      // Máy chủ quay + giữ kết quả; client chỉ thấy kết quả sau khi đã trừ kim cương.
      const count=raw.plot===10?10:1,cost=count===10?PET_GACHA.ten:PET_GACHA.one;if(gems<cost)throw new Error('Không đủ kim cương');
      const spins:{pet:string;dup:boolean}[]=[];let pity=s.petPity??0;
      for(let k=0;k<count;k++){
       const guaranteeRare=count===10&&k===9&&!spins.some(x=>(FARM_PETS.find(p=>p.id===x.pet)?.rarity??1)>=2);
       const min=pity+1>=PET_GACHA.pity?4:guaranteeRare?2:1;
       const pet=rollPet(this.random(),this.random(),min),rarity=FARM_PETS.find(p=>p.id===pet)!.rarity;
       pity=rarity===4?0:pity+1;
       const dup=pets.includes(pet);if(dup)s.petShards=(s.petShards??0)+PET_GACHA.shards[rarity-1]!;else{pets.push(pet);if(out.length<PET_GACHA.out)out.push(pet);}
       spins.push({pet,dup});
      }
      s.petPity=pity;s.lastSpin=spins;return{value:null,diamonds:gems-cost};
     }
     const pet=FARM_PETS.find(p=>p.id===raw.item);if(!pet)throw new Error('Không có thú cưng này');
     if(op==='petOut'){if(!pets.includes(pet.id))throw new Error('Bạn chưa có thú cưng này');const i=out.indexOf(pet.id);if(i>=0)out.splice(i,1);else{if(out.length>=PET_GACHA.out)throw new Error(`Tối đa ${PET_GACHA.out} thú đi lại cùng lúc`);out.push(pet.id);}return{value:null};}
     if(pets.includes(pet.id))throw new Error('Bạn đã có thú cưng này');const price=PET_GACHA.trade[pet.rarity-1]!;if((s.petShards??0)<price)throw new Error('Không đủ mảnh');
     s.petShards=(s.petShards??0)-price;pets.push(pet.id);if(out.length<PET_GACHA.out)out.push(pet.id);return{value:null};
    }
    if(op==='decorStore'||op==='decorPlace'){
     // Bày trí (Quản gia mở bảng): cất đồ của phòng đang đứng vào kho, hoặc đặt đồ trong kho ngay trước chỗ đang đứng.
     const room=roomOf(account,at.map);if(!room)throw new Error('Bày trí chỉ ở trong nhà');
     const list=decorOf(s,room),st=s.storage??(s.storage={});
     if(op==='decorStore'){const i=Number(raw.plot);if(!Number.isInteger(i)||i<0||i>=list.length)throw new Error('Không có món này trong phòng');const [q]=list.splice(i,1);st[q!.id]=(st[q!.id]??0)+1;}
     else{const id=String(raw.item||'');if(!DECOR_ITEMS[id]||!((st[id]??0)>0))throw new Error('Kho không có món này');const x=Math.round(at.x),y=Math.round(at.y)-24;
      const issue=decorPlaceIssue(room,list,id,x,y);if(issue)throw new Error(issue);list.push({id,x,y});st[id]=(st[id]??0)-1;}
     (s.decor??(s.decor={}))[room]=list;return{value:null};
    }
    if(op==='buy'){
     // Cửa hàng Quản gia (đứng ở khuôn viên): mở ô ruộng / mua bể cá; máy chủ trừ xu và ghi đồ đã có trong cùng một giao dịch.
     if(at.map!==homeMap(account)||!near(FARM_LAYOUT.shopX,FARM_LAYOUT.shopY,130))throw new Error('Hãy tới người bán đồ Gia viên ở khuôn viên');
     const it=FARM_SHOP.find(x=>x.id===raw.item);if(!it)throw new Error('Không bán món này');
     const owned=s.owned??(s.owned=[]);
     if(it.id==='plots'&&s.plots.length>=FARM_LAYOUT.plotsMax)throw new Error('Ruộng đã mở hết');
     if(it.id==='tank'&&owned.includes('tank'))throw new Error('Bạn đã có bể cá');
     const price=shopPrice(it.id,s);if(coins<price)throw new Error('Không đủ xu');
     if(it.id==='plots')for(let k=0;k<4;k++)s.plots.push({tilled:false,crop:null,plantedAt:0,lastAt:0,growth:0,watered:false});
     else{owned.push(it.id);if(it.id==='tank'){const st=s.storage??(s.storage={});st[FARM_TANK.item]=(st[FARM_TANK.item]??0)+1;}}
     return{value:null,coins:coins-price};
    }
    if(op==='tank'||op==='untank'){
     if(!(s.owned??[]).includes('tank'))throw new Error('Hãy mua bể cá ở chỗ Quản gia trước');
     // Bể cá ở phòng khách: thả cá trong kho vào bể (tối đa FARM_TANK.slots con) hoặc lấy lại về kho; cá trong bể không bị bán.
     const room=roomOf(account,at.map);if(!room||!decorOf(s,room).some(q=>q.id===FARM_TANK.item&&near(q.x,q.y)))throw new Error('Hãy tới cạnh bể cá đã đặt trong nhà');
     const tank=s.tank??(s.tank=[]);
     if(op==='tank'){const f=FARM_FISH.find(x=>x.id===raw.item);const key=`fish_${f?.id}`;if(!f||!((s.inventory[key]??0)>0))throw new Error('Kho không có con cá này');if(tank.length>=FARM_TANK.slots)throw new Error('Bể đã đầy');s.inventory[key]=(s.inventory[key]??0)-1;tank.push(f.id);}
     else{const i=Number(raw.plot);if(!Number.isInteger(i)||i<0||i>=tank.length)throw new Error('Bể không có con cá này');const [f]=tank.splice(i,1);s.inventory[`fish_${f}`]=(s.inventory[`fish_${f}`]||0)+1;}
     return{value:null};
    }
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
    const i=Number(raw.plot);if(!Number.isInteger(i)||i<0||i>=s.plots.length)throw new Error('Ô ruộng chưa mở hoặc không hợp lệ');const point=plotPoint(i);if(!near(point.x,point.y,105))throw new Error('Hãy tới gần ô ruộng');const p=s.plots[i]!;growPlot(p,this.now());
    if(op==='hoe'){if(p.crop)throw new Error('Ô này đang có cây');p.tilled=true;}
    else if(op==='plant'){const c=FARM_CROPS.find(x=>x.id===raw.crop);if(!p.tilled||p.crop||!c)throw new Error('Cần ô đất đã xới và chưa có cây');const key=`seed_${c.id}`;if(!((s.inventory[key]??0)>0))throw new Error('Bạn hết hạt giống này');s.inventory[key]=(s.inventory[key]??0)-1;Object.assign(p,{crop:c.id,plantedAt:this.now(),lastAt:this.now(),growth:0,watered:false});}
    else if(op==='water'){if(!p.crop)throw new Error('Hãy gieo cây trước');p.watered=true;}
    else if(op==='harvest'){const c=FARM_CROPS.find(x=>x.id===p.crop);if(!c||p.growth<c.ms)throw new Error('Cây chưa chín');const key=`farm_${c.id}`;s.inventory[key]=(s.inventory[key]||0)+1;Object.assign(p,{crop:null,growth:0,watered:false,lastAt:0,plantedAt:0});}
    else throw new Error('Thao tác Gia viên không hợp lệ');s.lastAction=this.now();return{value:null};
   });
   this.host.refresh(id);if(op==='gacha')this.host.send(id,{t:'wallet',diamonds:this.store.diamonds(id)});this.send(id,account);
  }catch(e){this.host.send(id,{t:'system',text:e instanceof Error?e.message:'Không thực hiện được thao tác'});}
 }
}
