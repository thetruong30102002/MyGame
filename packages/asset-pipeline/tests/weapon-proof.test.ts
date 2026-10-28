// Kiểm mẫu thử, không xem kiểm hình học là nghiệm thu mỹ thuật/chuyển động.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {readPng,getPixel,opaqueBounds} from '../src/image/rgba.js';
const out=resolve(import.meta.dirname,'../../../.aether-stage/weapon-proof-v1');
const manifest=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8'));
assert.equal(manifest.productionEnabled,false);
assert.equal(manifest.bodyCount,29);assert.equal(manifest.weaponCount,2);
assert.equal(manifest.normalization.perFrameScale,false);
const observations=[];
for(const f of manifest.frames){
 const body=readPng(join(out,'body',f.id+'.png')),hands=readPng(join(out,'hands',f.id+'.png'));
 assert.deepEqual([body.width,body.height],[144,144]);
 const bounds=opaqueBounds(body)!;assert(bounds.y1<=130,f.id+': chân vượt neo');
 const handPixels=hands.data.filter((_,i)=>i%4===3&&hands.data[i]===255).length;
 for(const id of ['steel','iron']){
  const weapon=readPng(join(out,'weapon',id,f.id+'.png')),full=readPng(join(out,'composite',id,f.id+'.png'));
  let covered=0;
  for(let y=0;y<144;y++)for(let x=0;x<144;x++){
   const b=getPixel(body,x,y),w=getPixel(weapon,x,y),h=getPixel(hands,x,y),c=getPixel(full,x,y);
   assert(c[3]===0||c[3]===255,f.id+': alpha mềm');
   if(!w[3]&&b[3])assert.deepEqual(c,b,f.id+': thay kiếm làm đổi thân/tóc');
   if(h[3]){assert.deepEqual(c,h,f.id+': chuôi đè lên lớp tay');if(w[3])covered++;}
   if(x===0||x===143||y===0||y===143)assert.equal(c[3],0,f.id+': cắt mép');
  }
  observations.push({frame:f.id,weapon:id,gripOnBody:!!getPixel(body,f.grip[0],f.grip[1])[3],handPixels,coveredHandlePixels:covered,reviewed:f.reviewed});
 }
}
const failed=observations.filter(o=>!o.gripOnBody||(!o.coveredHandlePixels&&o.frame!=='idle-W'));
writeFileSync(join(out,'geometry-check.json'),JSON.stringify({checkedAt:new Date().toISOString(),observations,needsAnchorReview:failed,artApproval:false},null,2));
console.log(JSON.stringify({checks:'Không đổi thân/tóc, tay che chuôi, alpha cứng, không cắt mép',composites:observations.length,needsAnchorReview:failed,artApproval:false}));
assert.equal(failed.length,0,'Có điểm nắm/lớp tay cần căn lại; chưa được dùng trong game');
