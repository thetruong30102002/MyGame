import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {createImage,readPng,writePng,getPixel,setPixel,opaqueBounds,crop,type RGBAImage} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),base=join(root,'packages/asset-pipeline/sources/player-rig-v3');
export const HEAD_STANDARD=Object.freeze(JSON.parse(readFileSync(join(base,'head-standard.json'),'utf8')));
export const HEAD_ORIGIN=HEAD_STANDARD.bodySocket.map((n:number,i:number)=>n-HEAD_STANDARD.neck[i]);
export const NORMALIZED_HEADS=join(base,'normalized-heads');
function cleanDetachedNoise(im:RGBAImage){
 const seen=new Uint8Array(im.width*im.height),groups:number[][]=[];
 for(let i=3;i<im.data.length;i+=4)im.data[i]=im.data[i]!>=235?255:0;
 for(let p=0;p<seen.length;p++){if(seen[p]||!im.data[p*4+3])continue;const q=[p],g:number[]=[];seen[p]=1;
  while(q.length){const k=q.pop()!;g.push(k);const x=k%im.width,y=Math.floor(k/im.width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy,n=Y*im.width+X;if(X>=0&&Y>=0&&X<im.width&&Y<im.height&&!seen[n]&&im.data[n*4+3]){seen[n]=1;q.push(n);}}}groups.push(g);
 }
 const max=Math.max(...groups.map(g=>g.length));for(const g of groups)if(g.length<max*.002)for(const p of g)im.data.fill(0,p*4,p*4+4);return im;
}
export function exportStandardHeads(){
 const s=HEAD_STANDARD,source=join(root,'packages/asset-pipeline/sources/player-heads-v1'),catalog=JSON.parse(readFileSync(join(source,'catalog.json'),'utf8')),annotations=JSON.parse(readFileSync(join(base,'head-landmarks.json'),'utf8')).heads,report:any[]=[];
 if(Object.keys(annotations).length!==catalog.heads.length)throw Error('Phải có mốc đủ30 đầu');
 for(const h of catalog.heads){
  const path=join(source,'heads',h.id,'source.png'),raw=readPng(path),a=annotations[h.id];if(!a)throw Error('Thiếu mốc '+h.id);
  if(raw.width!==1774||raw.height!==887||createHash('sha256').update(readFileSync(path)).digest('hex')!==a.sourceSha256)throw Error('Nguồn đổi: phải annotate lại má/cằm, không dùng mốc cũ '+h.id);
  const old=JSON.parse(readFileSync(join(root,'assets/characters/player-heads-v1',h.id,'registration.json'),'utf8')),scale=s.cheekWidth/(a.cheek[1]-a.cheek[0]+1),frames=[];mkdirSync(join(NORMALIZED_HEADS,h.id),{recursive:true});
  for(const [i,direction]of catalog.directions.entries()){
   const x0=Math.floor(i%4*raw.width/4),y0=Math.floor(Math.floor(i/4)*raw.height/2),x1=Math.floor((i%4+1)*raw.width/4),y1=Math.floor((Math.floor(i/4)+1)*raw.height/2),tile=cleanDetachedNoise(crop(raw,x0,y0,x1-x0,y1-y0)),im=createImage(...s.canvas as [number,number]),anchor=i===0?a.chin:old.registrations[i].sourceNeck,target=i===0?s.chin:s.neck;
   for(let y=0;y<=s.lastVisibleRow;y++)for(let x=0;x<s.canvas[0];x++){
    const sx=Math.round(anchor[0]+(x-target[0])/scale),sy=Math.round(anchor[1]+(y-target[1])/scale);
    const c=getPixel(tile,sx,sy);if(c[3]>=235)setPixel(im,x,y,[c[0],c[1],c[2],255]);
   }
   const bounds=opaqueBounds(im);if(!bounds||bounds.x0===0||bounds.x1===s.canvas[0]||bounds.y0===0)throw Error('Đầu chạm mép/cắt tóc '+h.id+'/'+direction);
   writePng(join(NORMALIZED_HEADS,h.id,direction+'.png'),im);frames.push({direction,scale,sourceAnchor:anchor,targetAnchor:target,bounds,reviewed:direction==='S'});
  }
  report.push({id:h.id,standardId:s.id,sourceSha256:createHash('sha256').update(readFileSync(path)).digest('hex'),sourceCheek:a.cheek,sourceChin:a.chin,scale,scaleSharedAcrossDirections:true,runtimeScale:s.runtimeScale,runtimeOffset:[0,0],frames});
 }
 const result={standard:s,heads:report,normalization:'Một scale đều hai trục từ nguồn gốc/đầu, dùng chung8 hướng; bake vào PNG. Runtime không scale/offset riêng đầu.',artApproved:false};
 writeFileSync(join(base,'head-normalization.json'),JSON.stringify(result,null,2));return result;
}
