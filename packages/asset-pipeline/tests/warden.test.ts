// Kiểm dữ liệu thật, không chứng nhận Unity runtime hoặc mỹ thuật.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { createHash } from 'node:crypto';
import { blit,createImage,crop,getPixel,readPng,opaqueBounds,type RGBAImage } from '../src/image/rgba.js';
const root=resolve(import.meta.dirname,'../../..');
const out=join(root,'assets/mannequin/v2');
const catalog=JSON.parse(readFileSync(join(out,'catalog.json'),'utf8'));
const layout=JSON.parse(readFileSync(join(out,'source-art/layout.json'),'utf8'));
const source=readPng(join(out,'source-art/warden-sheet.png'));
const annotations=JSON.parse(readFileSync(join(out,'source-art/anchors.json'),'utf8'));
assert.deepEqual([source.width,source.height],[layout.width,layout.height]);
assert.equal(catalog.sourceSha256,createHash('sha256').update(readFileSync(join(out,'source-art/warden-sheet.png'))).digest('hex'));
assert.equal(catalog.equipmentSha256,createHash('sha256').update(readFileSync(join(out,'source-art/equipment-kit.png'))).digest('hex'));
assert.deepEqual(catalog.directions,['S','SW','W','NW','N','NE','E','SE']);
assert.deepEqual(catalog.frameSize,[112,112]);assert.deepEqual(catalog.anchor,[56,100]);assert.equal(catalog.ppu,48);
assert.equal(catalog.identities.length,1);assert.equal(catalog.identities[0].id,'aether_warden');
assert.deepEqual(catalog.weapons.map((w:any)=>[w.id,w.action,w.skill,w.hitFrame]),[['sword','attack','slash',3],['staff','cast','aether_bolt',3]]);
assert.equal(catalog.hairVariants,false);assert.equal(catalog.reviewRequired,true);
const names: string[]=JSON.parse(readFileSync(join(out,'aether_warden-slices.json'),'utf8'));
assert.equal(new Set(names).size,names.length);
const pages: RGBAImage[]=[];
for(let page=0;page*256<names.length;page++) {
 const image=readPng(join(out,`aether_warden-${page}.png`));
 assert.deepEqual([image.width,image.height],[1792,1792]);pages.push(image);
 for(let k=3;k<image.data.length;k+=4) assert.ok(image.data[k]===0||image.data[k]===255,'Không có alpha mềm');
}
const sprite=(name:string) => {const n=names.indexOf(name);assert.ok(n>=0,`Thiếu sprite ${name}`);return crop(pages[Math.floor(n/256)]!,n%16*112,Math.floor(n%256/16)*112,112,112);};
let frames=0,combinations=0,clothingCombinations=0;const floor:number[]=[];
assert.deepEqual(catalog.garmentSlots.map((s:any)=>s.id),['upper','pants','boots']);
assert.deepEqual(catalog.garmentSlots.map((s:any)=>s.items.length),[4,3,3]);
const styleCount=catalog.garmentSlots.reduce((n:number,s:any)=>n*s.items.length,1);
const styleItem=(combo:number,s:number):number => {for(let i=0;i<s;i++)combo=Math.floor(combo/catalog.garmentSlots[i].items.length);return combo%catalog.garmentSlots[s].items.length;};
for(const action of ['idle','walk','attack','cast']) {
 const seqs=catalog.identities[0].sequences.filter((s:any)=>s.action===action);
 assert.deepEqual(seqs.map((s:any)=>s.direction),catalog.directions);
 const directional=new Set<string>();
 for(const seq of seqs) {
  assert.equal(seq.frames.length,action==='idle'||action==='walk'?4:8);
  assert.ok(seq.fps>0);assert.equal(seq.hitFrame,action==='attack'||action==='cast'?3:-1);
  const hashes=new Set<string>();
  for(const pose of seq.frames) {
   assert.deepEqual(pose.root,[56,100]);
   assert.equal(pose.anchorsReviewed,annotations[`${pose.sourceRow}/${seq.direction}`]?.reviewed===true,'Cờ duyệt phải đến từ annotation tường minh');
   assert.ok(pose.source.startsWith('assets/mannequin/v2/source-art/warden-sheet.png#'));
   assert.ok(!pose.source.includes('player_hero'));
   for(const p of [pose.neck,pose.grip,...Object.values(pose.joints)] as number[][]) for(const value of p) assert.ok(Number.isInteger(value)&&value>=0&&value<112);
   assert.ok(pose.weaponOrder===1||pose.weaponOrder===-1);
   const body=sprite(pose.name+'_warden'),head=sprite(pose.name+'_identity');
   const assembled=createImage(112,112);blit(assembled,body,0,0);blit(assembled,head,0,0);
   const fixed=sprite(pose.garmentPrefix+'_base');
   const pieces:RGBAImage[][]=catalog.garmentSlots.map((slot:any)=>slot.items.map((item:any)=>sprite(pose.garmentPrefix+'_'+item.id)));
   const rebuilt=createImage(112,112);
   for(const slot of pieces)blit(rebuilt,slot[0]!,0,0);blit(rebuilt,fixed,0,0);
   assert.deepEqual(rebuilt.data,body.data,'Tách đồ mất pixel body gốc');
   for(let k=0;k<body.data.length;k+=4) {
    const ownership=[fixed,...pieces.map(p=>p[0]!)].filter(img=>img.data[k+3]!==0).length;
    assert.equal(ownership,body.data[k+3]?1:0,'Pixel đồ bị trùng hoặc có lỗ');
   }
   for(const slot of pieces) {
    let different=0;
    for(let k=0;k<body.data.length;k+=4) {
     assert.equal(slot[0]!.data[k+3],slot[1]!.data[k+3],'Biến thể làm lệch silhouette');
     if(slot[0]!.data[k]!==slot[1]!.data[k]||slot[0]!.data[k+1]!==slot[1]!.data[k+1]||slot[0]!.data[k+2]!==slot[1]!.data[k+2])different++;
    }
    assert.ok(different>8,'Biến thể đồ không thay đổi hình');
   }
   for(let combo=0;combo<styleCount;combo++) {
    const look=createImage(112,112);
    pieces.forEach((items,s)=>blit(look,items[styleItem(combo,s)]!,0,0));blit(look,fixed,0,0);blit(look,head,0,0);
    for(let k=3;k<look.data.length;k+=4)if(assembled.data[k])assert.equal(look.data[k],255,'Phối đồ hở alpha');
    if(combo===0)assert.deepEqual(look.data,assembled.data,'Bộ mặc định phải khớp bản vẽ gốc');
    clothingCombinations++;
   }
   assert.equal(createHash('sha256').update(assembled.data).digest('hex'),pose.hash,'Lắp body+head mất pixel');
   // So với pixel nguồn qua layout độc lập: không chỉ so hai hash do cùng builder ghi.
   const rect=layout.rects[pose.sourceRow*8+catalog.directions.indexOf(seq.direction)];
   for(let y=0;y<112;y++) for(let x=0;x<112;x++) {
    const sx=Math.floor((x-56)/layout.scale+rect.origin[0]),sy=Math.floor((y-100)/layout.scale+rect.origin[1]);
    const c=sx>=0&&sx<rect.w&&sy>=0&&sy<rect.h?getPixel(source,rect.x+sx,rect.y+sy):[0,0,0,0];
    assert.deepEqual(getPixel(assembled,x,y),c[3]!>=220?[c[0],c[1],c[2],255]:[0,0,0,0]);
   }
   assert.ok(getPixel(assembled,pose.grip[0],pose.grip[1])[3]>0,'Neo phải chạm nhân vật');
   const bounds=opaqueBounds(assembled)!;assert.ok(bounds);assert.ok(bounds.y0>=20&&bounds.y1>=99&&bounds.y1<=100,'Chân lệch baseline');floor.push(bounds.y1);
   for(const weapon of catalog.weapons) {
    const weaponImage=sprite(pose.name+'_'+weapon.id);const wb=opaqueBounds(weaponImage);assert.ok(wb);
    assert.ok(wb!.x0>0&&wb!.x1<112&&wb!.y0>0&&wb!.y1<112,`Vũ khí bị cắt biên ${pose.name}/${weapon.id}: ${JSON.stringify(wb)}`);
    combinations++;
    const weaponIndex=catalog.weapons.indexOf(weapon),grip=pose.weaponGrips[weaponIndex];
    assert.ok(getPixel(assembled,grip[0],grip[1])[3]>0,'Neo weapon ngoài body');
    assert.ok(getPixel(weaponImage,grip[0],grip[1])[3]>0,'Chuôi bị đục lỗ tại điểm nắm');
    assert.ok(getPixel(sprite(pose.handPrefix+'_'+weapon.id),grip[0],grip[1])[3]>0,'Thiếu lớp tay che chuôi');
   }
   hashes.add(pose.hash);frames++;
  }
  if(action!=='idle')assert.ok(hashes.size>=3,`Chuỗi ${action}/${seq.direction} không có đủ pose`);
  directional.add(seq.frames[0].hash);
 }
 assert.equal(directional.size,8,`${action}: không thay hướng chéo bằng bản cardinal`);
}
assert.equal(frames,192);assert.equal(combinations,384);assert.equal(clothingCombinations,6912);assert.equal(names.length,1792);
// Hồi quy: vải navy của đùi trong pose chém phải thuộc quần, không bị nhận nhầm là sash áo.
assert.ok(getPixel(sprite('clothing_5_S_pants_dark'),50,81)[3]>0,'Đùi quần bị xếp nhầm vào áo');
for(const dir of catalog.directions) {
 const seqs=catalog.identities[0].sequences;
 assert.notEqual(seqs.find((s:any)=>s.action==='attack'&&s.direction===dir).frames[3].hash,seqs.find((s:any)=>s.action==='cast'&&s.direction===dir).frames[3].hash);
 const cast=seqs.find((s:any)=>s.action==='cast'&&s.direction===dir);
 const charge=cast.frames[2].weaponGrips[1],release=cast.frames[3].weaponGrips[1];
 assert.ok(Math.hypot(charge[0]-release[0],charge[1]-release[1])<=12,'Trượng nhảy qua tay khác khi phóng phép');
 const prefix='clothing_0_'+dir;
 for(const [original,armor] of [['jacket_navy','cuirass_silver'],['boots_brown','boots_plate']]) {
  const old=sprite(prefix+'_'+original),added=sprite(prefix+'_'+armor);
  let expanded=0;
  for(let k=3;k<old.data.length;k+=4)if(added.data[k]&&!old.data[k])expanded++;
  assert.ok(expanded>4,'Giáp phải có silhouette mới, không chỉ đổi màu');
 }
}
console.log(`PASS Warden: ${frames} frames, ${combinations} weapon combinations, ${clothingCombinations} clothing combinations, 8 hướng thật, 1792 cells, alpha/source/grip/tay che chuôi/lớp đồ/profile; chân y=${Math.min(...floor)}…${Math.max(...floor)}. Chưa kiểm Unity hoặc duyệt mỹ thuật.`);
