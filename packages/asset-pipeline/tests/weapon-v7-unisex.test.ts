// Kiểm cổ áo kín che đúng cổ, không ăn cằm; đầu nguyên bản dùng trên cùng thân thon.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {readPng,getPixel,createImage,blit,opaqueBounds} from '../src/image/rgba.js';
const root=resolve(import.meta.dirname,'../../..'),base=join(root,'packages/asset-pipeline/sources/player-standard-v7'),folder=join(base,'unisex-sword-v1'),body=readPng(join(folder,'body-S.png')),collar=readPng(join(folder,'collar-front-S.png')),m=JSON.parse(readFileSync(join(folder,'registration.json'),'utf8'));
assert.equal(m.coveredSkin,true);assert.equal(m.registration.perFrameFit,false);assert.deepEqual(m.root,[144,256]);assert.equal(m.ppu,96);assert.equal(m.productionEnabled,false);assert.ok(opaqueBounds(body)!.y1<=257);
for(const id of ['navy','chestnut']){const head=readPng(join(base,'head-prototype','avatar-'+id+'-S.png')),expected=createImage(288,288),actual=readPng(join(folder,'assembled-'+id+'-S.png'));blit(expected,body,0,0);blit(expected,head,112,100);blit(expected,collar,0,0);assert.deepEqual(actual.data,expected.data);
for(let y=150;y<=156;y++)for(let x=143;x<=145;x++){assert.equal(getPixel(collar,x,y)[3],255,'Hở cổ dưới đầu');assert.deepEqual(getPixel(actual,x,y),getPixel(collar,x,y),'Cổ da avatar đè lên cổ áo');}
for(let x=141;x<=147;x++)if(getPixel(head,x-112,49)[3])assert.deepEqual(getPixel(actual,x,149),getPixel(head,x-112,49),'Cổ áo che cằm');
for(let i=3;i<actual.data.length;i+=4)assert.ok(actual.data[i]===0||actual.data[i]===255,'Alpha mềm làm nhòe');
}
// So bề ngang vai/tay trên cùng hàng, cùng mật độ; chưa dùng kiểm hình học làm duyệt mỹ thuật.
const old=readPng(join(base,'head-prototype/body-starter-S.png'));
const widthAt=(im:typeof body,y:number)=>{const xs=[];for(let x=112;x<183;x++)if(getPixel(im,x,y)[3])xs.push(x);return xs.at(-1)!-xs[0]!+1;};assert.ok(widthAt(body,176)<widthAt(old,176),'Thân chưa thon hơn');
console.log('PASS unisex: thân thon, hai đầu giữ nguyên, cổ áo kín che cổ/không che cằm, cùng root/PPU/alpha cứng. Mỹ thuật/chuyển động vẫn đang rà.');
