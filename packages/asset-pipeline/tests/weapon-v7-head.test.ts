// Kiểm hợp đồng ảnh: bắt mất pixel, đổi thân, lệch cổ khi thay nguyên đầu.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng,createImage,blit,opaqueBounds,getPixel} from '../src/image/rgba.js';
const root=resolve(import.meta.dirname,'../../..'),source=join(root,'packages/asset-pipeline/sources/player-standard-v7'),folder=join(source,'head-prototype');
const original=readPng(join(source,'master-S-native.png')),body=readPng(join(folder,'body-starter-S.png')),collar=readPng(join(folder,'collar-front-S.png')),navy=readPng(join(folder,'avatar-navy-S.png')),chestnut=readPng(join(folder,'avatar-chestnut-S.png')),rig=JSON.parse(readFileSync(join(folder,'rig.json'),'utf8')),swap=JSON.parse(readFileSync(join(folder,'swap-registration.json'),'utf8'));
const digest=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
assert.equal(digest(body.data),rig.bodySha256);assert.equal(swap.unchangedBodySha256,rig.bodySha256);
assert.deepEqual(rig.neckAnchorInFrame,[144,154]);assert.deepEqual(rig.neckAnchorInAsset,[32,54]);
assert.equal(swap.registration.perFrameFit,false);assert.equal(rig.productionEnabled,false);assert.equal(rig.artApproved,false);
const standard=JSON.parse(readFileSync(join(source,'head-standard.json'),'utf8'));assert.equal(standard.collarOwner,'outfit-body');assert.equal(rig.headContainsClothing,false);assert.equal(swap.headContainsClothing,false);
for(const h of [navy,chestnut]){assert.equal(h.width,64);assert.equal(h.height,64);const b=opaqueBounds(h)!;assert.ok(b.x0>=6&&b.x1<=60&&b.y0>=4&&b.y1<=58,'Đầu tràn thước đã khóa');assert.equal(getPixel(h,32,54)[3],255,'Hở neo cổ');for(let i=3;i<h.data.length;i+=4)assert.ok(h.data[i]===0||h.data[i]===255,'Alpha mềm gây nhòe');}
const reassemble=(head:typeof navy)=>{const im=createImage(288,288);blit(im,body,0,0);blit(im,head,112,100);blit(im,collar,0,0);return im;};
assert.deepEqual(reassemble(navy).data,original.data,'Ghép đầu gốc mất hoặc chồng pixel');
const changed=reassemble(chestnut);assert.deepEqual(changed.data,readPng(join(folder,'swapped-chestnut-S.png')).data);
let differences=0;for(let y=0;y<288;y++)for(let x=0;x<288;x++){const a=getPixel(original,x,y),b=getPixel(changed,x,y);if(a.some((v,i)=>v!==b[i])){differences++;assert.ok(x>=112&&x<176&&y>=100&&y<164,'Thay đầu làm đổi pixel ngoài vùng đầu');}if(getPixel(collar,x,y)[3])assert.deepEqual(b,getPixel(collar,x,y),'Cổ áo bị đầu đè');}
assert.ok(differences>100,'Chưa có avatar thay thế thật');
for(let y=100;y<144;y++)for(let x=110;x<178;x++)assert.equal(getPixel(body,x,y)[3],0,'Còn đầu/tóc cũ trong thân');
for(const h of [navy,chestnut]){
  for(const [x,y] of standard.facialLandmarks.eyeWhiteAnchors){const c=getPixel(h,x,y);assert.ok(c[0]>170&&c[1]>170&&c[2]>165,'Mốc mắt lệch');}
  for(const [row,span] of [[45,[24,41]],[49,[29,35]],[54,[31,33]]] as const){const xs=[];for(let x=0;x<64;x++){const[r,g,b,a]=getPixel(h,x,row);if(a&&r>160&&r>g+20&&g>b+20)xs.push(x);}assert.ok(xs.length);assert.ok(Math.abs(xs[0]!-span[0])<=1&&Math.abs(xs.at(-1)!-span[1])<=1,'Tỷ lệ má/cằm/cổ đổi');}
  for(let y=44;y<64;y++)for(let x=0;x<64;x++){const[r,g,b,a]=getPixel(h,x,y);assert.ok(!(a&&r<100&&g>=r+8&&g>=b+4),'Còn vải áo xanh trong cổ avatar');}
  assert.equal(getPixel(h,20,53)[3],0,'Cổ còn dính vải bên vai');assert.equal(getPixel(h,44,54)[3],0,'Cổ còn dính áo');
}
console.log('PASS V7: hai nguyên đầu64px, cùng mốc mắt/má/cằm/cổ, cổ da không dính áo, alpha cứng, ghép gốc trùng pixel, thân/cổ áo không đổi. Chưa chứng nhận mỹ thuật hoặc chuyển động.');
