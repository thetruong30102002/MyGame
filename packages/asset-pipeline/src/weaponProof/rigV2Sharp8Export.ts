// Hai mẫu nét8 hướng, giữ scale vật lý bản cũ; không thay roster hoặc30 đầu đã chốt.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {readPng,writePng,createImage,getPixel,setPixel,blit,crop,scaleNearest,opaqueBounds} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),base=join(root,'packages/asset-pipeline/sources/player-rig-v2/heads-clarity'),stage=join(root,'.aether-stage/player-rig-v2'),dirs=['S','SW','W','NW','N','NE','E','SE'],records=[];
for(const [g,id]of [['male','human-m03'],['female','human-f01']]){
 const raw=readPng(join(base,g+'-eight-source.png')),old=JSON.parse(readFileSync(join(root,'assets/characters/player-heads-v1',id!,'registration.json'),'utf8')),folder=join(base,id!),contact=createImage(320,160),compare=createImage(640,160),regs=[];mkdirSync(folder,{recursive:true});
 // Giữ nguyên hệ số S cũ cho cả8 hướng. Đăng ký vị trí từ cổ mới, không fit theo tóc.
 const scale=old.scale;
 for(let i=0;i<8;i++){
  const x0=Math.floor(i%4*raw.width/4),y0=Math.floor(Math.floor(i/4)*raw.height/2),tile=crop(raw,x0,y0,Math.floor((i%4+1)*raw.width/4)-x0,Math.floor((Math.floor(i/4)+1)*raw.height/2)-y0),im=createImage(80,80);let by=-1,xs:number[]=[];
  for(let y=tile.height-1;y>=0;y--){const found=[];for(let x=0;x<tile.width;x++){const[r,gg,b,a]=getPixel(tile,x,y);if(a>=235&&r>140&&r>gg+18&&gg>b+10)found.push(x);}if(found.length>15){by=y;xs=found;break;}}
  if(by<0)throw Error('Không thấy cổ '+id+'/'+dirs[i]);const nx=(Math.min(...xs)+Math.max(...xs))/2,ny=by-2/scale;
  for(let y=0;y<80;y++)for(let x=0;x<80;x++){const c=getPixel(tile,Math.round(nx+(x-40)/scale),Math.round(ny+(y-62)/scale));if(c[3]>=235)setPixel(im,x,y,[c[0],c[1],c[2],255]);}
  const d=dirs[i]!;writePng(join(folder,d+'.png'),im);blit(contact,im,i%4*80,Math.floor(i/4)*80);blit(compare,readPng(join(root,'assets/characters/player-heads-v1',id!,d+'.png')),i%4*80,Math.floor(i/4)*80);blit(compare,im,320+i%4*80,Math.floor(i/4)*80);regs.push({direction:d,sourceNeck:[nx,ny],scale,neckCovered:getPixel(im,40,62)[3]===255,bounds:opaqueBounds(im)});
 }
 writePng(join(folder,'eight-directions.png'),contact);writePng(join(stage,g+'-sharp8-comparison-2x.png'),scaleNearest(compare,2));const record={id,gender:g,source:g+'-eight-source.png',sourceSize:[raw.width,raw.height],headCanvas:[80,80],scale,perDirectionScale:false,ppu:96,productionEnabled:false,artApproved:false,registrations:regs};writeFileSync(join(folder,'registration.json'),JSON.stringify(record,null,2));records.push(record);
}
writeFileSync(join(base,'eight-manifest.json'),JSON.stringify({status:'two-sharp-head-candidates',heads:2,frames:16,completeThirty:false,records},null,2));console.log('Hai mẫu /16 hướng nét thử; chưa thay bộ30 đầu.');
