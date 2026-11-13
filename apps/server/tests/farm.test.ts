// SQLite riêng: không mở / sửa CSDL thật, đồng hồ giả chỉ nằm trong bài kiểm này.
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {Store} from '../src/db.ts';
import {Farm,farmMaps,homeMap,roomMap} from '../src/farm.ts';
import {newProgress} from '../src/http.ts';
import {DECOR_DEFAULT,DECOR_ITEMS} from '@havenlord/sim/farmDecor.generated';
import {FARM_PETS,chooseFarmFish,pondMap} from '@havenlord/sim/farm';
import {FISH_START,fishStep,rng32} from '@havenlord/sim/minigames';
/** Người chơi mô phỏng: giữ tới căng 55, thả tới 25 — trả các nhịp đổi giữ / thả và số nhịp tới khi xong. */
const play=(seed:number,power:number)=>{const rand=rng32(seed),st={...FISH_START,burst:0};let hold=false;const t:number[]=[];for(let i=0;i<900;i++){const w=hold?st.tension<55:st.tension<25;if(w!==hold){hold=w;t.push(i);}fishStep(st,rand,power,hold);if(st.distance<=0||st.tension>=100||st.distance>=100)return{toggles:t,ticks:i};}return{toggles:t,ticks:900};};
import type {ServerMessage} from '@havenlord/protocol';

