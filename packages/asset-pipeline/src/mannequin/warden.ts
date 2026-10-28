// Drawn pose pairs: no anatomical recolouring, limb deformation or generated tweens.
import { createHash } from 'node:crypto';
import { readFileSync,writeFileSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { blit,createImage,crop,getPixel,setPixel,readPng,writePng,scaleNearest,opaqueBounds,type RGBAImage,type RGBA } from '../image/rgba.js';
import { weaponFrame,type Point } from './art.js';
import { splitGarments,garmentVariant,garmentSlots,type ClothingGuide } from './clothing.js';
import { handOcclusion } from './contacts.js';

const root=resolve(import.meta.dirname,'../../../..'),out=join(root,'assets/mannequin/v2');
const art=join(out,'source-art/authored-v4'),id='aether_warden';
const layout=JSON.parse(readFileSync(join(art,'layout.json'),'utf8'));
const directions:string[]=layout.directions;
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const fileHash=(path:string)=>hash(readFileSync(path));
const cells:RGBAImage[]=[],names:string[]=[],garments=new Map<string,RGBAImage>();
const pad=(image:RGBAImage)=>{if(image.width===144)return image;const canvas=createImage(144,144);blit(canvas,image,16,24);return canvas;};
const add=(name:string,image:RGBAImage)=>{if(names.includes(name))throw new Error('Trùng sprite '+name);names.push(name);cells.push(pad(image));};
const idleSeeds:Point[]=[[42,79],[43,78],[49,76],[44,76],[43,79],[65,76],[68,75],[70,78]];
const runSeeds:Point[]=[[42,69],[41,69],[44,67],[44,69],[42,71],[67,69],[70,67],[72,70]];
const attackSeeds:Point[][]=[
 [[41,79],[41,77],[45,75],[43,76],[44,79],[68,77],[69,75],[70,78]],
 [[52,76],[43,77],[44,75],[44,76],[44,77],[68,76],[69,75],[68,77]],
 [[53,77],[44,76],[44,74],[44,75],[44,77],[69,76],[69,74],[68,77]],
 [[69,69],[39,69],[35,70],[36,70],[69,70],[77,69],[78,69],[73,69]],
 [[73,68],[34,68],[33,70],[33,70],[76,67],[79,69],[81,69],[78,68]],
 [[51,77],[42,78],[45,76],[44,76],[44,78],[68,78],[69,77],[69,78]],
 [[42,79],[42,78],[45,76],[44,76],[44,79],[68,78],[69,77],[70,79]],
];
const castSeeds:Point[][]=[
 [[63,65],[60,66],[57,67],[50,67],[44,71],[58,67],[61,66],[61,66]],
 [[66,66],[63,67],[62,67],[48,70],[43,73],[51,68],[52,67],[43,70]],
 [[72,70],[65,72],[64,72],[45,72],[43,74],[50,72],[48,72],[43,73]],
 idleSeeds,
];
const skin=(c:RGBA)=>c[3]>0&&c[0]>100&&c[0]-c[1]>24&&c[1]-c[2]>12;
function ownerAt(originals:RGBAImage[],x:number,y:number,guide:ClothingGuide):number {
 for(let slot=0;slot<3;slot++)if(getPixel(originals[slot]!,x,y)[3])return slot;
 let owner=-1,best=Infinity;
 for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++) {
  const distance=dx*dx+dy*dy;if(distance>=best)continue;
  for(let slot=0;slot<3;slot++)if(getPixel(originals[slot]!,x+dx,y+dy)[3]){owner=slot;best=distance;break;}
 }
 return owner>=0?owner:y<guide.waist?0:y<guide.bootLeft?1:2;
}
function leatherCoat(source:RGBAImage):RGBAImage {
 const image=createImage(112,112);
 for(let y=0;y<112;y++)for(let x=0;x<112;x++) {
  const c=getPixel(source,x,y);if(!c[3])continue;
  const gold=c[0]>c[1]*1.15&&c[1]>c[2]*1.15;
  if(gold)setPixel(image,x,y,c);
  else {const light=(c[0]+c[1]+c[2])/3;setPixel(image,x,y,[Math.min(235,Math.round(light*.95+20)),Math.round(light*.64+11),Math.round(light*.42+9),255]);}
 }
 return image;
}
/** Clothing dye must not turn the same character's silver hair red or brown. */
function keepIdentityColors(variant:RGBAImage,source:RGBAImage,neck:number,facing:string):RGBAImage {
 const d=directions.indexOf(facing);
 for(let y=0;y<=neck;y++)for(let x=35;x<=77;x++) {
  const c=getPixel(source,x,y);if(!c[3])continue;
  const neutral=Math.min(c[0],c[1],c[2])>=30&&Math.max(c[0],c[1],c[2])-Math.min(c[0],c[1],c[2])<45&&Math.abs(c[0]-c[1])<20;
  const back=d>=1&&d<=3?x>=58:d>=5?x<=54:d===4?x>=45&&x<=67:false;
  const teal=back&&c[1]-c[0]>25&&c[2]-c[0]>40&&c[1]>70;
  if(neutral||teal)setPixel(variant,x,y,c);
 }
 return variant;
}

