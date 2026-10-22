// Nhân vật mới: pose nguyên khối vẽ mới, vũ khí rời; không đọc atlas người chơi hiện hành.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { blit, createImage, getPixel, readPng, setPixel, writePng, scaleNearest, opaqueBounds, type RGBAImage } from '../image/rgba.js';
import { weaponFrame } from './art.js';
import { splitGarments, garmentVariant, garmentSlots, type ClothingGuide } from './clothing.js';
import { exportEquipmentKit, loadEquipmentKit, upperEquipment, legEquipment } from './equipment.js';
import { handContact, handOcclusion, staffSeed } from './contacts.js';

const root = resolve(import.meta.dirname, '../../../..');
const out = join(root, 'assets/mannequin/v2');
const sheetPath = join(out, 'source-art/warden-sheet.png');
const source = readPng(sheetPath);
const layout = JSON.parse(readFileSync(join(out, 'source-art/layout.json'), 'utf8'));
const clothingGuides = JSON.parse(readFileSync(join(out,'source-art/clothing-guides.json'),'utf8')).poses as Record<string,ClothingGuide>;
const kit=loadEquipmentKit(out);exportEquipmentKit(out,kit);
if (source.width !== layout.width || source.height !== layout.height) throw new Error('Sheet khác kích thước layout đã kiểm');
const directions = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const id = 'aether_warden';
type Point = [number, number];
type Annotation = { grip: Point; neck: Point; weaponOrder: number; reviewed: boolean };
const overrides: Record<string, Annotation> = JSON.parse(readFileSync(join(out, 'source-art/anchors.json'), 'utf8'));
const gripRows: Point[][] = [
 [[43,105],[51,104],[58,105],[50,103],[49,106],[91,104],[93,105],[97,105]],
 [[42,100],[43,95],[48,99],[50,99],[49,103],[93,99],[100,97],[98,100]],
 [[43,105],[51,104],[58,105],[50,103],[49,106],[91,104],[93,105],[97,105]],
 [[42,100],[43,95],[48,99],[50,99],[49,103],[100,94],[100,97],[105,98]],
 [[56,22],[50,18],[60,20],[48,20],[50,23],[101,22],[103,22],[100,22]],
 [[30,57],[20,59],[22,60],[27,73],[32,77],[115,63],[116,60],[120,57]],
 [[53,72],[63,72],[60,75],[50,76],[50,76],[100,75],[90,75],[65,75]],
 [[83,74],[83,74],[77,76],[63,77],[52,78],[83,76],[70,76],[65,75]],
];
const poses: RGBAImage[][] = [];
const preview = createImage(8 * 112, 8 * 112);
for (let row = 0; row < 8; row++) {
 const images: RGBAImage[] = [];
 for (let dir = 0; dir < 8; dir++) {
  const rect = layout.rects[row * 8 + dir];
  const origin = rect.origin;
  if (rect.direction !== directions[dir] || rect.row !== row) throw new Error('Sai thứ tự hướng/layout');
  const img = createImage(112,112);
  // Tỷ lệ duy nhất; root tác giả khai trong layout đã kiểm, không tự dò bbox khi build.
  for (let y = 0; y < 112; y++) for (let x = 0; x < 112; x++) {
   const sx = Math.floor((x - 56) / layout.scale + origin[0]);
   const sy = Math.floor((y - 100) / layout.scale + origin[1]);
   if (sx < 0 || sx >= rect.w || sy < 0 || sy >= rect.h) continue;
   const c = getPixel(source, rect.x + sx, rect.y + sy);
   if (c[3] >= 220) setPixel(img,x,y,[c[0],c[1],c[2],255]);
  }
  const bounds = opaqueBounds(img);
  if (!bounds || bounds.x0 < 5 || bounds.x1 > 107 || bounds.y1 > 103) throw new Error(`Pose trống/tràn ${row}/${directions[dir]}`);
  images.push(img); blit(preview,img,dir*112,row*112);
 }
 poses.push(images);
}
writePng(join(out,'poses-2x.png'),scaleNearest(preview,2));
const swordSource = readPng(join(root,'assets/mannequin/parts/moonsteel-sword.png'));
const sword = createImage(10,34);
for(let y=0;y<34;y++)for(let x=0;x<10;x++)setPixel(sword,x,y,getPixel(swordSource,Math.floor(x*swordSource.width/10),Math.floor(y*swordSource.height/34)));
const staff = readPng(join(root,'assets/mannequin/parts/aether-staff.png'));
writePng(join(out,'weapons/moonsteel-sword.png'),sword);writePng(join(out,'weapons/aether-staff.png'),staff);
const schedules = [
 {action:'idle',fps:6,hitFrame:-1,rows:[0,0,0,0]},
 {action:'walk',fps:10,hitFrame:-1,rows:[1,2,3,2]},
 {action:'attack',fps:22,hitFrame:3,rows:[4,4,4,5,5,5,0,0]},
 {action:'cast',fps:20,hitFrame:3,rows:[6,6,6,7,7,7,0,0]},
];
const cells: RGBAImage[] = [], names: string[] = [], sequences: any[] = [], candidates: Record<string,unknown> = {};
const matrix = createImage(8*112,4*112);
const garmentCells = new Map<string,RGBAImage>();
const handCells = new Map<string,RGBAImage>();
const garmentPreview=createImage(8*112,8*112);
const ownershipPreview=createImage(8*112,8*112);
const actionClothingPreview=createImage(8*112,8*112);
const equipmentLooks=createImage(4*112,8*112),equipmentActions=createImage(4*112,8*112);
const loadouts=[['jacket_navy','pants_dark','boots_brown'],['cuirass_silver','pants_mail','boots_plate'],['vest_leather','pants_linen','boots_black'],['jacket_wine','pants_mail','boots_plate']];
for (const [actionIndex,schedule] of schedules.entries()) for (let d=0;d<8;d++) {
 const frames = [];
 for (const [f,row] of schedule.rows.entries()) {
  const img = poses[row]![d]!;
  const key = `${row}/${directions[d]}`;
  const origin = layout.rects[row*8+d].origin;
  const suggested = gripRows[row]![d]!;
  let grip: Point = [Math.round(56+(suggested[0]-origin[0])*layout.scale),Math.round(100+(suggested[1]-origin[1])*layout.scale)];
  // Snap chỉ sửa tối đa 8px để chạm alpha, không biến gợi ý thành neo đã duyệt.
  if (!getPixel(img,...grip)[3]) {
   let best = 65, closest = grip;
   for(let dy=-8;dy<=8;dy++) for(let dx=-8;dx<=8;dx++) if(dx*dx+dy*dy<best && getPixel(img,grip[0]+dx,grip[1]+dy)[3]) { best=dx*dx+dy*dy;closest=[grip[0]+dx,grip[1]+dy]; }
   grip=closest;
  }
  const annotation = overrides[key];
  const neck: Point = annotation?.neck ?? [56,(row===4||row===5?53:51)+Math.round((153-origin[1])*layout.scale)];
  grip = annotation?.grip ?? grip;
  grip = handContact(img,grip);
  const staffGrip=handContact(img,staffSeed(row,d,grip,origin,layout.scale));
  if (!getPixel(img,...grip)[3]) throw new Error(`Neo không chạm hình ${key}`);
  const weaponOrder = annotation?.weaponOrder ?? (d>=3&&d<=5?-1:1);
  candidates[key] = {grip,staffGrip,neck,weaponOrder,reviewed:annotation?.reviewed===true};
  const head=createImage(112,112),body=createImage(112,112);
  const headX=row===4?[60,56,54,56,56,55,56,57][d]!:56;
  for(let y=0;y<112;y++) for(let x=0;x<112;x++) {
   const c=getPixel(img,x,y);
   const neutralHair=y<neck[1]-5&&Math.max(c[0],c[1],c[2])-Math.min(c[0],c[1],c[2])<40&&(c[0]+c[1]+c[2])/3>40;
   const ellipse=((x-headX)/13)**2+((y-(neck[1]-12))/17)**2<=1;
   setPixel(y<=neck[1]&&Math.abs(x-headX)<18&&(ellipse||neutralHair)?head:body,x,y,c);
  }
  const garmentPrefix=`clothing_${row}_${directions[d]}`;
  if(!garmentCells.has(garmentPrefix+'_base')) {
   if(!clothingGuides[key])throw new Error(`Thiếu hướng dẫn lớp đồ ${key}`);
   const pieces=splitGarments(body,clothingGuides[key]!);
   garmentCells.set(garmentPrefix+'_base',pieces.base);
   for(const slot of garmentSlots) {
    const original=pieces[slot.id as 'upper'|'pants'|'boots'];
    garmentCells.set(garmentPrefix+'_'+slot.items[0]!.id,original);
    garmentCells.set(garmentPrefix+'_'+slot.items[1]!.id,garmentVariant(original,slot.id));
   }
   garmentCells.set(garmentPrefix+'_cuirass_silver',upperEquipment(pieces.upper,kit[0]![d]!,d,neck[1],false));
   garmentCells.set(garmentPrefix+'_vest_leather',upperEquipment(garmentVariant(pieces.upper,'upper'),kit[1]![d]!,d,neck[1],true));
   garmentCells.set(garmentPrefix+'_pants_mail',legEquipment(pieces.pants,kit[3]![d]!,false));
   garmentCells.set(garmentPrefix+'_boots_plate',legEquipment(garmentVariant(pieces.boots,'boots'),kit[2]![d]!,true));
   if(row===0||d===0)for(const [lookIndex,loadout] of loadouts.entries()) {
    const look=createImage(112,112);
    for(const slot of [2,1,0])blit(look,garmentCells.get(garmentPrefix+'_'+loadout[slot])!,0,0);
    blit(look,pieces.base,0,0);blit(look,head,0,0);
    if(row===0)blit(equipmentLooks,look,lookIndex*112,d*112);
    if(d===0)blit(equipmentActions,look,lookIndex*112,row*112);
   }
   const colors={base:[255,230,160,255],upper:[60,160,255,255],pants:[240,80,100,255],boots:[180,110,250,255]} as const;
   for(const layer of ['base','upper','pants','boots'] as const)for(let y=0;y<112;y++)for(let x=0;x<112;x++)if(getPixel(pieces[layer],x,y)[3])setPixel(ownershipPreview,d*112+x,row*112+y,colors[layer]);
   if(row===0)for(let combo=0;combo<8;combo++) {
    const look=createImage(112,112);
    for(const [s,slot] of garmentSlots.entries())blit(look,garmentCells.get(garmentPrefix+'_'+slot.items[(combo>>s)&1]!.id)!,0,0);
    blit(look,pieces.base,0,0);blit(look,head,0,0);blit(garmentPreview,look,combo*112,d*112);
   }
   if(d===0)for(let combo=0;combo<8;combo++) {
    const look=createImage(112,112);
    for(const [s,slot] of garmentSlots.entries())blit(look,garmentCells.get(garmentPrefix+'_'+slot.items[(combo>>s)&1]!.id)!,0,0);
    blit(look,pieces.base,0,0);blit(look,head,0,0);blit(actionClothingPreview,look,combo*112,row*112);
   }
  }
  const prefix = `${schedule.action}_${directions[d]}_${f}`;
  const swordAngle = schedule.action==='attack' ? (f<3?[-115,-135,-135,-135,-90,-45,-45,-65][d]!-[0,12,22][f]!:f<6?[90,135,180,225,270,315,0,45][d]!+[0,12,24][f-3]!:-83) : (grip[0]<56?-98:-82);
  const swordPose = weaponFrame(sword,grip,schedule.action,f,directions[d]!,false,swordAngle,[5,29],true);
  const staffAngle=(staffGrip[0]<56?-112:-68)+(schedule.action==='cast'?[0,-2,-4,0,2,3,1,0][f]!:0);
  const staffPose = weaponFrame(staff,staffGrip,schedule.action,f,directions[d]!,true,staffAngle,[5,37],true);
  const handPrefix=`hands_${row}_${directions[d]}`;
  if(!handCells.has(handPrefix+'_sword')) {handCells.set(handPrefix+'_sword',handOcclusion(img,grip));handCells.set(handPrefix+'_staff',handOcclusion(img,staffGrip));}
  const index=cells.length;
  for(const [layer,image] of [['identity',head],['silver',head],['warden',body],['sword',swordPose],['staff',staffPose]] as const) {names.push(`${prefix}_${layer}`);cells.push(image);}
  frames.push({name:prefix,index,garmentPrefix,handPrefix,weaponGrips:[grip,staffGrip],weaponOrders:[weaponOrder,weaponOrder],root:[56,100],neck,grip,weaponOrder,anchorsReviewed:annotation?.reviewed===true,
   jointsReviewed:false,joints:{head:[neck[0],neck[1]-10],shoulderL:[45,neck[1]+3],shoulderR:[66,neck[1]+3],elbowR:[Math.round((66+grip[0])/2),Math.round((neck[1]+3+grip[1])/2)],handR:grip,hipL:[50,74],hipR:[62,74],kneeL:[49,85],kneeR:[63,85],footL:[49,99],footR:[63,99]},
   source:`assets/mannequin/v2/source-art/warden-sheet.png#${key}`,sourceRow:row,hash:createHash('sha256').update(img.data).digest('hex')});
  if(f===(schedule.hitFrame<0?0:schedule.hitFrame)) { const assembled=createImage(112,112);if(weaponOrder<0)blit(assembled,actionIndex===3?staffPose:swordPose,0,0);blit(assembled,body,0,0);if(weaponOrder>0)blit(assembled,actionIndex===3?staffPose:swordPose,0,0);blit(assembled,handCells.get(handPrefix+(actionIndex===3?'_staff':'_sword'))!,0,0);blit(assembled,head,0,0);blit(matrix,assembled,d*112,actionIndex*112); }
 }
 sequences.push({action:schedule.action,direction:directions[d],fps:schedule.fps,hitFrame:schedule.hitFrame,frames});
}
for(const [name,img] of garmentCells){names.push(name);cells.push(img);}
for(const [name,img] of handCells){names.push(name);cells.push(img);}
writePng(join(out,'clothing/masks-2x.png'),scaleNearest(ownershipPreview,2));
writePng(join(out,'clothing/combinations-2x.png'),scaleNearest(garmentPreview,2));
writePng(join(out,'clothing/actions-2x.png'),scaleNearest(actionClothingPreview,2));
writePng(join(out,'clothing/equipment-directions-2x.png'),scaleNearest(equipmentLooks,2));
writePng(join(out,'clothing/equipment-actions-2x.png'),scaleNearest(equipmentActions,2));
for(const [name,img] of garmentCells)writePng(join(out,'clothing/parts',name+'.png'),img);
for(const [name,img] of handCells)writePng(join(out,'weapons/hands',name+'.png'),img);
for(let page=0;page*256<cells.length;page++) {
 const atlas=createImage(1792,1792);cells.slice(page*256,(page+1)*256).forEach((img,k)=>blit(atlas,img,k%16*112,Math.floor(k/16)*112));
 writePng(join(out,`${id}-${page}.png`),atlas);
}
writePng(join(out,'equipment-2x.png'),scaleNearest(matrix,2));
writeFileSync(join(out,`${id}-slices.json`),JSON.stringify(names));
writeFileSync(join(out,'anchor-candidates.json'),JSON.stringify(candidates,null,2)+'\n');
const catalog={version:2,template:'adult-112-authored-v2',frameSize:[112,112],ppu:48,anchor:[56,100],directions,hairVariants:false,
 garmentSlots,
 outfits:[{id:'warden',name:'Hộ vệ Ngân Lam'}],weapons:[
 {id:'sword',name:'Kiếm Nguyệt Cương',action:'attack',skill:'slash',fps:22,hitFrame:3,hands:1},
 {id:'staff',name:'Trượng Aether',action:'cast',skill:'aether_bolt',fps:20,hitFrame:3,hands:1}],
 identities:[{id,name:'Hộ vệ Ngân Lam',texture:id,sequences}],reviewRequired:true,
 equipmentSha256:createHash('sha256').update(readFileSync(join(out,'source-art/equipment-kit.png'))).digest('hex'),
 sourceSha256:createHash('sha256').update(readFileSync(sheetPath)).digest('hex')};
writeFileSync(join(out,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
writeFileSync(join(out,'review.txt'),'Nhân vật mới 64 pose nguồn / 8 hướng. Idle tĩnh, walk 3 pose, attack và cast mỗi loại 2 pose + recovery idle. Khung giữ lặp là chủ ý, KHÔNG phải 8 pose vẽ khác nhau. Neo/grip/joint gợi ý CHƯA duyệt thủ công. Không có hit/death riêng. Pipeline này không kiểm Unity runtime; kết quả chạy thực xem docs/mannequin-v2-delivery.md.\n');
console.log(`PASS dựng ${sequences.length} chuỗi, ${cells.length} cells; neo và runtime CHƯA nghiệm thu.`);
