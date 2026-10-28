// Đăng ký ảnh vẽ lại bằng một tỷ lệ chung; tuyệt đối không fit riêng từng frame.
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {root,out,source,original} from './reference.js';
import {readPng,writePng,createImage,getPixel,setPixel,blit,scaleNearest,type RGBA} from '../image/rgba.js';
const folder=join(source,'attack-r3'),sheet=readPng(join(folder,'source.png'));
// Lấy thân cao nhất làm mốc: khi gập gối chỉ được thấp xuống, không phình to.
const scale=75/239;
// Điểm gốc là giữa hai đế giày; nguồn AI không chia ô đều tuyệt đối.
const roots=[[190,359],[557,360],[920,360],[1304,360],[187,722],[558,722],[924,722],[1311,723],[190,1050],[558,1050],[924,1050],[1295,1050]];
const idle=original('idle-S'),palette:RGBA[]=[];
const seen=new Set<string>();for(let i=0;i<idle.data.length;i+=4){if(!idle.data[i+3])continue;const c=[idle.data[i]!,idle.data[i+1]!,idle.data[i+2]!,255] as const,key=c.join(',');if(!seen.has(key)){seen.add(key);palette.push(c);}}
const cache=new Map<string,RGBA>();
function color(c:RGBA):RGBA{const key=c.slice(0,3).join(',');let found=cache.get(key);if(found)return found;let best=Infinity;found=palette[0]!;for(const p of palette){const d=2*(c[0]-p[0])**2+3*(c[1]-p[1])**2+(c[2]-p[2])**2;if(d<best){best=d;found=p;}}cache.set(key,found);return found;}
const frames=[];const board=createImage(144*6,144*4),nativeSheet=createImage(576,432);
for(let i=0;i<12;i++){const img=i===0||i===11?original('idle-S'):createImage(144,144),[rx,ry]=roots[i]!;if(i!==0&&i!==11)for(let y=0;y<144;y++)for(let x=0;x<144;x++){const sx=Math.floor((x-72+.5)/scale+rx!),sy=Math.floor((y-128+.5)/scale+ry!),col=Math.floor(i%4*sheet.width/4),row=Math.floor(i/4)*sheet.height/3;if(sx<col||sx>=col+sheet.width/4||sy<row||sy>=row+sheet.height/3)continue;const c=getPixel(sheet,sx,sy);if(c[3]>=235)setPixel(img,x,y,color(c));}writePng(join(folder,'native','attack-S-'+i+'.png'),img);blit(nativeSheet,img,i%4*144,Math.floor(i/4)*144);blit(board,idle,i%6*144,Math.floor(i/6)*288);blit(board,img,i%6*144,Math.floor(i/6)*288+144);frames.push({id:'attack-S-'+i,root:roots[i],lockedIdleEndpoint:i===0||i===11,sha256:createHash('sha256').update(img.data).digest('hex')});}
writePng(join(folder,'native-sheet-2x.png'),scaleNearest(nativeSheet,2));
writePng(join(out,'attack-r3-idle-comparison-2x.png'),scaleNearest(board,2));
writeFileSync(join(folder,'registration.json'),JSON.stringify({source:'source.png',sourceSha256:createHash('sha256').update(readFileSync(join(folder,'source.png'))).digest('hex'),scale,perFrameScale:false,filter:'nearest',alphaThreshold:235,paletteSource:'idle-S',paletteColors:palette.length,frameSize:[144,144],root:[72,128],reviewed:false,frames},null,2));
console.log(JSON.stringify({scale,palette:palette.length,frames:frames.length,comparison:join(out,'attack-r3-idle-comparison-2x.png')}));
