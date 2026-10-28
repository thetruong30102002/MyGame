import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {readPng,createImage,crop,blit} from '../src/image/rgba.js';
const root=resolve(import.meta.dirname,'../../..'),out=join(root,'UnityGame/Assets/Aether/Resources/SwordTrialV6');
const m=JSON.parse(readFileSync(join(out,'catalog.json'),'utf8')),atlas=readPng(join(out,'atlas.png'));
assert.equal(m.labOnly,true);assert.equal(m.artApproved,false);assert.equal(m.ppu,96);assert.equal(m.durations.length,12);assert.deepEqual(m.variants,['steel','lam-ngoc','hac-diem']);
let checked=0;
for(const [variant,id]of m.variants.entries())for(const d of m.directions)for(let i=0;i<12;i++)for(const [part,path] of ['weapon-back/'+id,'body','weapon/'+id,'hands'].entries()){
 const shared=part===1||part===3;
 const e=m.entries.find((e:{direction:string;index:number;part:number;variant:number})=>e.direction===d&&e.index===i&&e.part===part&&e.variant===(shared?-1:variant)),made=createImage(288,288);
 if(e){assert(e.x>=2&&e.y>=2&&e.x+e.w<atlas.width&&e.y+e.h<atlas.height);blit(made,crop(atlas,e.x,e.y,e.w,e.h),e.ox,e.oy);}
 const source=readPng(join(root,'.aether-stage/attack-eight-v6',path,`attack-${d}-${i}.png`));
 assert.deepEqual(made.data,source.data,`${d}/${i}/${part}: atlas đổi lớp hoặc điểm neo`);checked++;
}
console.log(JSON.stringify({unityLayerFrames:checked,packedSprites:m.entries.length,atlas:[atlas.width,atlas.height],sourceExact:true,labOnly:true}));
