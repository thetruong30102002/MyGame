// Tách kiếm gốc theo pixel nguồn; chỉ tô bù trong vùng vũ khí bằng ảnh inpaint.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng,writePng,getPixel,setPixel,createImage,blit,type RGBAImage} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),folder=join(root,'packages/asset-pipeline/sources/player-weapon-proof-v2/attack-eight-v6'),stage=join(root,'.aether-stage/attack-eight-v6'),m=JSON.parse(readFileSync(join(stage,'manifest.json'),'utf8')),poses=JSON.parse(readFileSync(join(folder,'pose-candidates.json'),'utf8')),N=288;
const fills=new Map<string,RGBAImage>(),files:string[]=[],report=[];
const gold=(r:number,g:number,b:number)=>r>120&&g>75&&r>g*1.04&&b<g*.65;
const neutral=(r:number,g:number,b:number)=>{const hi=Math.max(r,g,b),lo=Math.min(r,g,b);return hi-lo<hi*.24||(hi<75&&hi-lo<30);};
for(const f of m.frames){const fillPath=join(folder,'inpaint',f.direction+'.png');if(!existsSync(fillPath))continue;let fill=fills.get(f.direction);if(!fill){fill=readPng(fillPath);fills.set(f.direction,fill);}const ref=readPng(join(stage,'native',f.id+'.png')),p=poses.find((p:{id:string})=>p.id===f.id);if(!p)throw Error('Thiếu gợi ý pose '+f.id);const body=createImage(N,N),weapon=createImage(N,N),back=createImage(N,N),hands=createImage(N,N),mask=new Uint8Array(N*N);let removed=0,repaired=0;
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const c=getPixel(ref,x,y);if(!c[3])continue;let take=false;if(!p.missing){const dx=x-p.bladeStart[0],dy=y-p.bladeStart[1],t=dx*p.axis[0]+dy*p.axis[1],n=-dx*p.axis[1]+dy*p.axis[0],blade=t>=-1.5&&t<=p.length+2&&Math.abs(n)<=5.2&&(!p.bladeHiddenInterval||t<p.bladeHiddenInterval[0]||t>p.bladeHiddenInterval[1])&&neutral(c[0],c[1],c[2]),hilt=((t>=-5&&t<=4&&Math.abs(n)<=12)||(t>=-28&&t<=-16&&Math.abs(n)<=3))&&gold(c[0],c[1],c[2]);take=blade||hilt;}if(take){mask[y*N+x]=1;setPixel(weapon,x,y,c);removed++;}else setPixel(body,x,y,c);}
 // Không dùng ảnh sinh mới để thay cả đầu/thân; chỉ đọc vùng sau kiếm vừa tách.
 const fi=f.index>=10?0:f.index===4?3:f.index;
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!mask[y*N+x])continue;let near=0;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(getPixel(body,x+dx,y+dy)[3])near++;const c=getPixel(fill,Math.floor((fi%4+(x+.5)/N)*fill.width/4),Math.floor((Math.floor(fi/4)+(y+.5)/N)*fill.height/3));if(near>=10&&c[3]>=235){setPixel(body,x,y,[c[0],c[1],c[2],255]);repaired++;}}
 if(!p.missing&&!p.behindBody){for(let y=p.grip[1]-12;y<=p.grip[1]+12;y++)for(let x=p.grip[0]-12;x<=p.grip[0]+12;x++){if(x<0||y<0||x>=N||y>=N||mask[y*N+x])continue;const c=getPixel(ref,x,y);if(c[3])setPixel(hands,x,y,c);}
 // Cán đầy đủ ở sau ngón tay: dùng chính màu da thuộc từ nguồn, không xoay/cắt ngón.
 let leather=getPixel(ref,p.grip[0],p.grip[1]);if(!leather[3]||leather[0]<leather[1])leather=[74,44,25,255];for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(!getPixel(body,x,y)[3])continue;const dx=x-p.grip[0],dy=y-p.grip[1],t=dx*p.axis[0]+dy*p.axis[1],n=-dx*p.axis[1]+dy*p.axis[0];if(t>=-12&&t<=8&&Math.abs(n)<=1.2)setPixel(back,x,y,leather);}}
 const full=createImage(N,N);for(const im of [back,body,weapon,hands])blit(full,im,0,0);let mismatch=0;for(let i=0;i<ref.data.length;i++)if(ref.data[i]!==full.data[i])mismatch++;if(mismatch)throw Error(f.id+': tách/ghép sai '+mismatch+' kênh');
 for(const[part,img]of [['body',body],['weapon/steel',weapon],['weapon-back/steel',back],['hands',hands],['composite/steel',full]] as const){const path=part+'/'+f.id+'.png';writePng(join(stage,path),img);if(part!=='composite/steel')files.push(path);}
 const removal=createImage(N,N);for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(mask[y*N+x])setPixel(removal,x,y,[255,255,255,255]);writePng(join(stage,'removal',f.id+'.png'),removal);
 report.push({id:f.id,removedPixels:removed,repairedPixels:repaired,referenceMismatchChannels:mismatch,bodySha256:createHash('sha256').update(body.data).digest('hex'),grip:p.grip||null,axis:p.axis||null,behindBody:p.behindBody,poseReviewed:false});
}
const result={version:6,status:'candidate-not-approved',variants:['steel'],frames:report,files,hairSeparated:false,bodyCount:report.length,handOcclusion:true,sourceReassemblyExact:report.length,poseReviewComplete:false,userApproved:false,productionEnabled:false};writeFileSync(join(stage,'weapon-manifest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({splitFrames:report.length,expected:96,sourceExact:report.length,poseReviewComplete:false}));