/** The same palm pixel must exist in both drawn bodies. No arbitrary alpha on a sleeve. */
function sharedPalm(clothed:RGBAImage,bare:RGBAImage,metal:RGBAImage,gold:RGBAImage,seed:Point):Point {
 let best=Infinity,selected:Point|undefined;
 for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++) {
  const x=seed[0]+dx,y=seed[1]+dy,a=getPixel(clothed,x,y),b=getPixel(bare,x,y);
  if(!a[3]||!skin(b)||!getPixel(metal,x,y)[3]||!getPixel(gold,x,y)[3])continue;
  const score=dx*dx+dy*dy+(skin(a)?0:7);
  if(score<best){best=score;selected=[x,y];}
 }
 if(!selected)throw new Error('Không có bàn tay chung gần '+seed);
 return selected;
}

/** Register one rigid hilt through both authored fists, never rotate it to fit. */
function twoPalms(body:RGBAImage,seed:Point,angle:number,label:string,skinHands:boolean):Point[] {
 const ax=Math.cos(angle*Math.PI/180),ay=Math.sin(angle*Math.PI/180);
 let selected:Point[]|undefined,best=Infinity;
 for(const span of [6,5,4,7])for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++) {
  const a:Point=[seed[0]+dx,seed[1]+dy],b:Point=[Math.round(a[0]-ax*span),Math.round(a[1]-ay*span)];
  if(![a,b].every(p=>getPixel(body,...p)[3]&&(!skinHands||skin(getPixel(body,...p)))))continue;
  const score=dx*dx+dy*dy+(span-6)**2*.5;if(score<best){best=score;selected=[a,b];}
 }
 if(!selected)throw new Error('Hai nắm tay không cùng chuôi: '+label+' gần '+seed);
 return selected;
}

type DrawnPose={key:string;action:string;phase:number;direction:string;headDirection:string;body:RGBAImage;head:RGBAImage;bare:RGBAImage;metal:RGBAImage;gold:RGBAImage;grip:Point;swordHands:Point[];swordHandSets:Point[][];swordAngle?:number;swordHandsVisible:boolean;neck:Point;guide:ClothingGuide;garmentPrefix:string;handPrefix:string;sourceRow:number};
const drawn=new Map<string,DrawnPose>();
const basePreview=createImage(8*112,24*112),gearPreview=createImage(5*112,8*112);
const actionPreviews:Record<string,RGBAImage>={};
const loadouts=[['jacket_navy','pants_dark','boots_brown'],['cuirass_silver','pants_mail','boots_plate'],['vest_leather','pants_linen','boots_black'],['jacket_wine','pants_mail','boots_plate'],['dragon_guard','dragon_legs','dragon_boots']];
const sourceHashes:Record<string,string>={};
for(const action of ['idle','walk','run','attack','cast'])for(const kind of ['clothed','bare','silver','gold'])sourceHashes[`${action}-${kind}.png`]=fileHash(join(art,`${action}-${kind}.png`));

