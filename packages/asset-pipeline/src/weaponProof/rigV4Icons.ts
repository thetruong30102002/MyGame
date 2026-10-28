import {readFileSync} from 'node:fs';import {resolve,join} from 'node:path';import {createImage,readPng,writePng,getPixel,setPixel,opaqueBounds} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),stage=join(root,'.aether-stage/player-rig-v4'),base=join(root,'packages/asset-pipeline/sources/player-rig-v4'),out=join(root,'assets/items');
for(const[tier,level]of [['sword-starter',1],['sword-lv5',5],['sword-lv10',10]]as const){
 for(const kind of ['outfit','blade']){const raw=readPng(kind==='outfit'?join(stage,'frames',tier,'male/S/idle/0-body.png'):join(base,'weapons',tier+'.png')),b=opaqueBounds(raw)!,im=createImage(48,48),scale=Math.min(42/(b.x1-b.x0),44/(b.y1-b.y0)),w=(b.x1-b.x0)*scale,h=(b.y1-b.y0)*scale,dx=(48-w)/2,dy=(48-h)/2;
  for(let y=0;y<48;y++)for(let x=0;x<48;x++){const c=getPixel(raw,Math.round(b.x0+(x-dx)/scale),Math.round(b.y0+(y-dy)/scale));if(c[3])setPixel(im,x,y,c);}writePng(join(out,'swordsman_'+kind+'_'+level+'.png'),im);
 }
}
console.log('Đã xuất6 icon kho đồ từ chính sprite đồ/kiếm mới.');
