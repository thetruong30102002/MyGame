// Source fidelity, clothing occlusion and shared grip checks. Visual QA is separate.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { createHash } from 'node:crypto';
import { blit,createImage,crop,getPixel,readPng,opaqueBounds,type RGBAImage } from '../src/image/rgba.js';
const root=resolve(import.meta.dirname,'../../..'),out=join(root,'assets/mannequin/v2'),art=join(out,'source-art/authored-v4');
const readNative=(path:string)=>{const image=createImage(144,144);blit(image,readPng(path),16,24);return image;};
const catalog=JSON.parse(readFileSync(join(out,'catalog.json'),'utf8'));
const layout=JSON.parse(readFileSync(join(art,'layout.json'),'utf8'));
const hash=(data:Uint8Array)=>createHash('sha256').update(data).digest('hex');
assert.equal(catalog.template,'adult-144-twohand-v5');assert.equal(catalog.drawnBodies,true);
assert.deepEqual(catalog.frameSize,[144,144]);assert.deepEqual(catalog.anchor,[72,124]);assert.equal(catalog.ppu,48);
assert.deepEqual(catalog.directions,['S','SW','W','NW','N','NE','E','SE']);
assert.equal(catalog.drawnPoseCount,192);assert.equal(layout.poses.length,192);
for(const [file,expected] of Object.entries(catalog.sourceHashes))assert.equal(hash(readFileSync(join(art,file))),expected,'Stale source '+file);
const names:string[]=JSON.parse(readFileSync(join(out,'aether_warden-slices.json'),'utf8'));
assert.equal(new Set(names).size,names.length);
const pages:RGBAImage[]=[];
for(let page=0;page*256<names.length;page++) {
 const image=readPng(join(out,`aether_warden-${page}.png`));assert.deepEqual([image.width,image.height],[2304,2304]);pages.push(image);
 for(let k=3;k<image.data.length;k+=4)assert.ok(image.data[k]===0||image.data[k]===255,'Soft alpha in native atlas');
}
const indices=new Map(names.map((name,i)=>[name,i]));
const sprites=new Map<string,RGBAImage>();
const sprite=(name:string)=>{
 if(sprites.has(name))return sprites.get(name)!;
 const n=indices.get(name);assert.ok(n!==undefined,'Missing '+name);
 const image=crop(pages[Math.floor(n/256)]!,n%16*144,Math.floor(n%256/16)*144,144,144);sprites.set(name,image);return image;
};
function palmJoinsBody(image:RGBAImage,palm:number[],waist:number):boolean {
 const queue:Array<[number,number]>=[[palm[0]!,palm[1]!]],seen=new Set<string>();
 while(queue.length) {
  const [x,y]=queue.pop()!;const key=x+','+y;
  if(seen.has(key)||x<0||x>=144||y<0||y>=144||!getPixel(image,x,y)[3])continue;
  seen.add(key);if(y>=waist&&Math.abs(x-72)<=8)return true;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)queue.push([x+dx,y+dy]);
 }
 return false;
}
assert.deepEqual(catalog.garmentSlots.map((s:any)=>s.items.length),[5,4,4]);
assert.deepEqual(catalog.weapons.map((w:any)=>[w.id,w.action,w.hitFrame,w.fps]),[['sword','attack',7,18],['staff','cast',4,10]]);
assert.equal(catalog.weapons[0].hands,2,'The downward chop must use both hands');
let frames=0,contacts=0;const seenPoses=new Set<string>();
for(const action of ['idle','walk','run','attack','cast']) {
 const seqs=catalog.identities[0].sequences.filter((seq:any)=>seq.action===action);
 assert.deepEqual(seqs.map((seq:any)=>seq.direction),catalog.directions);
 for(const seq of seqs) {
  assert.equal(seq.frames.length,action==='idle'?4:action==='attack'?14:8);assert.equal(seq.hitFrame,action==='attack'?7:action==='cast'?4:-1);
  const phaseHashes=new Set<string>();
  for(const [f,pose] of seq.frames.entries()) {
   assert.deepEqual(pose.root,[72,124]);assert.ok(pose.source.startsWith('authored-v4/'),'Anatomy must come from a drawn frame');
   assert.equal(pose.anchorsReviewed,false);assert.equal(pose.jointsReviewed,false);
   const bare=sprite(pose.garmentPrefix+'_base'),head=sprite(pose.name+'_identity'),body=sprite(pose.name+'_warden');
   assert.equal(hash(bare.data),pose.bareHash);phaseHashes.add(pose.bareHash);
   const assembled=createImage(144,144);blit(assembled,body,0,0);blit(assembled,head,0,0);assert.equal(hash(assembled.data),pose.hash);
   const bounds=opaqueBounds(assembled)!;assert.ok(bounds.y0>=16&&bounds.y1<=128,'Wrong body scale or floor');
   for(const [i,weapon] of catalog.weapons.entries()) {
    const held=sprite(pose.name+'_'+weapon.id),b=opaqueBounds(held)!;assert.ok(b.x0>0&&b.x1<144&&b.y0>0&&b.y1<144,'Weapon clipped '+pose.name);
    const grip=pose.weaponGrips[i];
    if(action!=='attack')for(const image of [body,bare,held,sprite(pose.handPrefix+'_'+weapon.id),sprite(pose.handPrefix+'_'+weapon.id+'_bare'),sprite(pose.handPrefix+'_'+weapon.id+'_silver'),sprite(pose.handPrefix+'_'+weapon.id+'_gold')])assert.ok(getPixel(image,grip[0],grip[1])[3],'Grip not in palm '+pose.name+'/'+weapon.id);
    contacts++;
   }
   if(action==='idle'||action==='run')assert.ok(pose.swordAngle<0,'Carried blade points down');
   if(action==='attack'&&(f===7||f===8))assert.ok(Math.sin(pose.swordAngle*Math.PI/180)>.6,'Impact blade does not point down');
   if(action==='attack') {assert.equal(pose.trailActive,f>=7&&f<=9);assert.equal(!!opaqueBounds(sprite(pose.name+'_trail')),pose.trailActive,'Slash arc active outside the cleave');}
   if(action==='attack') {
    assert.equal(pose.swordHands.length,2,'Missing the support hand '+pose.name);
    const ax=Math.cos(pose.swordAngle*Math.PI/180),ay=Math.sin(pose.swordAngle*Math.PI/180);
    assert.equal(pose.swordHandSets.length,4);
    for(const [look,suffix] of ['','_bare','_silver','_gold'].entries()) {
     const [upper,lower]=pose.swordHandSets[look];
     assert.ok(Math.hypot(upper[0]-lower[0],upper[1]-lower[1])>=4,'Fists collapse onto one contact');
     assert.ok(Math.abs((lower[0]-upper[0])*ay-(lower[1]-upper[1])*ax)<1,'Hands do not share a straight hilt');
     const figure=look===0?body:look===1?bare:readNative(join(art,`attack_${pose.posePhase}_${seq.direction}_${look===2?'silver':'gold'}.png`));
     const held=sprite(pose.name+'_sword'+suffix),hand=sprite(pose.handPrefix+'_sword'+suffix),box=opaqueBounds(held)!;
     assert.ok(box.x0>0&&box.x1<144&&box.y0>0&&box.y1<144,'Outfit blade clipped');
     if(pose.swordHandsVisible)for(const palm of [upper,lower])for(const image of [figure,held,hand])assert.ok(getPixel(image,palm[0],palm[1])[3],'Support hand slips off sword '+pose.name+'/'+suffix);
    }
    if(pose.trailActive) {
     const trail=opaqueBounds(sprite(pose.name+'_trail'))!;
     assert.ok(trail.y1-trail.y0>trail.x1-trail.x0,'The downward cut has become a circular/horizontal sweep');
    }
   }
   if(!seenPoses.has(pose.source)) {
    seenPoses.add(pose.source);
    const record=layout.poses.find((p:any)=>p.action===action&&p.phase===pose.posePhase&&p.direction===seq.direction);
    assert.ok(record);
    const rawBare=readNative(join(art,`${action}_${pose.posePhase}_${seq.direction}_bare.png`));
    const rawClothed=readNative(join(art,`${action}_${pose.posePhase}_${seq.direction}_clothed.png`));
    for(let y=record.neck+25;y<144;y++)for(let x=0;x<144;x++)assert.deepEqual(getPixel(bare,x,y),getPixel(rawBare,x,y),'Bare anatomy must retain the drawn frame');
    assert.equal(opaqueBounds(head),null,'An idle head is still grafted over a moving neck');
    assert.deepEqual(bare.data,rawBare.data,'Bare head/body were altered');
    const fullyClothed=createImage(144,144);
    for(let slot=2;slot>=0;slot--)blit(fullyClothed,sprite(pose.garmentPrefix+'_'+catalog.garmentSlots[slot].items[0].id),0,0);
    blit(fullyClothed,head,0,0);
    assert.deepEqual(fullyClothed.data,rawClothed.data,'Default head and body must reconstruct one coherent drawn pose');
    const rawSilver=readNative(join(art,`${action}_${pose.posePhase}_${seq.direction}_silver.png`)),silverBody=createImage(144,144);
    for(const item of ['boots_plate','pants_mail','cuirass_silver'])blit(silverBody,sprite(pose.garmentPrefix+'_'+item),0,0);
    for(let y=record.neck+25;y<144;y++)for(let x=0;x<144;x++)assert.deepEqual(getPixel(silverBody,x,y),getPixel(rawSilver,x,y),'Silver gear must reconstruct its drawn pose rather than a pasted equipment icon');
    assert.deepEqual(silverBody.data,rawSilver.data,'Silver face/head no longer belongs to its complete pose');
    const rawGold=readNative(join(art,`${action}_${pose.posePhase}_${seq.direction}_gold.png`)),goldBody=createImage(144,144);
    for(const item of ['dragon_boots','dragon_legs','dragon_guard'])blit(goldBody,sprite(pose.garmentPrefix+'_'+item),0,0);
    for(let y=record.neck+25;y<144;y++)for(let x=0;x<144;x++)assert.deepEqual(getPixel(goldBody,x,y),getPixel(rawGold,x,y),'Long Ve gear must reconstruct its drawn pose');
    assert.deepEqual(goldBody.data,rawGold.data,'Long Ve face/head no longer belongs to its complete pose');
    if(action==='attack'&&pose.swordHandsVisible)for(const [look,image] of [[0,body],[1,bare],[2,silverBody],[3,goldBody]] as const) {
     const figure=createImage(144,144);blit(figure,image,0,0);blit(figure,head,0,0);
     for(const palm of pose.swordHandSets[look])assert.ok(palmJoinsBody(figure,palm,record.waist+24),'Detached gripping hand '+pose.name+'/'+look);
    }
    assert.equal(opaqueBounds(sprite(pose.garmentPrefix+'_base_7')),null,'Fully covered body still adds duplicate limbs');
    for(let mask=1;mask<8;mask++) {
     const variant=sprite(pose.garmentPrefix+'_base_'+mask);
     for(let k=0;k<variant.data.length;k+=4)if(variant.data[k+3])assert.deepEqual(variant.data.subarray(k,k+4),bare.data.subarray(k,k+4),'Occlusion changed anatomy or position');
     if(mask&1)for(let y=24;y<record.neck+24;y++)for(let x=53;x<=91;x++)assert.equal(getPixel(variant,x,y)[3],0,'Bare head is still behind an equipped upper body');
    }
    for(const slot of catalog.garmentSlots)for(const item of slot.items)assert.ok(opaqueBounds(sprite(pose.garmentPrefix+'_'+item.id)),'Missing garment pose '+item.id);
   }
   frames++;
  }
  assert.equal(phaseHashes.size,action==='idle'?1:action==='attack'?7:action==='run'?8:4,'Missing independently drawn motion phases '+action+'/'+seq.direction);
  if(action==='attack') {
   assert.ok(seq.frames[3].grip[1]<seq.frames[3].neck[1]-16,'Windup fist never reaches above the head '+seq.direction);
   assert.ok(seq.frames[7].grip[1]-seq.frames[3].grip[1]>=40,'Cut has no downward hand travel '+seq.direction);
   assert.ok(Math.max(...seq.frames.map((f:any)=>f.swordAngle))-Math.min(...seq.frames.map((f:any)=>f.swordAngle))>=160,'Blade only waves in a narrow angle '+seq.direction);
  }
  if(action==='run') {
   const shapes=seq.frames.map((f:any)=>opaqueBounds(crop(sprite(f.garmentPrefix+'_base'),41,106,62,30))!);
   assert.ok(shapes.every(Boolean),'Missing running feet '+seq.direction);
   const widths=shapes.map((b:any)=>b.x1-b.x0),heights=shapes.map((b:any)=>b.y1-b.y0);
   assert.ok(Math.max(...widths)-Math.min(...widths)>=5||Math.max(...heights)-Math.min(...heights)>=5,'Run lower legs remain in the idle silhouette '+seq.direction);
  }
 }
}
assert.equal(seenPoses.size,192);assert.equal(frames,336);assert.equal(contacts,672);
for(const id of [...catalog.garmentSlots.flatMap((s:any)=>s.items.map((i:any)=>i.id)),...catalog.weapons.map((w:any)=>w.itemId)]) {
 const icon=readPng(join(root,'assets/items',id+'.png'));assert.deepEqual([icon.width,icon.height],[48,48]);assert.ok(opaqueBounds(icon));
}
console.log(`PASS Warden v5: ${seenPoses.size} authored poses, ${frames} playback frames, ${contacts} carry contacts plus two-palm checks for four upper-body variants, eight-phase run, two-handed overhead chop, Long Ve outfit, coherent clothing and coherent full heads, no graft and no forced blade tilt; ${names.length} cells.`);