for(const [sourceRow,record] of layout.poses.entries()) {
 const {action,phase,direction}=record,d=directions.indexOf(direction);
 const clothed=readPng(join(art,`${action}_${phase}_${direction}_clothed.png`));
 const bareFull=readPng(join(art,`${action}_${phase}_${direction}_bare.png`));
 const metalFull=readPng(join(art,`${action}_${phase}_${direction}_silver.png`));
 const goldFull=readPng(join(art,`${action}_${phase}_${direction}_gold.png`));
 // Keep each authored head/neck with its complete upper-body pose. Never graft
 // a different idle head over a turning neck or cut a raised arm out as hair.
 const body=clothed,bare=bareFull,head=createImage(112,112),metal=metalFull,gold=goldFull;
 const neck:Point=[56,record.neck];
 const headDirection=record.headDirection??direction;
 let seed:Point=action==='attack'?attackSeeds[phase]![d]!:action==='cast'?castSeeds[phase]![d]!:action==='run'?runSeeds[d]!:idleSeeds[d]!;
 // The two fists are authored around one marked hilt, not guessed from a
 // face-coloured pixel above the neck. Keep the painted blade axis intact.
 const swordHandSets:Point[][]=action==='attack'?[body,bare,metal,gold].map((image,i)=>record.swordHandsVisible===false?record.swordHands.map((p:Point)=>p):twoPalms(image,record.swordHands[0],record.swordAngle,`${phase}/${direction}/${i}`,i<2)):[];
 const swordHands=swordHandSets[0]??[];
 const grip=action==='attack'?swordHands[0]!:sharedPalm(clothed,bareFull,metalFull,goldFull,seed);
 const guide:ClothingGuide={waist:record.waist,bootLeft:record.boot,bootRight:record.boot,splitX:56,hipLeft:45,hipRight:68,spread:9};
 const key=`${action}_${phase}_${direction}`,garmentPrefix='clothing_'+key,handPrefix='hands_'+key;
 const pieces=splitGarments(body,guide);
 // Exposed fingers/gloves in a clothed pose travel with that sleeve, so there is no second arm underneath.
 blit(pieces.upper,pieces.base,0,0);
 const originals=[pieces.upper,pieces.pants,pieces.boots];
 const ownership=new Int8Array(112*112);
 for(let y=0;y<112;y++)for(let x=0;x<112;x++) {
  if(!getPixel(bare,x,y)[3])continue;
  ownership[y*112+x]=ownerAt(originals,x,y,guide);
 }
 // Eight visibility masks are true body occlusion masks, never scale/offset variants.
 for(let mask=0;mask<8;mask++) {
  const visible=createImage(112,112);
  for(let y=0;y<112;y++)for(let x=0;x<112;x++)if(!(mask&(1<<ownership[y*112+x]!)))setPixel(visible,x,y,getPixel(bare,x,y));
  garments.set(garmentPrefix+(mask===0?'_base':'_base_'+mask),visible);
 }
 for(const [slotIndex,slot] of garmentSlots.entries()) {
  const original=originals[slotIndex]!;
  garments.set(garmentPrefix+'_'+slot.items[0]!.id,original);
  const variant=garmentVariant(original,slot.id);
  garments.set(garmentPrefix+'_'+slot.items[1]!.id,slot.id==='upper'?keepIdentityColors(variant,original,record.neck,headDirection):variant);
 }
 const silverParts=[createImage(112,112),createImage(112,112),createImage(112,112)];
 for(let y=0;y<112;y++)for(let x=0;x<112;x++)if(getPixel(metal,x,y)[3])setPixel(silverParts[ownerAt(originals,x,y,guide)]!,x,y,getPixel(metal,x,y));
 garments.set(garmentPrefix+'_cuirass_silver',silverParts[0]!);
 garments.set(garmentPrefix+'_vest_leather',keepIdentityColors(leatherCoat(pieces.upper),pieces.upper,record.neck,headDirection));
 garments.set(garmentPrefix+'_pants_mail',silverParts[1]!);
 garments.set(garmentPrefix+'_boots_plate',silverParts[2]!);
 const goldParts=[createImage(112,112),createImage(112,112),createImage(112,112)];
 for(let y=0;y<112;y++)for(let x=0;x<112;x++)if(getPixel(gold,x,y)[3])setPixel(goldParts[ownerAt(originals,x,y,guide)]!,x,y,getPixel(gold,x,y));
 for(const [slot,item] of ['dragon_guard','dragon_legs','dragon_boots'].entries())garments.set(garmentPrefix+'_'+item,goldParts[slot]!);
 drawn.set(key,{key,action,phase,direction,headDirection,body,head,bare,metal,gold,grip,swordHands,swordHandSets,swordAngle:record.swordAngle,swordHandsVisible:action!=='attack'||record.swordHandsVisible!==false,neck,guide,garmentPrefix,handPrefix,sourceRow});
 const naked=createImage(112,112);blit(naked,bare,0,0);blit(naked,head,0,0);
 if(!actionPreviews[action])actionPreviews[action]=createImage(8*112,layout.poses.filter((p:any)=>p.action===action).length/8*112);
 blit(actionPreviews[action]!,naked,d*112,phase*112);
 blit(basePreview,naked,d*112,Math.floor(sourceRow/8)*112);
 if(action==='idle')for(const [look,loadout] of loadouts.entries()) {
  const image=createImage(112,112);
  for(const slot of [2,1,0])blit(image,garments.get(garmentPrefix+'_'+loadout[slot])!,0,0);
  blit(image,head,0,0);blit(gearPreview,image,look*112,d*112);
 }
}

