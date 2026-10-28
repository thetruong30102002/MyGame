// Kiểm chéo đứng/đi/chém; không lấy ảnh chém lỗi làm chuẩn của chính nó.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {source,out,original,legacyOriginal} from '../src/weaponProof/reference.js';
import {getPixel,type RGBAImage} from '../src/image/rgba.js';
const reg=JSON.parse(readFileSync(join(source,'family-r4/registration.json'),'utf8'));
assert.equal(reg.frames.length,24);assert.equal(reg.perActionScale,false);assert.equal(reg.perFrameScale,false);assert.equal(reg.filter,'nearest');assert.equal(reg.scale,1/3);assert.deepEqual(reg.root,[72,128]);
assert.equal(createHash('sha256').update(readFileSync(join(source,'family-r4/source.png'))).digest('hex'),reg.sourceSha256);
const palette=new Set<string>(),locked=legacyOriginal('idle-S');for(let i=0;i<locked.data.length;i+=4)if(locked.data[i+3])palette.add(locked.data.slice(i,i+3).join(','));
function hairBox(im:RGBAImage){const points:number[][]=[];for(let y=45;y<87;y++)for(let x=20;x<124;x++){const[r,g,b,a]=getPixel(im,x,y);if(a&&r<95&&b>r*1.12&&b>g*1.02)points.push([x,y]);}assert(points.length>20);const top=Math.min(...points.map(p=>p[1]!)),hair=points.filter(p=>p[1]!<=top+16);return{top,width:Math.max(...hair.map(p=>p[0]!))-Math.min(...hair.map(p=>p[0]!))+1};}
const idle=original('idle-S-0'),head=hairBox(idle),measures=[];
// Kiếm/tay che đầu ở ba frame lấy đà: không đo đầu bằng mảng tóc đang bị che.
const occluded=new Set(['attack-S-2','attack-S-3','attack-S-4']);
for(const frame of reg.frames){const im=original(frame.id);assert.equal(im.width,144);assert.equal(im.height,144);assert.equal(createHash('sha256').update(im.data).digest('hex'),frame.sha256);
 for(let n=0;n<im.data.length;n+=4){const a=im.data[n+3];assert(a===0||a===255,frame.id+': alpha bị làm mềm');if(a)assert(palette.has(im.data.slice(n,n+3).join(',')),frame.id+': màu nội suy ngoài palette chuẩn');}
 if(!occluded.has(frame.id)){const h=hairBox(im);assert(h.width<=head.width+3,frame.id+': đầu phình hơn mẫu đứng');assert(h.top>=head.top-2,frame.id+': thân cao lên');assert(h.top<=head.top+9,frame.id+': đầu bị lún');measures.push({id:frame.id,...h});}}
assert.deepEqual(original('attack-S-0').data,idle.data);assert.deepEqual(original('attack-S-11').data,idle.data);assert.deepEqual(original('attack-S-10').data,original('idle-S-1').data);
const report={checkedAt:new Date().toISOString(),frames:24,actions:{idle:4,walk:8,attack:12},singleSource:true,singleScale:reg.scale,hardAlpha:true,lockedPalette:true,standingHead:head,measures,artApproval:'pending; kiểm pixel không thay thế nghiệm thu hình',productionEnabled:false};
writeFileSync(join(out,'family-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
