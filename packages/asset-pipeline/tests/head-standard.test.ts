import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng,getPixel} from '../src/image/rgba.js';
import {HEAD_STANDARD as s,NORMALIZED_HEADS} from '../src/weaponProof/headStandard.js';
const root=resolve(import.meta.dirname,'../../..'),base=join(root,'packages/asset-pipeline/sources/player-rig-v3'),m=JSON.parse(readFileSync(join(base,'runtime-catalog.json'),'utf8')),report=JSON.parse(readFileSync(join(base,'head-normalization.json'),'utf8'));
assert.deepEqual(m.headStandard,s);assert.equal(report.heads.length,30);assert.equal(s.runtimeScale,1);assert.equal(s.perHeadRuntimeOffset,false);assert.equal(s.perHeadRuntimeScale,false);
assert.equal(s.lastVisibleRow-s.chin[1],s.bareNeckMaxPixels);assert.deepEqual(m.headOrigin,s.bodySocket.map((n:number,i:number)=>n-s.neck[i]));
const measurements=[];
for(const h of report.heads){
 const source=join(root,'packages/asset-pipeline/sources/player-heads-v1/heads',h.id,'source.png');assert.equal(createHash('sha256').update(readFileSync(source)).digest('hex'),h.sourceSha256);
 assert.equal(h.frames.length,8);assert.equal(new Set(h.frames.map((f:any)=>f.scale)).size,1);
 const metadata=m.heads.find((x:any)=>x.id===h.id);assert.equal(metadata.standardId,s.id);assert.equal(metadata.w,s.canvas[0]);assert.equal(metadata.h,s.canvas[1]);for(const field of ['dx','dy','scale'])assert.equal(field in metadata,false,'Cấm tham số đầu riêng trong runtime');
 for(const f of h.frames){const im=readPng(join(NORMALIZED_HEADS,h.id,f.direction+'.png'));assert.equal(im.width,s.canvas[0]);assert.equal(im.height,s.canvas[1]);for(let y=s.lastVisibleRow+1;y<im.height;y++)for(let x=0;x<im.width;x++)assert.equal(getPixel(im,x,y)[3],0,'Cổ vượt thước '+h.id);}
 // Đo trên pixel mặt đã xuất, không chỉ so sánh giá trị cấu hình.
 const im=readPng(join(NORMALIZED_HEADS,h.id,'S.png')),y=s.chin[1]+Math.round((h.sourceCheek[2]-h.sourceChin[1])*h.scale),runs:number[][]=[];let start=-1;
 const skin=(x:number)=>{const[r,g,b,a]=getPixel(im,x,y);return !!a&&(h.id.startsWith('demon')?r>90&&b>g+15&&r>g+5&&Math.abs(r-b)<100:r>140&&r>g+18&&g>b+10);};
 for(let x=s.chin[0]-22;x<=s.chin[0]+22;x++){const yes=skin(x);if(yes&&start<0)start=x;if(!yes&&start>=0){runs.push([start,x-1]);start=-1;}}
 const run=runs.filter(r=>r[0]<=s.chin[0]+2&&r[1]>=s.chin[0]-2).sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];assert.ok(run,'Không có khối mặt liên tục '+h.id);
 const width=run[1]-run[0]+1;measurements.push({id:h.id,width,axis:(run[0]+run[1])/2});
 assert.ok(Math.abs(width-s.cheekWidth)<=s.cheekWidthTolerance,`${h.id} má thực tế${width}px, chuẩn${s.cheekWidth}±${s.cheekWidthTolerance}`);
 assert.ok(Math.abs((run[0]+run[1])/2-s.chin[0])<=1,`${h.id} lệch trục mặt`);
}
console.log(JSON.stringify({status:'PASS',heads:30,directions:240,standard:s.id,actualPixelMeasurements:measurements}));