const sword=readPng(join(art,'moonsteel-sword.png')),swordGrip:Point=[6,29];
const staff=readPng(join(root,'assets/mannequin/parts/aether-staff.png'));
writePng(join(out,'weapons/moonsteel-sword.png'),sword);writePng(join(out,'weapons/aether-staff.png'),staff);

function fittedWeapon(src:RGBAImage,grip:Point,angle:number,sourceGrip:Point):{image:RGBAImage;angle:number} {
 const image=weaponFrame(src,[grip[0]+16,grip[1]+24],'idle',0,'S',false,angle,sourceGrip,true,144),box=opaqueBounds(image);
 if(box&&box.x0>0&&box.x1<144&&box.y0>0&&box.y1<144)return {image,angle};
 throw new Error('Vũ khí tràn khung tại '+grip+'/'+angle);
}
/** A narrow downward cut between blade tips. No ring around the body. */
function cleaveStreak(grip:Point,angle:number,raised:{grip:Point;angle:number},frame:number):RGBAImage {
 const image=createImage(144,144);if(frame<7||frame>9)return image;
 const tip=(p:Point,a:number):Point=>[p[0]+16+Math.cos(a*Math.PI/180)*28,p[1]+24+Math.sin(a*Math.PI/180)*28];
 const origin=tip(raised.grip,raised.angle),q=tip(grip,angle),travel=Math.hypot(q[0]-origin[0],q[1]-origin[1]);
 const tail=Math.min(32,travel),p:Point=[q[0]-(q[0]-origin[0])*tail/travel,q[1]-(q[1]-origin[1])*tail/travel];
 const dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy);
 for(let y=1;y<143;y++)for(let x=1;x<143;x++) {
  const t=((x-p[0])*dx+(y-p[1])*dy)/(length*length);
  if(t<0||t>1)continue;
  const distance=Math.abs((x-p[0])*dy-(y-p[1])*dx)/length;
  const width=(frame===7?3:frame===8?2:1)*(0.3+0.7*t);
  if(distance<width)setPixel(image,x,y,distance<.7?[225,249,255,255]:[91,177,205,255]);
 }
 return image;
}
const schedules=[
 {action:'idle',fps:6,hitFrame:-1,phases:[0,0,0,0]},
 {action:'walk',fps:9,hitFrame:-1,phases:[0,0,1,1,2,2,3,3]},
 {action:'run',fps:9,hitFrame:-1,phases:[0,1,2,3,4,5,6,7]},
 {action:'attack',fps:18,hitFrame:7,phases:[0,1,1,2,2,2,3,4,4,5,5,6,6,0]},
 {action:'cast',fps:10,hitFrame:4,phases:[0,0,1,1,2,2,3,3]},
];
const sequences:any[]=[],handCells=new Map<string,RGBAImage>();
for(const schedule of schedules)for(const [d,direction] of directions.entries()) {
 const frames:any[]=[];
 const bladeHistory:{grip:Point;angle:number}[]=[];
 for(const [frame,phase] of schedule.phases.entries()) {
  const pose=drawn.get(`${schedule.action}_${phase}_${direction}`)!;
  const idle=drawn.get(`idle_0_${direction}`)!;
  const left=idle.grip[0]<56,carry=left?-135:-45;
  const swordAngle=schedule.action==='attack'?pose.swordAngle!:carry+(schedule.action==='run'?(frame%4-1)*3:0);
  const swordFit=fittedWeapon(sword,pose.grip,swordAngle,swordGrip),swordPose=swordFit.image;
  const swordPoses=pose.swordHandSets.length?pose.swordHandSets.map(hands=>fittedWeapon(sword,hands[0]!,swordAngle,swordGrip).image):[swordPose,swordPose,swordPose,swordPose];
  const staffAngle=schedule.action==='attack'?(pose.grip[1]<45?90:-90):left?-100:-80;
  const staffPose=fittedWeapon(staff,pose.grip,staffAngle,[5,37]).image;
  const prefix=`${schedule.action}_${direction}_${frame}`;
  for(const [layer,image] of [['identity',pose.head],['silver',pose.head],['warden',pose.body],['sword',swordPose],['staff',staffPose]] as const)add(prefix+'_'+layer,image);
  if(schedule.action==='attack')for(const [i,suffix] of ['_bare','_silver','_gold'].entries())add(prefix+'_sword'+suffix,swordPoses[i+1]!);
  if(schedule.action==='attack')add(prefix+'_trail',cleaveStreak(pose.grip,swordFit.angle,bladeHistory[5]??{grip:pose.grip,angle:swordFit.angle},frame));
  bladeHistory.push({grip:pose.grip,angle:swordFit.angle});
  for(const [weapon,image] of [['sword',swordPose],['staff',staffPose]] as const) {
   const handLayer=(body:RGBAImage,look:number)=>{
    const layer=createImage(112,112),hands=weapon==='sword'&&pose.swordHandSets.length?pose.swordHandSets[look]!:[pose.grip];
    const contact=crop(weapon==='sword'?swordPoses[look]!:image,16,24,112,112);
    if(pose.swordHandsVisible)for(const palm of hands)blit(layer,handOcclusion(body,palm,contact),0,0);return layer;
   };
   const dressedHand=handLayer(pose.body,0),bareHand=handLayer(pose.bare,1),silverHand=handLayer(pose.metal,2),goldHand=handLayer(pose.gold,3);
   // Hand geometry depends on blade angle, so every action frame owns its contact layer.
   handCells.set(prefix+'_hand_'+weapon,dressedHand);handCells.set(prefix+'_hand_'+weapon+'_bare',bareHand);handCells.set(prefix+'_hand_'+weapon+'_silver',silverHand);
   handCells.set(prefix+'_hand_'+weapon+'_gold',goldHand);
  }
  const assembled=createImage(112,112);blit(assembled,pose.body,0,0);blit(assembled,pose.head,0,0);
  const weaponOrder=d>=3&&d<=5?-1:1;
  const swordOrder=['idle','walk','run'].includes(schedule.action)?1:weaponOrder;
  frames.push({name:prefix,index:names.indexOf(prefix+'_identity'),garmentPrefix:pose.garmentPrefix,handPrefix:prefix+'_hand',weaponGrips:[[pose.grip[0]+16,pose.grip[1]+24],[pose.grip[0]+16,pose.grip[1]+24]],weaponOrders:[swordOrder,weaponOrder],swordAngle:swordFit.angle,swordHandsVisible:pose.swordHandsVisible,swordHandSets:pose.swordHandSets.map(hands=>hands.map(p=>[p[0]+16,p[1]+24])),swordHands:pose.swordHands.map(p=>[p[0]+16,p[1]+24]),root:[72,124],neck:[pose.neck[0]+16,pose.neck[1]+24],grip:[pose.grip[0]+16,pose.grip[1]+24],weaponOrder,headDirection:pose.headDirection,trailActive:schedule.action==='attack'&&frame>=7&&frame<=9,anchorsReviewed:false,jointsReviewed:false,joints:{head:[72,pose.neck[1]+12],shoulderL:[62,pose.neck[1]+29],shoulderR:[82,pose.neck[1]+29],handR:[pose.grip[0]+16,pose.grip[1]+24],hipL:[65,pose.guide.waist+24],hipR:[79,pose.guide.waist+24]},source:`authored-v4/${schedule.action}_${phase}_${direction}`,sourceRow:pose.sourceRow,hash:hash(pad(assembled).data),bareHash:hash(pad(pose.bare).data),posePhase:phase});
 }
 sequences.push({action:schedule.action,direction,fps:schedule.fps,hitFrame:schedule.hitFrame,frames});
}
for(const [name,image] of garments)add(name,image);
for(const [name,image] of handCells)add(name,image);
for(const [name,image] of garments)if(name.endsWith('_base')||name.startsWith('clothing_idle'))writePng(join(out,'clothing/parts',name+'.png'),image);
for(const [name,image] of handCells)writePng(join(out,'weapons/hands',name+'.png'),image);
for(const [action,image] of Object.entries(actionPreviews))writePng(join(out,`clothing/${action}-bare-2x.png`),scaleNearest(image,2));
writePng(join(out,'clothing/underwear-directions-2x.png'),scaleNearest(actionPreviews.idle!,2));
writePng(join(out,'clothing/equipment-directions-2x.png'),scaleNearest(gearPreview,2));
function icon(image:RGBAImage):RGBAImage {
 const box=opaqueBounds(image)!;const w=box.x1-box.x0,h=box.y1-box.y0,s=Math.min(40/w,40/h),result=createImage(48,48);
 for(let y=0;y<Math.round(h*s);y++)for(let x=0;x<Math.round(w*s);x++)setPixel(result,Math.floor((48-w*s)/2)+x,Math.floor((48-h*s)/2)+y,getPixel(image,box.x0+Math.floor(x/s),box.y0+Math.floor(y/s)));
 return result;
}
for(const slot of garmentSlots)for(const item of slot.items) {
 const source=garments.get('clothing_idle_0_S_'+item.id)!;
 const garment=createImage(112,112),neck=layout.poses.find((p:any)=>p.action==='idle'&&p.direction==='S').neck;
 for(let y=0;y<112;y++)for(let x=0;x<112;x++)if(slot.id!=='upper'||y>neck)setPixel(garment,x,y,getPixel(source,x,y));
 writePng(join(root,'assets/items',item.id+'.png'),icon(garment));
}
writePng(join(root,'assets/items/moonsteel_sword.png'),icon(sword));writePng(join(root,'assets/items/aether_staff.png'),icon(staff));
for(let page=0;page*256<cells.length;page++) {
  const atlas=createImage(2304,2304);cells.slice(page*256,(page+1)*256).forEach((image,k)=>blit(atlas,image,k%16*144,Math.floor(k/16)*144));writePng(join(out,`${id}-${page}.png`),atlas);
}
writeFileSync(join(out,`${id}-slices.json`),JSON.stringify(names));
sourceHashes['moonsteel-sword.png']=fileHash(join(art,'moonsteel-sword.png'));
const catalog={version:2,template:'adult-144-twohand-v5',drawnBodies:true,integratedHeads:true,nativeFrameSize:[112,112],frameSize:[144,144],ppu:48,anchor:[72,124],directions,hairVariants:false,garmentSlots,outfits:[{id:'warden',name:'Hộ vệ Ngân Lam'}],weapons:[{id:'sword',itemId:'moonsteel_sword',name:'Kiếm Nguyệt Cương',action:'attack',skill:'slash',fps:18,hitFrame:7,hands:2},{id:'staff',itemId:'aether_staff',name:'Trượng Aether',action:'cast',skill:'aether_bolt',fps:10,hitFrame:4,hands:1}],identities:[{id,name:'Hộ vệ Ngân Lam',texture:id,sequences}],reviewRequired:true,drawnPoseCount:drawn.size,sourceHashes};
writeFileSync(join(out,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
writeFileSync(join(out,'review.txt'),"V5 bổ kiếm hai tay: giữ nguyên pose vẽ liền đầu/cổ/thân, không ghép đầu idle; chỉ một đầu khi mặc hoặc tháo áo. Kiếm đứng/chạy hướng lên, bổ hai tay từ trên đầu xuống sát gối, vệt thẳng dọc theo đòn, không tự bẻ góc để vừa khung. Tranh112 thêm viền trong suốt thành canvas144, mốc72/124, PPU48, không đổi cỡ người. Chạy8 pose ở14fps; bổ14 frame/7 pose ở18fps hit7. Long Vệ gồm3 món mới; găng theo áo. Kiếm Nguyệt Cương vẽ mới. Kiểm nguồn, điểm nắm, đường nối tay, khuôn mặt và runtime.\n");
console.log(`PASS dựng ${sequences.length} chuỗi từ ${drawn.size} cặp pose vẽ; ${cells.length} cells. Cần kiểm runtime.`);
