// Chỉ xuất bốn tư thế nguồn; không gọi bốn key pose là animation hoàn chỉnh.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {readPng,writePng,createImage,getPixel,setPixel,blit,scaleNearest,opaqueBounds} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),base=join(root,'packages/asset-pipeline/sources/player-rig-v2'),stage=join(root,'.aether-stage/player-rig-v2');
const config={male:{center:245,neck:484,sole:805,scale:102/321,heads:[[245,484],[690,484],[1113,489],[1538,491]],crown:[350,350,366,366],genderHead:'human-m03'},female:{center:228,neck:499,sole:805,scale:102/306,heads:[[228,499],[685,499],[1105,499],[1555,500]],crown:[385,385,385,390],genderHead:'human-f01'}};
const names=['stand','walk-contact','attack-overhead','attack-impact'],records=[];
for(const gender of ['male','female']as const){
 const p=config[gender],folder=join(base,'body-'+gender),raw=readPng(join(folder,'pilot-source-r2.png')),board=createImage(288*4,288),frames=[];
 for(let i=0;i<4;i++){
  const [sx,sy]=p.heads[i]!,im=createImage(288,288),body=createImage(288,288),fore=createImage(288,288),collar=createImage(288,288),yshift=Math.round((sy!-p.neck)*p.scale),offset=[0,yshift],headTop=Math.round(154+(p.crown[i]!-p.neck)*p.scale);
  // Cùng scale nguồn cho cả4 tư thế, chỉ căn x theo tâm cổ và giữ y cùng hàng/root.
  for(let y=0;y<288;y++)for(let x=0;x<288;x++){
   const rx=Math.round(sx!+(x-144)/p.scale);if(rx<Math.round(i*raw.width/4)||rx>=Math.round((i+1)*raw.width/4))continue;
   const c=getPixel(raw,rx,Math.round(p.neck+(y-154)/p.scale));
   if(c[3]>=235)setPixel(im,x,y,[c[0],c[1],c[2],255]);
  }
  // Tách đúng vùng đầu nguồn. Ngoài polygon giữ nguyên tay/vũ khí, không cắt vuông qua hai cánh tay.
  const top=headTop-2,bottom=154+yshift;
  for(let y=0;y<288;y++)for(let x=0;x<288;x++){
   const c=getPixel(im,x,y);if(!c[3])continue;
   const t=(y-top)/(bottom-top),half=t<.68?25:25-(t-.68)/.32*12;
   const headRegion=y>=top&&y<=bottom&&Math.abs(x-144)<=half;
   if(!headRegion)setPixel(body,x,y,c);
   if(!headRegion&&y<bottom-1)setPixel(fore,x,y,c);
   if(y>=bottom-4&&y<=bottom+13&&x>=120&&x<=168&&!headRegion)setPixel(collar,x,y,c);
  }
  const assembled=createImage(288,288),head=readPng(join(root,'assets/characters/player-heads-v1',p.genderHead,'S.png'));
  blit(assembled,body,0,0);blit(assembled,head,104,92+yshift+(gender==='male'?-1:0));blit(assembled,fore,0,0);blit(assembled,collar,0,0);
  const name=names[i]!;writePng(join(folder,name+'-full.png'),im);writePng(join(folder,name+'-body.png'),body);writePng(join(folder,name+'-front.png'),fore);writePng(join(folder,name+'-collar.png'),collar);writePng(join(folder,name+'-assembled.png'),assembled);blit(board,assembled,i*288,0);
  frames.push({id:name,sourceSlot:i,sourceNeck:[sx,sy],headOffset:offset,neck:[144,154+yshift],root:[144,256],sourceBounds:opaqueBounds(im),layerOrder:['body','head','front','collar'],weaponSeparated:false,productionEnabled:false});
 }
 writePng(join(stage,gender+'-keyposes-2x.png'),board);const m={version:2,gender,status:'four-keyposes-not-full-animation',source:'pilot-source-r2.png',canvas:[288,288],ppu:96,sourceScale:p.scale,perFrameScale:false,directions:['S'],frames,artApproved:false};writeFileSync(join(folder,'keyposes.json'),JSON.stringify(m,null,2));records.push(m);
}
writeFileSync(join(base,'keypose-manifest.json'),JSON.stringify({status:'S-keypose-fit-review',maleAndFemaleSeparate:true,completeAnimation:false,attackTargetFrames:15,directionTarget:8,records},null,2));
console.log('Hai thân×4 tư thế S, cùng scale trong mỗi họ; chưa là bộ8 hướng/15 frame.');
