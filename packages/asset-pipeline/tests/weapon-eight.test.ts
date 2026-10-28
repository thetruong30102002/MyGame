// Cổng kỹ thuật của bộ mới: không thay cho nghiệm thu nét vẽ/tỷ lệ bằng mắt.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng,createImage,blit,getPixel} from '../src/image/rgba.js';
const root=resolve(import.meta.dirname,'../../..'),stage=join(root,'.aether-stage/attack-eight-v6'),folder=join(root,'packages/asset-pipeline/sources/player-weapon-proof-v2/attack-eight-v6');
const m=JSON.parse(readFileSync(join(stage,'manifest.json'),'utf8')),w=JSON.parse(readFileSync(join(stage,'weapon-manifest.json'),'utf8')),poses=JSON.parse(readFileSync(join(folder,'pose-candidates.json'),'utf8'));
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
assert.equal(m.frames.length,96);assert.equal(w.frames.length,96);assert.equal(m.productionEnabled,false);assert.equal(m.userApproved,false);assert.equal(w.hairSeparated,false);
assert.deepEqual(m.frameSize,[288,288]);assert.deepEqual(m.root,[144,256]);assert.equal(m.ppu,96);
for(const d of m.directions){assert.equal(m.frames.filter((f:{direction:string})=>f.direction===d).length,12);const frame=(i:number)=>readPng(join(stage,'native','attack-'+d+'-'+i+'.png'));assert.deepEqual(frame(3).data,frame(4).data,d+': giữ đỉnh kiếm phải giữ nguyên nét');assert.deepEqual(frame(0).data,frame(10).data,d+': hồi đứng bị đổi người');assert.deepEqual(frame(0).data,frame(11).data,d+': cuối chuỗi khác đầu chuỗi');}
let handsPixels=0;
for(const f of m.frames){const ref=readPng(join(stage,'native',f.id+'.png'));assert.equal(ref.width,288);assert.equal(ref.height,288);assert.equal(f.perFrameFit,false);assert.equal(f.clippedPixels,0,f.id+': cắt mép');assert.equal(sha(ref.data),f.sha256);
 assert.equal(sha(readFileSync(join(folder,f.source))),f.sourceSha256,f.id+': nguồn đã đổi');
 const p=poses.find((p:{id:string})=>p.id===f.id);assert(p);if([3,4].includes(f.index)){assert(!p.missing,f.id+': thiếu lưỡi giữ cao');assert(Math.abs(p.axis[0])<.06&&p.axis[1]<-.995,f.id+': kiếm giữ cao không dựng thẳng');}
 const body=readPng(join(stage,'body',f.id+'.png')),weapon=readPng(join(stage,'weapon/steel',f.id+'.png')),back=readPng(join(stage,'weapon-back/steel',f.id+'.png')),hands=readPng(join(stage,'hands',f.id+'.png')),mask=readPng(join(stage,'removal',f.id+'.png')),made=createImage(288,288);
 for(const im of [back,body,weapon,hands])blit(made,im,0,0);assert.deepEqual(made.data,ref.data,f.id+': tách/ghép khác nguồn');
 const row=w.frames.find((x:{id:string})=>x.id===f.id);assert.equal(sha(body.data),row.bodySha256);
 for(let y=0;y<288;y++)for(let x=0;x<288;x++){const r=getPixel(ref,x,y),b=getPixel(body,x,y),h=getPixel(hands,x,y);assert(r[3]===0||r[3]===255,f.id+': alpha bị làm mờ');if(!getPixel(mask,x,y)[3])assert.deepEqual(b,r,f.id+': sửa người ngoài mask kiếm');if(h[3]){handsPixels++;assert.deepEqual(h,r,f.id+': đổi pixel ngón tay');assert.deepEqual(getPixel(made,x,y),h,f.id+': kiếm đè ngón tay');}}
}
assert(handsPixels>1000);
const report={checkedAt:new Date().toISOString(),frames:96,directions:8,framesPerDirection:12,sourceReassemblyExact:96,nativeCanvas:[288,288],ppu:96,perFrameFit:false,overheadSwordUpright:true,lockedHolds:true,handsPixels,bodyOutsideWeaponMaskPreserved:true,artApproval:'pending',productionEnabled:false};writeFileSync(join(stage,'technical-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