const dir=mkdtempSync(join(tmpdir(),'havenlord-farm-'));const file=join(dir,'test.db');let store=new Store(file);
try{
 const acc=store.createAccount('farm_test','unused')!;const progress=newProgress();progress.coins=200;
 const id=store.createCharacter('farm-character',acc,'Nông gia thử','male',progress,'player_npc_human1_sword_m')!.id;
 const acc2=store.createAccount('farm_guest','unused')!;const guest=store.createCharacter('guest-character',acc2,'Khách thử','female',newProgress(),'player_npc_elf1_sword_f')!.id;
 let now=1700000000000;let at={map:'human/town',x:1080,y:1368};const messages:ServerMessage[]=[];let pondCount=0;
 const farm=new Farm(store,{where:()=>at,send:(_id,m)=>messages.push(m),move:(_id,map)=>{at={...at,map};},refresh:()=>{},count:()=>pondCount},resolve('../../assets/maps'),()=>now,()=>0.001);
 const act=(op:string,extra:Record<string,unknown>={})=>{messages.length=0;farm.handle(id,acc,{op,...extra});now+=700;};
 const failed=()=>messages.some(m=>m.t==='system');
 act('enter');assert(failed());assert.equal(at.map,'human/town');
 at.x=0;at.y=0;act('talk',{npc:farm.roster()[0]!.id});assert(failed());assert.equal(store.farm.read(acc).visited.length,0);
 assert(farm.roster().some(n=>n.id==='village_event'));assert(farm.roster().some(n=>n.id==='village_armor'));
 // 13/11: người bán cũ đứng quầy trong nhà dịch vụ (map human/svc_*), cư dân khác ở quảng trường.
 assert.equal(farm.roster().find(n=>n.id==='village_armor')!.map,'human/svc_tb');
 for(const n of farm.roster()){at={map:n.map,x:n.x,y:n.y};act('talk',{npc:n.id});}
 assert(store.farm.read(acc).unlocked);assert.equal(Object.values(store.farm.read(acc).inventory).reduce((s,n)=>s+n,0),18);
 act('enter');assert.equal(at.map,homeMap(acc));
 at={map:homeMap(acc),x:352,y:544};act('hoe',{plot:0});assert(store.farm.read(acc).plots[0]!.tilled);
 act('plant',{plot:0,crop:'wheat'});assert.equal(store.farm.read(acc).inventory.seed_wheat,2);
 now+=150000;act('harvest',{plot:0});assert(failed());assert.equal(store.farm.read(acc).inventory.farm_wheat,undefined);
 act('water',{plot:0});const watered=store.farm.read(acc).plots[0]!;assert(watered.watered);assert(watered.growth>=75000&&watered.growth<90000);
 now+=225000;act('harvest',{plot:0});assert.equal(store.farm.read(acc).inventory.farm_wheat,1);assert.equal(store.farm.read(acc).plots[0]!.crop,null);
 at={map:homeMap(acc),x:360,y:288};act('cast');assert(failed(),'câu cá chỉ ở hồ câu');assert.equal(store.farm.read(acc).fish,null);
 act('pond');assert(failed(),'phải tới cổng hồ');at={map:homeMap(acc),x:240,y:940};act('pond');assert.equal(at.map,pondMap(acc));
 at={map:pondMap(acc),x:200,y:200};act('cast');assert(failed(),'phải đứng ở chỗ câu');at={map:pondMap(acc),x:360,y:288};
 act('cast');const fish=store.farm.read(acc).fish!;assert(fish);
 const packet=messages.find(m=>m.t==='farm');assert(packet?.t==='farm');assert(!('reward' in (packet.state as {fish:object}).fish));
 act('pull',{nonce:fish.nonce});assert(failed());assert(store.farm.read(acc).fish);
 now=fish.biteAt+100;act('pull',{nonce:fish.nonce});const hooked=store.farm.read(acc).fish!;assert(hooked.hookedAt&&hooked.seed!==undefined,'mắc câu → trận kéo');
 {const p=play(hooked.seed!,hooked.power!);act('land',{nonce:fish.nonce,toggles:[0]});assert.equal(store.farm.read(acc).inventory.fish_crucian,undefined,'giữ liên tục → đứt dây');}
 act('cast');{const f2=store.farm.read(acc).fish!;now=f2.biteAt+100;act('pull',{nonce:f2.nonce});const h=store.farm.read(acc).fish!;const p=play(h.seed!,h.power!);
  act('land',{nonce:f2.nonce,toggles:p.toggles});assert.equal(store.farm.read(acc).inventory.fish_crucian,undefined,'xong quá nhanh so với số nhịp → không nhận');
  act('cast');const f3=store.farm.read(acc).fish!;now=f3.biteAt+100;act('pull',{nonce:f3.nonce});const h3=store.farm.read(acc).fish!;const p3=play(h3.seed!,h3.power!);now+=p3.ticks*50;
  act('land',{nonce:f3.nonce,toggles:p3.toggles});assert.equal(store.farm.read(acc).inventory.fish_crucian,1,'kéo khéo + đúng thời gian → bắt được');}
 act('cast');const missed=store.farm.read(acc).fish!;now=missed.expires+1;act('pull',{nonce:missed.nonce});assert.equal(store.farm.read(acc).fish,null);assert.equal(store.farm.read(acc).inventory.fish_crucian,1);
 // Câu cùng bạn: chưa là bạn thì chặn; kết bạn rồi khách (đã mở Gia viên) sang hồ chủ; hồ đủ 6 người thì chặn.
 {const g=(op:string,extra:Record<string,unknown>={})=>{messages.length=0;farm.handle(guest,acc2,{op,...extra});now+=700;};
  store.farm.run(acc2,guest,now,s=>{s.unlocked=true;return{value:null};});const back=at;at={map:'human/town',x:0,y:0};
  g('visitPond',{item:id});assert(failed(),'chưa là bạn');store.addFriendship(id,guest);pondCount=6;g('visitPond',{item:id});assert(failed(),'hồ đủ 6 người');
  pondCount=1;g('visitPond',{item:id});assert.equal(at.map,pondMap(acc),'khách sang hồ chủ');assert(farm.canEnterMap(guest,acc2,pondMap(acc)));
  at={map:pondMap(acc),x:360,y:240};g('cast');assert(store.farm.read(acc2).fish,'khách câu bằng lượt của mình');at=back;pondCount=0;}
 at={map:pondMap(acc),x:96,y:352};act('pond');assert.equal(at.map,homeMap(acc));
 act('sell');assert(failed());at={map:homeMap(acc),x:880,y:520};act('sell');assert.equal(store.ecoOf(id)!.coins,218);assert.equal(store.farm.read(acc).inventory.farm_wheat,0);
 // Nhà 3 phòng, mỗi phòng một map: vào phòng khách từ cửa nhà, sang bếp / lên phòng ngủ phải đứng đúng cửa, đổi đồ ở tủ phòng ngủ.
 at={map:homeMap(acc),x:576,y:280};act('room');assert.equal(at.map,roomMap(acc,'house'));
 at={map:roomMap(acc,'house'),x:200,y:300};act('go',{room:'kitchen'});assert(failed(),'phải tới cửa bếp');
 at={map:roomMap(acc,'house'),x:48,y:288};act('go',{room:'kitchen'});assert.equal(at.map,roomMap(acc,'kitchen'));
 at={map:roomMap(acc,'kitchen'),x:464,y:288};act('go',{room:'bedroom'});assert(failed(),'bếp không thông lên phòng ngủ');act('go',{room:'house'});assert.equal(at.map,roomMap(acc,'house'));
 at={map:roomMap(acc,'house'),x:548,y:170};act('go',{room:'bedroom'});assert.equal(at.map,roomMap(acc,'bedroom'));
 at={map:roomMap(acc,'bedroom'),x:100,y:300};act('outfit',{outfit:'gardener'});assert(failed(),'phải tới tủ');
 at={map:roomMap(acc,'bedroom'),x:332,y:170};act('outfit',{outfit:'gardener'});assert.equal(store.farm.read(acc).outfit,'gardener');
 act('room');assert(failed(),'ra vườn phải qua phòng khách');
 // Quản gia ở khuôn viên: mở thêm 4 ô ruộng (giá tăng dần), mua bể cá; ô chưa mở không cuốc được; chưa mua bể thì không thả cá.
 at={map:roomMap(acc,'bedroom'),x:416,y:350};act('go',{room:'house'});at={map:roomMap(acc,'house'),x:492,y:350};act('tank',{item:'crucian'});assert(failed(),'chưa mua bể');
 at={map:roomMap(acc,'house'),x:320,y:400};act('room');at={map:homeMap(acc),x:352+32*4,y:544+32};act('hoe',{plot:12});assert(failed(),'ô 12 chưa mở');
 at={map:homeMap(acc),x:600,y:470};act('buy',{item:'plots'});assert(failed(),'phải tới Quản gia');
 store.farm.run(acc,id,now,(_s,c)=>({value:null,coins:c+10000}));const before=store.ecoOf(id)!.coins;
 at={map:homeMap(acc),x:780,y:500};act('buy',{item:'plots'});assert.equal(store.farm.read(acc).plots.length,16);assert.equal(store.ecoOf(id)!.coins,before-600);
 act('buy',{item:'plots'});assert.equal(store.farm.read(acc).plots.length,20);assert.equal(store.ecoOf(id)!.coins,before-600-900);
 act('buy',{item:'tank'});assert.equal(store.ecoOf(id)!.coins,before-1500-2000);act('buy',{item:'tank'});assert(failed(),'mua bể 1 lần');
 store.farm.run(acc,id,now,(_s,c)=>({value:null,coins:c-6500}));// trả lại đúng số xu thử đã cộng
 at={map:homeMap(acc),x:352+32*4,y:544+32};act('hoe',{plot:12});assert(store.farm.read(acc).plots[12]!.tilled);
 at={map:homeMap(acc),x:576,y:280};act('room');
 // Nấu ăn: phải đứng cạnh bếp lò trong nhà; thiếu nguyên liệu thì chặn; nấu xong có món; ăn món nhận bùa giáp; bán món.
 {const stove=DECOR_DEFAULT.kitchen!.find(q=>q.id==='gv_bep_lo_cui')!;store.farm.run(acc,id,now,s=>{s.inventory.farm_haven_pumpkin=1;s.inventory.farm_carrot=1;return{value:null};});
  at={map:roomMap(acc,'kitchen'),x:100,y:400};act('cook',{item:'dish_pumpkin_soup'});assert(failed(),'phải tới bếp');
  at={map:roomMap(acc,'kitchen'),x:stove.x,y:stove.y+30};act('cook',{item:'dish_fish_soup'});assert(failed(),'thiếu cá');
  act('cook',{item:'dish_pumpkin_soup'});assert.equal(store.farm.read(acc).inventory.farm_carrot,0);act('cook',{item:'dish_pumpkin_soup'});assert(failed(),'chảo đang có món');
  now+=9000*0.5;act('cookDone');assert.equal(store.farm.read(acc).inventory.dish_pumpkin_soup,1,'nhấc đúng lúc → chín');
  store.farm.run(acc,id,now,s=>{s.inventory.farm_haven_pumpkin=2;s.inventory.farm_carrot=2;return{value:null};});
  act('cook',{item:'dish_pumpkin_soup'});now+=1000;act('cookDone');assert.equal(store.farm.read(acc).inventory['dish_pumpkin_soup@raw'],1,'nhấc sớm → tái');
  act('cook',{item:'dish_pumpkin_soup'});now+=12000;act('cookDone');assert.equal(store.farm.read(acc).inventory['dish_pumpkin_soup@burnt'],1,'để lâu → cháy');
  act('eat',{item:'dish_pumpkin_soup@burnt'});assert(failed(),'món cháy không ăn được');
  act('eat',{item:'dish_pumpkin_soup'});assert(store.buffs(id).some(b=>b.kind==='guard'),'ăn súp bí được bùa giáp');assert.equal(store.farm.read(acc).inventory.dish_pumpkin_soup,0);}
 store.farm.run(acc,id,now,s=>{delete s.inventory['dish_pumpkin_soup@raw'];delete s.inventory['dish_pumpkin_soup@burnt'];return{value:null};});
 // Chăn nuôi: cho ăn ở cổng (thiếu thóc thì chặn), sau một ngày Haven thu trứng; mua thêm gà; xuất chuồng lấy thịt; ong thu mật.
 {at={map:homeMap(acc),x:1230,y:960};act('collect',{item:'chicken'});assert(failed(),'chưa cho ăn');act('feed',{item:'chicken'});assert(failed(),'thiếu thóc');
  store.farm.run(acc,id,now,s=>{s.inventory.farm_wheat=(s.inventory.farm_wheat??0)+2;return{value:null};});act('feed',{item:'chicken'});assert(store.farm.read(acc).livestock!.chicken!.fedAt>0);
  act('collect',{item:'chicken'});assert(failed(),'chưa hết ngày');now+=48*60000;act('collect',{item:'chicken'});assert.equal(store.farm.read(acc).inventory.farm_egg,2,'2 gà → 2 trứng');
  act('butcher',{item:'chicken'});assert.equal(store.farm.read(acc).inventory.meat_chicken,2);assert.equal(store.farm.read(acc).livestock!.chicken!.count,1);
  at={map:homeMap(acc),x:480,y:970};act('collect',{item:'bee'});assert(failed(),'ong bắt đầu đếm ngày');now+=48*60000;act('collect',{item:'bee'});assert.equal(store.farm.read(acc).inventory.farm_honey,1);
  store.farm.run(acc,id,now,s=>{delete s.inventory.farm_egg;delete s.inventory.meat_chicken;delete s.inventory.farm_honey;return{value:null};});}
 // Vườn cây ăn quả + máy chế biến: mua cây giống / máy ở người bán đồ, trồng → lớn → có quả → hái; xay bột, bán thành phẩm.
 store.farm.run(acc,id,now,(_s,c)=>({value:null,coins:c+3000}));
 {const c0=store.ecoOf(id)!.coins;at={map:homeMap(acc),x:780,y:500};act('buy',{item:'sapling_apple'});act('buy',{item:'machine_flour_mill'});assert.equal(store.ecoOf(id)!.coins,c0-400-800);
  act('buy',{item:'machine_flour_mill'});assert(failed(),'máy mua 1 lần');
  at={map:homeMap(acc),x:360,y:820};act('treePlant',{plot:0,item:'apple'});assert.equal(store.farm.read(acc).trees![0]!.kind,'apple');act('treeHarvest',{plot:0});assert(failed(),'cây non chưa có quả');
  now+=120*60000+60*60000+1000;act('treeHarvest',{plot:0});assert.equal(store.farm.read(acc).inventory.farm_apple,3);act('treeHarvest',{plot:0});assert(failed(),'vừa hái xong');
  store.farm.run(acc,id,now,s=>{s.inventory.farm_wheat=(s.inventory.farm_wheat??0)+2;return{value:null};});
  at={map:homeMap(acc),x:612,y:590};act('machineStart',{item:'flour_mill'});assert.equal(store.farm.read(acc).machines!.flour_mill!.recipe,'flour');act('machineCollect',{item:'flour_mill'});assert(failed(),'chưa xong');
  now+=5*60000+1000;act('machineCollect',{item:'flour_mill'});assert.equal(store.farm.read(acc).inventory.prod_flour,1);
  at={map:homeMap(acc),x:880,y:520};const c1=store.ecoOf(id)!.coins;act('sell');assert.equal(store.ecoOf(id)!.coins,c1+3*15+32,'bán táo + bột');
  store.farm.run(acc,id,now,(_s,c)=>({value:null,coins:c-(c1+3*15+32-c0)-3000}));}
 // Thú cưng quay kim cương: không đủ kim cương thì chặn; 10 lượt trừ 900, chắc chắn ≥ 1 Hiếm; trùng → mảnh; thả / cất thú; đổi mảnh.
 act('gacha',{plot:1});assert(failed(),'chưa có kim cương');assert.equal(store.diamonds(id),0);
 store.addDiamonds(id,1000,'test');act('gacha',{plot:10});
 {const f=store.farm.read(acc);assert.equal(store.diamonds(id),730);assert.equal(f.lastSpin!.length,10);assert(f.lastSpin!.some(x=>FARM_PETS.find(p=>p.id===x.pet)!.rarity>=2),'10 lượt có ≥ 1 Hiếm');
  assert.equal(f.pets!.length+f.lastSpin!.filter(x=>x.dup).length,10);assert(f.petsOut!.length<=6);
  act('petOut',{item:f.pets![0]});assert(!store.farm.read(acc).petsOut!.includes(f.pets![0]!));act('petOut',{item:f.pets![0]});assert(store.farm.read(acc).petsOut!.includes(f.pets![0]!));}
 store.farm.run(acc,id,now,s=>{s.petPity=79;return{value:null};});act('gacha',{plot:1});assert.equal(FARM_PETS.find(p=>p.id===store.farm.read(acc).lastSpin![0]!.pet)!.rarity,4,'mốc 80 chắc chắn Huyền thoại');assert.equal(store.diamonds(id),700);
 store.farm.run(acc,id,now,s=>{s.petShards=30;return{value:null};});{const want=FARM_PETS.find(p=>p.rarity===1&&!store.farm.read(acc).pets!.includes(p.id));if(want){act('petTrade',{item:want.id});assert(store.farm.read(acc).pets!.includes(want.id));assert.equal(store.farm.read(acc).petShards,0);}}
 // Bày trí: cất đồ vào kho, đặt lại trước chỗ đứng; chặn đặt ngoài sàn / chồng đồ / chắn cửa; bể cá mua về nằm trong kho, đặt rồi mới thả cá.
 at={map:roomMap(acc,'house'),x:320,y:380};
 {const def=store.farm.read(acc);assert.equal(def.decor,undefined);act('decorStore',{plot:0});const f=store.farm.read(acc);assert.equal(f.decor!.house!.length,DECOR_DEFAULT.house!.length-1);assert.equal(f.storage![DECOR_DEFAULT.house![0]!.id],1);
  act('decorPlace',{item:'gv_be_ca'});const placed=store.farm.read(acc).decor!.house!.find(q=>q.id==='gv_be_ca');assert(placed,'đặt bể cá');
  at={map:roomMap(acc,'house'),x:320,y:400};act('decorPlace',{item:DECOR_DEFAULT.house![0]!.id});assert(failed(),'chắn cửa ra vườn');
  at={map:roomMap(acc,'house'),x:40,y:200};act('decorPlace',{item:DECOR_DEFAULT.house![0]!.id});assert(failed(),'ra ngoài sàn');
  at={map:roomMap(acc,'house'),x:placed.x,y:placed.y+24};act('tank',{item:'carp'});assert(failed(),'kho chưa có cá chép');}
 // Bộ sưu tập: mua giường Haven / thảm / đèn ở người bán đồ → kho; đặt thảm dưới đồ, đèn ở gờ trần; giá theo danh mục.
 {at={map:roomMap(acc,'house'),x:320,y:400};act('room');store.farm.run(acc,id,now,(_s,c)=>({value:null,coins:c+40000}));const c0=store.ecoOf(id)!.coins;at={map:homeMap(acc),x:780,y:500};
  for(const it of ['gv_hv_giuong','gv_lk_tham','gv_pd_den'])act('buy',{item:'decor:'+it});
  assert.equal(store.ecoOf(id)!.coins,c0-DECOR_ITEMS.gv_hv_giuong!.price-DECOR_ITEMS.gv_lk_tham!.price-DECOR_ITEMS.gv_pd_den!.price);assert.equal(store.farm.read(acc).storage!.gv_lk_tham,1);
  at={map:homeMap(acc),x:576,y:280};act('room');at={map:roomMap(acc,'house'),x:300,y:330};act('decorPlace',{item:'gv_lk_tham'});act('decorPlace',{item:'gv_pd_den'});
  const d=store.farm.read(acc).decor!.house!;assert(d.some(q=>q.id==='gv_lk_tham'),'thảm đặt được ngay cả chỗ có đồ');assert.equal(d.find(q=>q.id==='gv_pd_den')!.y,16+DECOR_ITEMS.gv_pd_den!.h,'đèn treo gờ trần');
  store.farm.run(acc,id,now,(_s,c)=>({value:null,coins:c0-40000}));}
 // Nhà: mua nhà Nấm ở người bán đồ → dọn vào ngay, cửa dời xuống (576, 440); đổi về nhà nhỏ; chưa có nhà thì không đổi được.
 {at={map:roomMap(acc,'house'),x:320,y:400};act('room');store.farm.run(acc,id,now,(_s,c)=>({value:null,coins:c+9000}));const c0=store.ecoOf(id)!.coins;at={map:homeMap(acc),x:780,y:500};
  act('buy',{item:'house:nk'});assert.equal(store.ecoOf(id)!.coins,c0-8000);assert.equal(store.farm.read(acc).house,'nk');act('buy',{item:'house:nk'});assert(failed(),'mua 1 lần');
  at={map:homeMap(acc),x:576,y:230};act('room');assert(failed(),'cửa nhà lớn đã dời');at={map:homeMap(acc),x:576,y:440-80+20};act('room');assert.equal(at.map,roomMap(acc,'house'));
  act('houseSet',{item:'hv'});assert(failed(),'chưa có nhà Haven');act('houseSet',{item:''});assert.equal(store.farm.read(acc).house,'');
  store.farm.run(acc,id,now,(_s,c)=>({value:null,coins:c-1000}));}
 // Chủ nhà được ở hồ câu của chính mình (world.changeMap kiểm qua canEnterMap) — lỗi cũ ghi nhầm hàm vào danh sách map.
 assert(farmMaps(acc).includes(pondMap(acc))&&farmMaps(acc).every(m=>typeof m==='string'),'hồ câu chủ nhà thuộc map Gia viên');
 // Bể cá phòng khách: thả cá đã câu vào bể, cá trong bể không bị bán, lấy lại được.
 at={map:roomMap(acc,'house'),x:200,y:300};act('tank',{item:'crucian'});assert(failed(),'phải tới bể');
 {const t=store.farm.read(acc).decor!.house!.find(q=>q.id==='gv_be_ca')!;at={map:roomMap(acc,'house'),x:t.x,y:t.y+24};}
 act('tank',{item:'carp'});assert(failed(),'kho không có cá chép');
 store.farm.run(acc,id,now,s=>{s.inventory.fish_carp=1;return{value:null};});
 act('tank',{item:'carp'});assert.deepEqual(store.farm.read(acc).tank,['carp']);assert.equal(store.farm.read(acc).inventory.fish_carp,0);
 act('untank',{plot:0});assert.deepEqual(store.farm.read(acc).tank,[]);assert.equal(store.farm.read(acc).inventory.fish_carp,1);
 act('tank',{item:'carp'});assert.deepEqual(store.farm.read(acc).tank,['carp']);
 at={map:roomMap(acc,'house'),x:320,y:400};act('room');at={map:homeMap(acc),x:880,y:520};act('sell');assert(failed(),'cá trong bể không bị bán');assert.deepEqual(store.farm.read(acc).tank,['carp']);
 at={map:roomMap(acc,'bedroom'),x:416,y:350};
 at={map:roomMap(acc,'bedroom'),x:416,y:350};act('go',{room:'house'});assert.equal(at.map,roomMap(acc,'house'));
 at={map:roomMap(acc,'house'),x:320,y:400};act('room');assert.equal(at.map,homeMap(acc));
 farm.handle(guest,acc2,{op:'hoe',plot:0});assert.equal(store.farm.read(acc2).plots[0]!.tilled,false);
 act('leave');assert.equal(at.map,'human/town');
 at={map:'human/town',x:970,y:1232};act('buySeed',{crop:'wheat',price:0});assert.equal(store.ecoOf(id)!.coins,214);assert.equal(store.farm.read(acc).inventory.seed_wheat,3);
 act('enter');assert.equal(at.map,homeMap(acc));act('leave');act('enter');assert(failed(),'hồi về nhà phải được máy chủ giữ');
 for(let i=0;i<1000;i++)assert.notEqual(chooseFarmFish(24*60000,i/1000),'night_catfish');
 // 16 cá hiếm, mỗi loài 0,001 % (roll < 0,016 %), không lọt vào cá thường.
 assert.equal(chooseFarmFish(0,0),'lantern');assert.equal(chooseFarmFish(0,0.000155),'rune_arowana');assert.equal(chooseFarmFish(0,0.00017),'crucian');
 assert(!Array.from({length:1000},(_,i)=>chooseFarmFish(0,0.001+i/1001)).some(f=>['lantern','dragon_koi','rune_arowana'].includes(f)));
 assert(Array.from({length:1000},(_,i)=>chooseFarmFish(0,i/1000)).includes('night_catfish'));
 store.close();store=new Store(file);assert(store.farm.read(acc).unlocked);assert.equal(store.ecoOf(id)!.coins,214);assert.equal(store.character(id,acc)!.name,'Nông gia thử');
 console.log('✔ Gia viên: mở qua NPC, chặn chủ / khoảng cách, cây offline / tưới, kho / bán / mua nguyên tử, cá theo giờ / nonce / cửa sổ kéo, lưu lại không mất nhân vật');
}finally{store.close();assert(resolve(dir).startsWith(resolve(tmpdir())+'\\havenlord-farm-'));rmSync(dir,{recursive:true,force:true});}
