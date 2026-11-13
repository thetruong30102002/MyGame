import {randomInt,randomUUID} from 'node:crypto';
import {FARM_CROPS,FARM_FISH,FARM_LAYOUT,FARM_ROOMS,FARM_SHOP,FARM_TANK,FARM_ANIMALS,FARM_DISHES,FARM_HOUSES,farmDoor,FARM_FEED,FARM_FRUIT,FARM_PENS,HAVEN_DAY_MS,livestockOf,FARM_MACHINES,FARM_STOVE,FARM_MACHINE_SPOTS,FARM_PETS,FARM_PRODUCT_SELL,FARM_STARTER_CROPS,FARM_TREE_SPOTS,FARM_WARDROBE,treeStage,PET_GACHA,isPondMap,pondMap,DECOR_ITEMS,chooseFarmFish,decorOf,decorPlaceIssue,decorSpot,rollPet,growPlot,plotPoint,pondSpotNear,shopPrice,type FarmRoom,type FarmState} from '@havenlord/sim/farm';
import {STORY} from '@havenlord/sim/story/story';
import {COOK_QUALITY,FISH_MAX_TICKS,FISH_TICK_MS,cookQuality,fishFight,fishPower,type CookQuality} from '@havenlord/sim/minigames';
import {VILLAGE_SHOP} from '@havenlord/sim/village';
import {SERVICE_ROOMS,SERVICE_TOWNS,serviceRole} from '@havenlord/sim/serviceTowns';
import {accrue,bankApply,bankQuote,type BankOp} from '@havenlord/sim/bank';
import type {ServerMessage} from '@havenlord/protocol';
import {spotOf} from './maps.ts';
import type {Store} from './db.ts';

