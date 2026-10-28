// Cả đứng/di chuyển/chém lấy từ MỘT nguồn, một tỷ lệ và một bảng màu.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {readPng,writePng,createImage,getPixel,setPixel,blit,scaleNearest,type RGBA} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),folder=join(root,'packages/asset-pipeline/sources/player-weapon-proof-v2/family-r4');
const raw=readPng(join(folder,'source.png')),scale=1/3;
const centers=[190,429,666,901,1136,1373],floors=[256,512,762,1007];
// Tách đối tượng theo alpha thay vì cắt cứng ô: mũi kiếm dài có thể vượt đường chia cột.
const labels=new Int32Array(raw.width*raw.height),components:{label:number;count:number;x0:number;y0:number;x1:number;y1:number}[]=[];
for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++){const pos=y*raw.width+x;if(labels[pos]||getPixel(raw,x,y)[3]<235)continue;const c={label:components.length+1,count:0,x0:x,y0:y,x1:x,y1:y},todo=[pos];labels[pos]=c.label;while(todo.length){const p=todo.pop()!,px=p%raw.width,py=Math.floor(p/raw.width);c.count++;c.x0=Math.min(c.x0,px);c.x1=Math.max(c.x1,px);c.y0=Math.min(c.y0,py);c.y1=Math.max(c.y1,py);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=px+dx,ny=py+dy;if(nx<0||ny<0||nx>=raw.width||ny>=raw.height)continue;const np=ny*raw.width+nx;if(!labels[np]&&getPixel(raw,nx,ny)[3]>=235){labels[np]=c.label;todo.push(np);}}}components.push(c);}
const master=readPng(join(root,'apps/server/site/media/roster/player_verdant_sword/S.png')),palette:RGBA[]=[],seen=new Set<string>();
for(let i=0;i<master.data.length;i+=4)if(master.data[i+3]){const c=[master.data[i]!,master.data[i+1]!,master.data[i+2]!,255] as const,k=c.join(',');if(!seen.has(k)){seen.add(k);palette.push(c);}}
const cache=new Map<string,RGBA>();function color(c:RGBA):RGBA{const key=c.slice(0,3).join(',');let v=cache.get(key);if(v)return v;let best=Infinity;v=palette[0]!;for(const p of palette){const d=2*(c[0]-p[0])**2+3*(c[1]-p[1])**2+(c[2]-p[2])**2;if(d<best){best=d;v=p;}}cache.set(key,v);return v;}
const sheet=createImage(144*6,144*4),frames=[],native=[];
for(let i=0;i<24;i++){const col=i%6,row=Math.floor(i/6),img=createImage(144,144),id=i<4?'idle-S-'+i:i<12?'walk-S-'+(i-4):'attack-S-'+(i-12),rx=centers[col]!,floor=floors[row]!,main=components.filter(c=>c.count>1000&&Math.abs((c.x0+c.x1)/2-rx)<110&&c.y1<=floor+4&&c.y0>=row*256-4).sort((a,b)=>b.count-a.count)[0];if(!main)throw Error('Thiếu silhouette '+id);const allowed=new Set(components.filter(c=>c.label===main.label||(c.count<=20&&c.x0>=main.x0-2&&c.x1<=main.x1+2&&c.y0>=main.y0-2&&c.y1<=main.y1+2)).map(c=>c.label));
 for(let y=0;y<144;y++)for(let x=0;x<144;x++){const sx=Math.floor((x-72+.5)/scale+rx),sy=Math.floor((y-128+.5)/scale+floor);if(sx<0||sx>=raw.width||sy<0||sy>=raw.height||!allowed.has(labels[sy*raw.width+sx]!))continue;const c=getPixel(raw,sx,sy);if(c[3]>=235)setPixel(img,x,y,color(c));}
 // Nhát chém trở về chính tư thế đứng của CÙNG bộ nguồn.
 if([12,22,23].includes(i))img.data.set(native[i===22?1:0]!.data);native.push(img);
 writePng(join(folder,'native',id+'.png'),img);blit(sheet,img,col*144,row*144);frames.push({id,sourceIndex:i,root:[centers[col],floors[row]],sha256:createHash('sha256').update(img.data).digest('hex')});}
writePng(join(folder,'native-sheet-2x.png'),scaleNearest(sheet,2));
writeFileSync(join(folder,'registration.json'),JSON.stringify({id:'family-r4',source:'source.png',sourceSha256:createHash('sha256').update(readFileSync(join(folder,'source.png'))).digest('hex'),frameSize:[144,144],root:[72,128],scale,perFrameScale:false,perActionScale:false,filter:'nearest',paletteSource:'locked-idle-S',alphaThreshold:235,columns:6,rows:4,userApproved:false,frames},null,2));
console.log(JSON.stringify({frames:24,scale,perActionScale:false,source:folder}));
