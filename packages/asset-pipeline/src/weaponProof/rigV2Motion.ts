// Xuất pose nguồn thật, ghép đầu qua neo cổ; không co/phóng từng frame.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {readPng,writePng,createImage,getPixel,setPixel,blit,opaqueBounds,type RGBAImage} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),base=join(root,'packages/asset-pipeline/sources/player-rig-v2'),stage=join(root,'.aether-stage/player-rig-v2');
const cfg={male:{scale:102/321,neck:484,id:'human-m03'},female:{scale:102/306,neck:499,id:'human-f01'}};
const weapon:{[key:string]:number[][]}={
 'male/attack-0':[[],[650,570,490,403],[1055,470,929,250],[1557,402,1555,130]],
 'female/attack-0':[[],[655,550,500,350],[1075,474,940,245],[1550,380,1550,120]],
 'male/attack-1':[[206,357,205,150],[649,265,648,65],[1100,260,1100,52],[1554,348,1552,165]],
 'female/attack-1':[[220,382,220,165],[650,289,650,60],[1110,260,1110,35],[1550,365,1550,173]]};
function skin(c:readonly number[]){const[r,g,b,a]=c;return a!>=235&&r!>165&&g!>115&&b!>75&&r!>g!+20&&g!>b!+12;}
function face(im:RGBAImage,slot:number){const x0=Math.floor(slot*im.width/4),x1=Math.floor((slot+1)*im.width/4),pts:number[][]=[];for(let y=335;y<530;y++)for(let x=x0+90;x<x1-70;x++)if(skin(getPixel(im,x,y)))pts.push([x,y]);if(pts.length<100)throw Error('Thiếu mốc mặt ô'+slot);const ys=pts.map(p=>p[1]!).sort((a,b)=>a-b),xs=pts.map(p=>p[0]!).sort((a,b)=>a-b);return {cx:(xs[Math.floor(xs.length*.03)]!+xs[Math.floor(xs.length*.97)]!)/2,jaw:ys[Math.floor(ys.length*.992)]!};}
function distance(x:number,y:number,seg:number[]){if(!seg.length)return 999;const[a,b,c,d]=seg,dx=c!-a!,dy=d!-b!,t=Math.max(0,Math.min(1,((x-a!)*dx+(y-b!)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a!-t*dx,y-b!-t*dy);}
const manifests=[];
for(const g of ['male','female']as const){const p=cfg[g],folder=join(base,'body-'+g),out=join(folder,'motion');mkdirSync(out,{recursive:true});const baseline=face(readPng(join(folder,'pilot-source-r2.png')),0),records=[];
 for(const kind of ['walk','attack']as const){const count=kind==='walk'?8:15,board=createImage(288*8,288*Math.ceil(count/8));
  for(let n=0;n<count;n++){
   const group=Math.floor(n/4),slot=n%4,id=kind+'-'+String(n).padStart(2,'0'),raw=readPng(join(folder,kind+'-'+group+'-source.png'));if(raw.width!==1774||raw.height!==887)throw Error('Nguồn khác thước '+g+id);const f=face(raw,slot),headDy=Math.round((f.jaw-baseline.jaw)*p.scale),neckY=154+headDy,im=createImage(288,288),body=createImage(288,288),front=createImage(288,288),collar=createImage(288,288),seg=weapon[g+'/'+kind+'-'+group]?.[slot]||[];
   for(let y=0;y<288;y++)for(let x=0;x<288;x++){
    const rx=Math.round(f.cx+(x-144)/p.scale),ry=Math.round(p.neck+(y-154)/p.scale);if(rx<Math.floor(slot*raw.width/4)||rx>=Math.floor((slot+1)*raw.width/4))continue;const c=getPixel(raw,rx,ry);if(c[3]<235)continue;const hard=[c[0],c[1],c[2],255]as const;setPixel(im,x,y,hard);
    const t=(y-(neckY-58))/58,half=t<.77?31:31-(t-.77)/.23*17,inHead=y>=neckY-58&&y<neckY&&Math.abs(x-144)<=half;
    const warm=c[0]>c[1]+18&&c[1]>c[2]+15&&c[1]<170,cream=c[0]>185&&c[1]>170&&c[2]>110&&c[0]-c[1]<30;
    let arm=false;
    if(kind==='attack'&&n===2)arm=x<136&&y>neckY-25;
    if(kind==='attack'&&n===3)arm=Math.abs(x-144)<10&&y<neckY-4||Math.abs(x-144)>13&&y>neckY-25;
    if(kind==='attack'&&n>=4&&n<=7)arm=y<neckY-18||Math.abs(x-144)>18;
    const protect=distance(rx,ry,seg)<16||(arm&&(warm||cream));
    if(!inHead||protect)setPixel(body,x,y,hard);
    if((!inHead||protect)&&y<neckY)setPixel(front,x,y,hard);
    if(y>=neckY-2&&y<neckY+13&&x>120&&x<168&&!inHead)setPixel(collar,x,y,hard);
   }
   const assembled=createImage(288,288);blit(assembled,body,0,0);blit(assembled,readPng(join(root,'assets/characters/player-heads-v1',p.id,'S.png')),104,92+headDy+(g==='male'?-1:0));blit(assembled,front,0,0);blit(assembled,collar,0,0);
   for(const [layer,png]of Object.entries({full:im,body,front,collar,assembled}))writePng(join(out,id+'-'+layer+'.png'),png);blit(board,assembled,n%8*288,Math.floor(n/8)*288);
   records.push({id,action:kind,index:n,source:kind+'-'+group+'-source.png',slot,scale:p.scale,sourceFace:f,headOffset:[0,headDy],neck:[144,neckY],root:[144,256],durationMs:kind==='walk'?140:[110,95,90,85,75,70,110,40,25,30,45,65,70,75,100][n],bounds:opaqueBounds(im),headOcclusion:seg.length>0||kind==='attack'&&n>=2&&n<=7,layerMaskStatus:'candidate-needs-art-review'});
  }
  writePng(join(stage,g+'-'+kind+'-frames.png'),board);
 }
 const record={version:2,gender:g,sourceScale:p.scale,perFrameScale:false,canvas:[288,288],ppu:96,directions:['S'],walkFrames:8,attackFrames:15,completeEightDirections:false,productionEnabled:false,artApproved:false,weaponSeparated:false,frames:records};writeFileSync(join(out,'manifest.json'),JSON.stringify(record,null,2));manifests.push(record);
}
writeFileSync(join(base,'motion-manifest.json'),JSON.stringify({version:2,status:'S-motion-layer-candidates',genders:2,walkFramesPerGender:8,attackFramesPerGender:15,productionEnabled:false,artApproved:false,records:manifests},null,2));console.log('Đã xuất46 pose đi/chém S thật; lớp che là bản thử, chưa duyệt mỹ thuật.');
