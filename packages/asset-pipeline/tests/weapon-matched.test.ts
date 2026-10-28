// Chặn lỗi đã thấy: đổi người/tóc, trượt chuôi, đổi hướng lưỡi hoặc che ngón tay.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {out,source,original} from '../src/weaponProof/reference.js';
import {readPng,createImage,blit,getPixel} from '../src/image/rgba.js';
const m=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8'));
const guardRegions=JSON.parse(readFileSync(join(source,m.motionFamily?'family-r4/guard-regions.json':'attack-r3/guard-regions.json'),'utf8')).regions;
assert.equal(m.version,2);assert.equal(m.productionEnabled,false);assert.equal(m.hairSeparated,false);
assert.equal(m.normalization.filter,m.motionFamily?'nearest-native-family':'none-native-original');assert.equal(m.normalization.perFrameScale,false);
assert.equal(m.frames.length,m.motionFamily?24:28);
let comparable=0,changedWeapons=0,occludedGripPixels=0;
for(const f of m.frames){const ref=original(f.id),body=readPng(join(out,'body',f.id+'.png')),hand=readPng(join(out,'hands',f.id+'.png')),remove=readPng(join(out,'removal',f.id+'.png'));
 for(const name of ['steel','iron']){const weapon=readPng(join(out,'weapon',name,f.id+'.png')),saved=readPng(join(out,'composite',name,f.id+'.png')),composed=createImage(144,144);blit(composed,body,0,0);blit(composed,weapon,0,0);blit(composed,hand,0,0);assert.deepEqual(composed.data,saved.data,f.id+': ảnh lưu khác các lớp độc lập');let changed=0;
  for(let y=0;y<144;y++)for(let x=0;x<144;x++){const r=getPixel(ref,x,y),b=getPixel(body,x,y),c=getPixel(saved,x,y),h=getPixel(hand,x,y),w=getPixel(weapon,x,y),mask=getPixel(remove,x,y)[3];
   if(!mask)assert.deepEqual(b,r,f.id+': sửa thân/tóc ngoài vùng vũ khí');
   const region=guardRegions[f.id],annotatedGold=region&&x>=region[0]&&y>=region[1]&&x<=region[2]&&y<=region[3]&&r[2]<r[1]*.65;
   if(r[3]&&r[0]>150&&r[1]>95&&r[2]>65&&r[2]/r[1]>.48&&r[0]>r[1]*1.1&&!annotatedGold){assert.equal(mask,0,f.id+': lấy nhầm da/ngón tay vào lớp kiếm');assert.deepEqual(b,r,f.id+': sửa nhầm da/ngón tay');}
   if(r[3]&&!mask)assert.deepEqual(c,r,f.id+': vũ khí thay thế đè sai lên người gốc');
   if(h[3]){assert.deepEqual(h,r,f.id+': lớp tay bị biến dạng');assert.deepEqual(c,h,f.id+': chuôi đè lên ngón tay');if(w[3])occludedGripPixels++;}
   if(c.some((v,i)=>v!==r[i]))changed++;
  }
  if(name==='steel'){assert.deepEqual(saved.data,ref.data,f.id+': ghép lại không bằng bản vẽ liền');comparable++;}else if(!f.hidden){assert(changed>=8,f.id+': chưa thay lưỡi kiếm thật');changedWeapons++;}
 }
 if(f.id.startsWith('walk-E')){assert(f.axis[0]>.6,f.id+': lưỡi không hướng ra trước');assert(f.tip[0]>f.grip[0],f.id+': đảo chuôi/lưỡi');}
}
assert(occludedGripPixels>100,'Thiếu chuôi thực nằm dưới lớp tay');
const report={checkedAt:new Date().toISOString(),sourceExactFrames:comparable,changedBlades:changedWeapons,occludedGripPixels,bodyAndHairOutsideRemovalUnchanged:true,productionEnabled:false,artApproved:false};writeFileSync(join(out,'matched-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
