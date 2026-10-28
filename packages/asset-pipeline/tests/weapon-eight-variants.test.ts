import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng,createImage,blit,getPixel} from '../src/image/rgba.js';
const root=resolve(import.meta.dirname,'../../..'),stage=join(root,'.aether-stage/attack-eight-v6'),source=join(root,'packages/asset-pipeline/sources/player-weapon-proof-v2/attack-eight-v6');
const m=JSON.parse(readFileSync(join(stage,'manifest.json'),'utf8')),w=JSON.parse(readFileSync(join(stage,'weapon-manifest.json'),'utf8')),registration=JSON.parse(readFileSync(join(source,'sword-variants/registration.json'),'utf8')),poses=JSON.parse(readFileSync(join(source,'pose-candidates.json'),'utf8'));
assert.deepEqual(w.variants,['steel','lam-ngoc','hac-diem']);assert.equal(registration.frames.length,192);
let checked=0;
for(const id of ['lam-ngoc','hac-diem'])for(const f of m.frames){
 const body=readPng(join(stage,'body',f.id+'.png')),hands=readPng(join(stage,'hands',f.id+'.png')),back=readPng(join(stage,'weapon-back',id,f.id+'.png')),front=readPng(join(stage,'weapon',id,f.id+'.png')),made=createImage(288,288);
 const row=w.frames.find((r:{id:string})=>r.id===f.id),p=poses.find((p:{id:string})=>p.id===f.id);
 assert.equal(createHash('sha256').update(body.data).digest('hex'),row.bodySha256);
 for(const im of [back,body,front,hands])blit(made,im,0,0);
 assert.deepEqual(made.data,readPng(join(stage,'composite',id,f.id+'.png')).data);
 for(let y=0;y<288;y++)for(let x=0;x<288;x++){
  const h=getPixel(hands,x,y);if(h[3])assert.deepEqual(getPixel(made,x,y),h,id+'/'+f.id+': kiếm đè ngón tay');
  if(getPixel(back,x,y)[3]){const dx=x-p.grip[0],dy=y-p.grip[1],n=-dx*p.axis[1]+dy*p.axis[0];assert(Math.abs(n)<15,id+'/'+f.id+': rời trục cầm');}
 }
 checked++;
}
// Các lỗi cũ lộ ra khi thay kiếm: không được giữ lưỡi gốc trong lớp thân hoặc nắm vào áo choàng.
for(const [id,x,y]of [['attack-E-7',210,237],['attack-E-8',212,233],['attack-E-9',204,226]] as const){assert(getPixel(readPng(join(stage,'native',id+'.png')),x,y)[3]);assert.equal(getPixel(readPng(join(stage,'body',id+'.png')),x,y)[3],0,id+': còn kiếm gốc trong thân');}
for(const index of [7,8,9]){const p=poses.find((p:{id:string})=>p.id==='attack-E-'+index);assert(p.grip[0]>150&&p.grip[1]>180,'Điểm nắm E phải ở bàn tay, không ở vai');}
const report={newWeapons:2,totalWeapons:3,checkedNewFrames:checked,bodyShared:true,handsCoverHilt:true,oldBladeRegressionFixed:true,artApproved:false};
writeFileSync(join(stage,'variants-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