export interface FarmHost {life?(id:string,kind:'harvest'|'fish'|'cook'|'feed'):void;where(id:string):{map:string;x:number;y:number}|null;send(id:string,msg:ServerMessage):void;move(id:string,map:string):void;refresh(id:string):void;count?(map:string):number}
export const homeMap=(account:number,inside=false)=>`home/${account}${inside?'_inside':''}`;
/** Map từng phòng trong nhà: phòng khách giữ id cũ `_inside`, thêm bếp / phòng ngủ. */
export const roomMap=(account:number,room:FarmRoom)=>room==='house'?homeMap(account,true):`home/${account}_${room}`;
const roomOf=(account:number,map:string|undefined):FarmRoom|null=>(Object.keys(FARM_ROOMS) as FarmRoom[]).find(r=>roomMap(account,r)===map)??null;
/** Map Gia viên người này được vào: khuôn viên + nhà riêng + hồ câu dùng chung. */
export const farmMaps=(account:number)=>[homeMap(account),pondMap(account),...(Object.keys(FARM_ROOMS) as FarmRoom[]).map(r=>roomMap(account,r))];
export class Farm {
 /** Khách ghé hồ bạn: nhân vật → hồ được phép vào (đặt khi máy chủ đã kiểm bạn bè + chỗ trống). */
 private pondGuests=new Map<string,string>();
 /** Map Gia viên nhân vật này được vào: Gia viên của mình + hồ bạn đang được mời. */
 canEnterMap(id:string,account:number,map:string){return farmMaps(account).includes(map)||this.pondGuests.get(id)===map;}
 constructor(private store:Store,private host:FarmHost,private mapsDir:string,private now:()=>number=Date.now,private random:()=>number=()=>randomInt(1000000)/1000000){}
 /** Chỗ đứng NPC: map trạm của vùng hoặc phòng nhà dịch vụ (`svc_*`, 13/11/2026). */
 npcPlace(id:string):{map:string;x:number;y:number}|null{const n=STORY.npcs[id];if(!n)return null;const region=n.region??'human';const hub=SERVICE_TOWNS.find(t=>t.region===region)?.hub??(region==='human'?'town':'hub');
  for(const m of [hub,...SERVICE_ROOMS.map(r=>`svc_${r}`)]){const s=spotOf(this.mapsDir,`${region}/${m}`,n.at.spot);if(s)return{map:`${region}/${m}`,x:s.x+(n.at.dx??0),y:s.y+(n.at.dy??0)};}return null;}
 /** Cư dân Thistlewood cần làm quen để mở Gia viên: như trước 13/11 (người bán cũ nay đứng quầy trong nhà vẫn tính), NPC quầy mới `village_tl_*` không tính. */
 roster(){return Object.entries(STORY.npcs).flatMap(([id,n])=>{if(/^village_[a-z]{2}_|^q2_/.test(id)||!n.sprite||(n.region&&n.region!=='human')||n.ages[0]>16||n.ages[1]<16)return[];const p=this.npcPlace(id);return p?[{id,name:n.name,map:p.map,x:p.x,y:p.y}]:[];});}
 canEnter(account:number){return this.store.farm.read(account).unlocked;}
 /** Nhiệm vụ mới M05 "Bàn giao khuôn viên" (13/11/2026) mở Gia viên + hạt khởi đầu; đã mở thì giữ nguyên. */
 unlockByQuest(id:string,account:number){this.store.farm.run(account,id,this.now(),s=>{if(!s.unlocked){s.unlocked=true;for(const c of FARM_STARTER_CROPS)s.inventory[`seed_${c}`]=3;}return{value:null};});}
 private send(id:string,account:number,enter=false){const state=this.store.farm.read(account);for(const p of state.plots)growPlot(p,this.now());const at=this.host.where(id);const fish=state.fish?{nonce:state.fish.nonce,biteAt:state.fish.biteAt,expires:state.fish.expires,hookedAt:state.fish.hookedAt??null,seed:state.fish.seed??null,power:state.fish.power??null}:null;const inRoom=roomOf(account,at?.map);const room=at&&isPondMap(at.map)?'pond':inRoom??'garden';this.host.send(id,{t:'farm',state:{...state,fish,bank:accrue(state.bank,this.now()),bankQuote:bankQuote(this.now()),required:this.roster(),map:room==='pond'?at!.map:inRoom?roomMap(account,inRoom):homeMap(account),room,now:this.now(),enter}});}
 handle(id:string,account:number,raw:{op?:unknown;plot?:unknown;crop?:unknown;npc?:unknown;nonce?:unknown;outfit?:unknown;item?:unknown;room?:unknown;toggles?:unknown}):void{
  const op=String(raw.op||'');const at=this.host.where(id);if(!at)return;
  const near=(x:number,y:number,r=110)=>Math.hypot(at.x-x,at.y-y)<=r;
  try{
   if(op==='get'){this.send(id,account);return;}
   if(op==='leave'){if(!farmMaps(account).includes(at.map)&&!isPondMap(at.map))throw new Error('Bạn chưa ở Gia viên');this.pondGuests.delete(id);this.host.send(id,{t:'farm',state:{leave:true}});this.host.move(id,'human/town');return;}
   if(op==='pond'){
    // Đi bộ qua cổng: khuôn viên (cổng mép nam) ⇄ hồ câu dùng chung (cổng bờ tây).
    if(!this.canEnter(account))throw new Error('Hãy làm quen hết cư dân Thistlewood trước khi nhận Gia viên');
    const fromGarden=at.map===homeMap(account);if(!fromGarden&&!isPondMap(at.map))throw new Error('Hồ câu nằm cạnh khuôn viên của bạn');
    if(fromGarden&&!near(FARM_LAYOUT.pondGateX,FARM_LAYOUT.pondGateY))throw new Error('Hãy tới cổng ra hồ câu');
    if(!fromGarden&&!near(FARM_LAYOUT.pondBackX,FARM_LAYOUT.pondBackY))throw new Error('Hãy tới cổng về khuôn viên');
    if(!fromGarden)this.store.farm.run(account,id,this.now(),s=>{s.fish=null;return{value:null};});
    if(fromGarden&&(this.host.count?.(pondMap(account))??0)>=FARM_LAYOUT.pondMax)throw new Error(`Hồ đã đủ ${FARM_LAYOUT.pondMax} người`);
    if(!fromGarden)this.pondGuests.delete(id);
    const target=fromGarden?pondMap(account):homeMap(account);
    this.host.send(id,{t:'farm',state:{travel:fromGarden?'pond':'garden',spot:fromGarden?'from_garden':'from_pond',map:target}});this.host.move(id,target);this.send(id,account);return;
   }
   if(op==='visitPond'){
    // Câu cùng bạn: sang hồ sau Gia viên của một người bạn (hai người là bạn, bạn đã mở Gia viên, hồ còn chỗ — tối đa 6 người).
    if(!this.canEnter(account))throw new Error('Hãy mở Gia viên của bạn trước');
    const friend=String(raw.item||'');if(!this.store.areFriends(id,friend))throw new Error('Chỉ ghé hồ nhà bạn bè');
    const owner=this.store.farm.accountOf(friend);if(owner===null||!this.store.farm.read(owner).unlocked)throw new Error('Bạn này chưa có Gia viên');
    if(!farmMaps(account).includes(at.map)&&at.map!=='human/town'&&!isPondMap(at.map))throw new Error('Hãy về Thistlewood hoặc Gia viên trước');
    const target=pondMap(owner);if(at.map===target)throw new Error('Bạn đang ở hồ này');
    if((this.host.count?.(target)??0)>=FARM_LAYOUT.pondMax)throw new Error(`Hồ đã đủ ${FARM_LAYOUT.pondMax} người`);
    this.store.farm.run(account,id,this.now(),s=>{s.fish=null;return{value:null};});
    this.pondGuests.set(id,target);this.host.send(id,{t:'farm',state:{travel:'pond',spot:'from_garden',map:target}});this.host.move(id,target);this.send(id,account);return;
   }
   if(op==='enter'||op==='room'){
    if(!this.canEnter(account))throw new Error('Hãy làm quen hết cư dân Thistlewood trước khi nhận Gia viên');
    if(op==='enter'&&at.map!=='human/town')throw new Error('Hãy trở về Thistlewood để về nhà');
    if(op==='enter')this.store.farm.run(account,id,this.now(),s=>{if(s.lastEntry&&this.now()-s.lastEntry<300000)throw new Error('Về Gia viên đang hồi: tối đa một lần mỗi 5 phút');s.lastEntry=this.now();return{value:null};});
    if(op==='room'&&at.map!==homeMap(account)&&at.map!==homeMap(account,true))throw new Error('Ra vườn phải đi từ phòng khách');
    if(op==='room'&&at.map===homeMap(account)){const d=farmDoor(this.store.farm.read(account));if(!near(d.x,d.y))throw new Error('Hãy tới cửa nhà');}
    if(op==='room'&&at.map===homeMap(account,true)&&!near(...FARM_ROOMS.house.garden))throw new Error('Hãy tới cửa ra vườn');
    const target=homeMap(account,op==='room'&&at.map===homeMap(account));
    const inside=target.endsWith('_inside');
    this.host.send(id,{t:'farm',state:{travel:inside?'house':'garden',spot:op==='enter'?null:inside?'from_garden':this.store.farm.read(account).house?'from_house_big':'from_house',map:target}});this.host.move(id,target);this.send(id,account);return;
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
   const value=this.store.farm.run<unknown>(account,id,this.now(),(s,coins,gems)=>{
    if(op==='talk'){
     const npc=this.roster().find(n=>n.id===raw.npc);if(!npc||at.map!==npc.map||!near(npc.x,npc.y,130))throw new Error('Hãy tới gần người muốn trò chuyện');
     if(!s.visited.includes(npc.id))s.visited.push(npc.id);
     if(!s.unlocked&&this.roster().every(n=>s.visited.includes(n.id))){s.unlocked=true;for(const c of FARM_STARTER_CROPS)s.inventory[`seed_${c}`]=3;this.host.send(id,{t:'system',text:'Bạn đã quen cư dân Thistlewood. Gia viên đã mở; nhận 3 hạt mỗi loại trong kho!'});}
     return{value:null};
    }
    if(op==='buySeed'){
     const plaza=spotOf(this.mapsDir,'human/town','plaza');const atShop=at.map===homeMap(account)&&near(FARM_LAYOUT.shopX,FARM_LAYOUT.shopY,130);if(!atShop&&(at.map!=='human/town'||!plaza||!near(plaza.x-110,plaza.y-40,240)))throw new Error('Hãy tới quầy Bram hoặc người bán đồ Gia viên mua hạt');
     const c=FARM_CROPS.find(c=>c.id===raw.crop);if(!c)throw new Error('Không có hạt này');if(coins<c.seed)throw new Error('Không đủ xu');s.inventory[`seed_${c.id}`]=(s.inventory[`seed_${c.id}`]||0)+1;return{value:null,coins:coins-c.seed};
    }
    if(op==='service'){
     // Quầy mỗi khu (13/11): túi thuốc ở người bán hồi phục, món ăn ở chủ quán rượu (hoặc Maya ở quảng trường Thistlewood).
     const item=VILLAGE_SHOP.find(x=>x.id===raw.item);const key=typeof raw.npc==='string'?raw.npc:item?.npc??'';const npc=item&&serviceRole(key)===serviceRole(item.npc)?this.npcPlace(key):null;
     if(!item||!npc||at.map!==npc.map||!near(npc.x,npc.y,160))throw new Error('Hãy tới đúng quầy hàng');if(coins<item.coins)throw new Error('Không đủ xu');return{value:null,coins:coins-item.coins,...('potions'in item?{potions:item.potions}:{buff:true})};
    }
    // Ngân hàng (13/11): gửi / rút xu, mua / bán thỏi vàng ở chủ ngân hàng khu bất kỳ — không cần mở Gia viên.
    if(op==='bank'){
     const key=typeof raw.npc==='string'?raw.npc:'';const npc=serviceRole(key)==='bank'?this.npcPlace(key):null;
     if(!npc||at.map!==npc.map||!near(npc.x,npc.y,160))throw new Error('Hãy tới quầy chủ ngân hàng');
     const kind=String(raw.item||'') as BankOp;if(!['deposit','withdraw','buyGold','sellGold'].includes(kind))throw new Error('Thao tác không có');
     const r=bankApply(s.bank,coins,kind,Number(raw.plot),this.now());if('error'in r)throw new Error(r.error);
     s.bank=r.bank;return{value:null,coins:r.pocket};
    }
    if(!s.unlocked||!(farmMaps(account).includes(at.map)||(isPondMap(at.map)&&(op==='cast'||op==='pull'||op==='land'))))throw new Error('Chỉ chủ nhà được thao tác trong Gia viên đã mở');
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
    if(op==='cookDone'){
     // Nhấc món khỏi chảo: độ chín = thời gian máy chủ đo ÷ thời gian món → tái / chín / chín kỹ / cháy.
     const c=s.cooking;if(!c)throw new Error('Chảo đang trống');const d=FARM_DISHES.find(x=>x.id===c.dish)!;const q=cookQuality(this.now()-c.startedAt,d.cookMs);
     const key=q==='perfect'?d.id:`${d.id}@${q}`;s.inventory[key]=(s.inventory[key]||0)+1;s.cooking=null;return{value:q};
    }
    if(op==='cook'||op==='eat'){
     const [base,qq]=String(raw.item||'').split('@');const q=(qq??'perfect') as CookQuality;const d=FARM_DISHES.find(x=>x.id===base);if(!d||!COOK_QUALITY[q])throw new Error('Không có món này');
     if(op==='eat'){const key=String(raw.item);if(!((s.inventory[key]??0)>0))throw new Error('Kho không có món này');if(q==='burnt')throw new Error('Món cháy rồi, ăn không được');
      s.inventory[key]=(s.inventory[key]??0)-1;const k=COOK_QUALITY[q].buff;return{value:null,buff:{kind:d.buff.kind,mult:1+(d.buff.mult-1)*k,ms:d.buff.ms}};}// giáp 0,88 × 0,5 → 0,94
     // Nấu: đứng cạnh bếp lò củi đã đặt trong phòng (bày trí dời được), đủ nguyên liệu trong kho.
     const room=roomOf(account,at.map);if(!room||!decorOf(s,room).some(q=>q.id===FARM_STOVE&&near(q.x,q.y)))throw new Error('Hãy tới cạnh bếp lò trong nhà');
     if(s.cooking)throw new Error('Chảo đang có món, hãy nhấc ra trước');
     if(!Object.entries(d.in).every(([k,n])=>(s.inventory[k]??0)>=n))throw new Error('Kho thiếu nguyên liệu');
     for(const [k,n] of Object.entries(d.in))s.inventory[k]=(s.inventory[k]??0)-n;s.cooking={dish:d.id,startedAt:this.now()};return{value:null};
    }
    if(op==='feed'||op==='collect'||op==='butcher'){
     // Chăn nuôi: đứng ở cổng bãi / cạnh tổ ong của loài đó.
     if(at.map!==homeMap(account))throw new Error('Hãy ra khuôn viên trước');
     const a=FARM_ANIMALS.find(x=>x.id===raw.item);if(!a)throw new Error('Không có loài này');const pen=FARM_PENS[a.pen]!;if(!near(pen.gate[0],pen.gate[1],120))throw new Error('Hãy tới cổng chuồng');
     const l=livestockOf(s),e=l[a.id]!;if(e.count<=0)throw new Error(`Chưa có ${a.name.toLowerCase()} nào`);
     if(op==='feed'){
      if(a.feed===0)throw new Error('Ong tự kiếm mật, không cần cho ăn');if(e.fedAt)throw new Error('Đã cho ăn, chờ thu sản phẩm');
      let need=a.feed*e.count;const take:Record<string,number>={};for(const f of FARM_FEED){const n=Math.min(need,s.inventory[f]??0);take[f]=n;need-=n;}
      if(need>0)throw new Error(`Cần ${a.feed*e.count} lúa mì / ngô để cho ăn`);for(const [k,n] of Object.entries(take))s.inventory[k]=(s.inventory[k]??0)-n;
      e.fedAt=this.now();s.livestock=l;return{value:null};
     }
     if(op==='collect'){
      // Ong: lần đầu tính từ lúc nhận Gia viên (fedAt = 0 → bắt đầu đếm ngày); loài khác phải cho ăn trước.
      if(a.feed===0&&!e.fedAt){e.fedAt=this.now();s.livestock=l;this.host.send(id,{t:'system',text:'Đàn ong vừa bắt đầu làm mật, quay lại sau một ngày Haven'});return{value:null};}
      if(!e.fedAt)throw new Error('Hãy cho ăn trước');if(this.now()-e.fedAt<HAVEN_DAY_MS)throw new Error('Chưa tới lúc thu, chờ hết ngày Haven');
      s.inventory[a.product]=(s.inventory[a.product]||0)+e.count;e.fedAt=a.feed===0?this.now():0;s.livestock=l;return{value:null};
     }
     if(!a.meat)throw new Error('Loài này không xuất chuồng');e.count-=1;s.inventory[a.meat]=(s.inventory[a.meat]||0)+a.meatN;s.livestock=l;return{value:null};
    }
    if(op==='treePlant'||op==='treeHarvest'||op==='machineStart'||op==='machineCollect'){
     if(at.map!==homeMap(account))throw new Error('Hãy ra khuôn viên trước');
     if(op==='treePlant'||op==='treeHarvest'){
      // Vườn cây ăn quả: trồng cây giống vào chỗ trống, hái khi có quả (cây ra quả lại sau fruitMs).
      const i=Number(raw.plot);const spot=FARM_TREE_SPOTS[i];if(!spot)throw new Error('Không có chỗ trồng này');if(!near(spot[0],spot[1]))throw new Error('Hãy tới gần chỗ trồng cây');
      const trees=s.trees??(s.trees=FARM_TREE_SPOTS.map(()=>null));const t=trees[i]??null;
      if(op==='treePlant'){const f=FARM_FRUIT.find(x=>x.id===raw.item);if(!f)throw new Error('Không có cây giống này');if(t)throw new Error('Chỗ này đã có cây');const k=`sapling_${f.id}`;if(!((s.inventory[k]??0)>0))throw new Error('Kho không có cây giống này');s.inventory[k]=(s.inventory[k]??0)-1;trees[i]={kind:f.id,plantedAt:this.now(),lastHarvest:0};return{value:null};}
      if(!t||treeStage(t,t.kind,this.now())!==2)throw new Error('Cây chưa có quả');t.lastHarvest=this.now();const k=`farm_${t.kind}`;s.inventory[k]=(s.inventory[k]||0)+3;return{value:null};
     }
     // Máy chế biến: bỏ nguyên liệu (trừ ngay khỏi kho) → chờ → lấy thành phẩm.
     const m=FARM_MACHINES.find(x=>x.id===raw.item);const ms=s.machines??(s.machines={});if(!m||!(m.id in ms))throw new Error('Bạn chưa có máy này');
     const spot=FARM_MACHINE_SPOTS[m.id]!;if(!near(spot[0],spot[1]))throw new Error('Hãy tới cạnh máy');const job=ms[m.id]??null;
     if(op==='machineStart'){
      if(job)throw new Error('Máy đang chạy');const r=m.recipes.find(x=>x.id===raw.crop)??m.recipes.find(x=>Object.entries(x.in).every(([k,n])=>(s.inventory[k]??0)>=n));
      if(!r||!Object.entries(r.in).every(([k,n])=>(s.inventory[k]??0)>=n))throw new Error('Kho thiếu nguyên liệu');
      for(const [k,n] of Object.entries(r.in))s.inventory[k]=(s.inventory[k]??0)-n;ms[m.id]={recipe:r.id,readyAt:this.now()+r.ms};return{value:null};
     }
     if(!job)throw new Error('Máy chưa chạy');if(this.now()<job.readyAt)throw new Error('Chưa xong, đợi thêm chút');const r=m.recipes.find(x=>x.id===job.recipe)!;s.inventory[r.out]=(s.inventory[r.out]||0)+1;ms[m.id]=null;return{value:null};
    }
    if(op==='houseSet'){
     // Đổi nhà đang ở (đã mua) hoặc về nhà nhỏ có sẵn (''); đồ bày trí trong nhà giữ nguyên, chỉ đổi mặt ngoài / tường / sàn / cầu thang.
     const hid=String(raw.item||'');if(hid&&!(s.houses??[]).includes(hid))throw new Error('Bạn chưa có nhà này');s.house=hid;return{value:null};
    }
    if(op==='decorStore'||op==='decorPlace'){
     // Bày trí (Quản gia mở bảng): cất đồ của phòng đang đứng vào kho, hoặc đặt đồ trong kho ngay trước chỗ đang đứng.
     const room=roomOf(account,at.map);if(!room)throw new Error('Bày trí chỉ ở trong nhà');
     const list=decorOf(s,room),st=s.storage??(s.storage={});
     if(op==='decorStore'){const i=Number(raw.plot);if(!Number.isInteger(i)||i<0||i>=list.length)throw new Error('Không có món này trong phòng');const [q]=list.splice(i,1);st[q!.id]=(st[q!.id]??0)+1;}
     else{const id=String(raw.item||'');if(!DECOR_ITEMS[id]||!((st[id]??0)>0))throw new Error('Kho không có món này');const {x,y}=decorSpot(id,at.x,at.y);
      const issue=decorPlaceIssue(room,list,id,x,y);if(issue)throw new Error(issue);list.push({id,x,y});st[id]=(st[id]??0)-1;}
     (s.decor??(s.decor={}))[room]=list;return{value:null};
    }
    if(op==='buy'){
     // Cửa hàng Quản gia (đứng ở khuôn viên): mở ô ruộng / mua bể cá; máy chủ trừ xu và ghi đồ đã có trong cùng một giao dịch.
     if(at.map!==homeMap(account)||!near(FARM_LAYOUT.shopX,FARM_LAYOUT.shopY,130))throw new Error('Hãy tới người bán đồ Gia viên ở khuôn viên');
     const sap=FARM_FRUIT.find(f=>`sapling_${f.id}`===raw.item),mach=FARM_MACHINES.find(m=>`machine_${m.id}`===raw.item);
     if(sap){if(coins<sap.sapling)throw new Error('Không đủ xu');s.inventory[`sapling_${sap.id}`]=(s.inventory[`sapling_${sap.id}`]||0)+1;return{value:null,coins:coins-sap.sapling};}
     const hid=typeof raw.item==='string'&&raw.item.startsWith('house:')?raw.item.slice(6):'';const house=hid?FARM_HOUSES[hid]:undefined;
     if(house){const hs=s.houses??(s.houses=[]);if(hs.includes(hid))throw new Error('Bạn đã có nhà này');if(coins<house.price)throw new Error('Không đủ xu');hs.push(hid);s.house=hid;return{value:null,coins:coins-house.price};}
     const dec=typeof raw.item==='string'&&raw.item.startsWith('decor:')?DECOR_ITEMS[raw.item.slice(6)]:undefined;
     if(dec){const did=String(raw.item).slice(6);if(coins<dec.price)throw new Error('Không đủ xu');const st=s.storage??(s.storage={});st[did]=(st[did]??0)+1;return{value:null,coins:coins-dec.price};}
     const ani=FARM_ANIMALS.find(a=>`animal_${a.id}`===raw.item);
     if(ani){const l=livestockOf(s);const e=l[ani.id]!;if(e.count>=ani.max)throw new Error(`Chuồng đã đủ ${ani.max} con`);if(coins<ani.price)throw new Error('Không đủ xu');e.count+=1;s.livestock=l;return{value:null,coins:coins-ani.price};}
     if(mach){const ms=s.machines??(s.machines={});if(mach.id in ms)throw new Error('Bạn đã có máy này');if(coins<mach.price)throw new Error('Không đủ xu');ms[mach.id]=null;return{value:null,coins:coins-mach.price};}
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
    const fishing=op==='cast'||op==='pull'||op==='land';if(fishing&&!isPondMap(at.map))throw new Error('Hãy ra hồ câu cạnh khuôn viên');if(!fishing&&at.map!==homeMap(account))throw new Error('Hãy ra khuôn viên trước');
    if(op==='sell'){
     if(!near(FARM_LAYOUT.sellX,FARM_LAYOUT.sellY))throw new Error('Hãy tới hộp gửi hàng');let total=0;
     for(const c of FARM_CROPS){const k=`farm_${c.id}`;total+=(s.inventory[k]||0)*c.sell;s.inventory[k]=0;}
     for(const f of FARM_FISH){const k=`fish_${f.id}`;total+=(s.inventory[k]||0)*f.sell;s.inventory[k]=0;}
     for(const [k,price] of Object.entries(FARM_PRODUCT_SELL)){total+=(s.inventory[k]||0)*price;s.inventory[k]=0;
      if(k.startsWith('dish_'))for(const q of ['raw','well','burnt'] as const){const kk=`${k}@${q}`;total+=Math.round((s.inventory[kk]||0)*price*COOK_QUALITY[q].sell);s.inventory[kk]=0;}}
     if(!total)throw new Error('Kho chưa có nông sản hoặc cá để bán');return{value:null,coins:coins+total};
    }
    if(op==='pull'){
     // Giật cần khi phao chìm → cá mắc câu, bắt đầu trận kéo (máy chủ giữ hạt giống + sức cá).
     const f=s.fish;if(!f||f.nonce!==raw.nonce)throw new Error('Lượt câu không hợp lệ');if(f.hookedAt)throw new Error('Cá đã mắc câu, đang kéo');
     if(this.now()<f.biteAt)throw new Error('Cá chưa cắn câu');if(this.now()>f.expires){s.fish=null;return{value:'miss'};}
     if(!pondSpotNear(at.x,at.y))throw new Error('Bạn đã rời mép hồ');
     f.hookedAt=this.now();f.seed=Math.floor(this.random()*4294967296)>>>0;f.power=fishPower(FARM_FISH.find(x=>x.id===f.reward)?.weight??30);return{value:null};
    }
    if(op==='land'){
     // Kết thúc trận kéo: chạy lại mô phỏng từ hạt giống + nhịp giữ / thả client gửi; thời gian thật phải khớp số nhịp.
     const f=s.fish;if(!f||f.nonce!==raw.nonce||!f.hookedAt||f.seed===undefined||f.power===undefined)throw new Error('Lượt câu không hợp lệ');
     const toggles=Array.isArray(raw.toggles)?raw.toggles.map(Number).filter(Number.isInteger).slice(0,2000):[];
     for(let i=1;i<toggles.length;i++)if(toggles[i]!<=toggles[i-1]!)throw new Error('Nhịp kéo không hợp lệ');
     const r=fishFight(f.seed,f.power,toggles);const real=this.now()-f.hookedAt;s.fish=null;
     if(r.result==='open'||real<r.tick*FISH_TICK_MS*0.7||real>FISH_MAX_TICKS*FISH_TICK_MS+8000)return{value:'escape'};
     if(r.result!=='caught')return{value:r.result};
     s.inventory[`fish_${f.reward}`]=(s.inventory[`fish_${f.reward}`]||0)+1;return{value:'caught'};
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
   // Nhiệm vụ mới (13/11): việc sinh hoạt đã commit → sự kiện cho việc hằng ngày / phụ.
   const life=op==='harvest'?'harvest':op==='cookDone'?'cook':op==='feed'?'feed':op==='land'&&value==='caught'?'fish':null;if(life)this.host.life?.(id,life);
   this.host.refresh(id);if(op==='gacha')this.host.send(id,{t:'wallet',diamonds:this.store.diamonds(id)});this.send(id,account);
  }catch(e){this.host.send(id,{t:'system',text:e instanceof Error?e.message:'Không thực hiện được thao tác'});}
 }
}
