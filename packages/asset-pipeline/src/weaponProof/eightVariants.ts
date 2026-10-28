// Vũ khí mới từ ảnh riêng: giữ nguyên thân/tóc/tay, chỉ chiếu kiếm vào trục cầm từng pose.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng,writePng,createImage,getPixel,setPixel,blit,crop,scaleNearest} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),stage=join(root,'.aether-stage/attack-eight-v6'),source=join(root,'packages/asset-pipeline/sources/player-weapon-proof-v2/attack-eight-v6'),folder=join(source,'sword-variants');
const m=JSON.parse(readFileSync(join(stage,'manifest.json'),'utf8')),w=JSON.parse(readFileSync(join(stage,'weapon-manifest.json'),'utf8')),poses=JSON.parse(readFileSync(join(source,'pose-candidates.json'),'utf8'));
const configs=[{id:'lam-ngoc',name:'Lam Ngọc',tip:82,base:1000},{id:'hac-diem',name:'Hắc Diệm',tip:70,base:1004}],records=[];
w.variants=['steel',...configs.map(v=>v.id)];w.variantLabels={steel:'Kiếm thép',...Object.fromEntries(configs.map(v=>[v.id,v.name]))};
w.files=w.files.filter((s:string)=>!s.startsWith('weapon/lam-ngoc/')&&!s.startsWith('weapon/hac-diem/')&&!s.startsWith('weapon-back/lam-ngoc/')&&!s.startsWith('weapon-back/hac-diem/'));
for(const cfg of configs){
 const raw=readPng(join(folder,cfg.id+'-source.png')),canonical=createImage(64,128),scale=72/(cfg.base-cfg.tip);
 for(let y=0;y<128;y++)for(let x=0;x<64;x++){
  const c=getPixel(raw,Math.round(512+(x-32)/scale),Math.round(cfg.base+(y-82)/scale));
  if(c[3]>=235)setPixel(canonical,x,y,[c[0],c[1],c[2],255]);
 }
 writePng(join(folder,cfg.id+'-native.png'),canonical);writePng(join(stage,cfg.id+'-native-4x.png'),scaleNearest(canonical,4));
 for(const f of m.frames){
  const p=poses.find((p:{id:string})=>p.id===f.id);if(p.missing)throw Error('Thiếu trục cầm '+f.id);
  const body=readPng(join(stage,'body',f.id+'.png')),hands=readPng(join(stage,'hands',f.id+'.png')),oldWeapon=readPng(join(stage,'weapon/steel',f.id+'.png'));
  const back=createImage(288,288),front=createImage(288,288),unit=p.axis,normal=[-unit[1],unit[0]];
  const projected=Math.hypot(p.tip[0]-p.grip[0],p.tip[1]-p.grip[1])-10,projection=Math.min(72,Math.max(12,projected))*.98/72;
  const partial=['NE','NW'].includes(f.direction)&&f.index>=6&&f.index<=9;
  let clipped=0,visiblePixels=0;
  for(let y=-40;y<328;y++)for(let x=-40;x<328;x++){
   const dx=x-p.grip[0],dy=y-p.grip[1],t=dx*unit[0]+dy*unit[1],n=dx*normal[0]+dy*normal[1];
   const canonicalT=t>=10?10+(t-10)/projection:t;
   const c=getPixel(canonical,Math.round(32+n),Math.round(92-canonicalT));if(!c[3])continue;
   if(x<0||y<0||x>=288||y>=288){clipped++;continue;}
   setPixel(back,x,y,c);
   // Toàn bộ cán sau tay; phía sau lưng dùng silhouette thân để che như kiếm gốc.
   const hiddenByRearBody=partial&&getPixel(body,x,y)[3]&&!getPixel(oldWeapon,x,y)[3];
   if(!p.behindBody&&t>=5&&!hiddenByRearBody){setPixel(front,x,y,c);visiblePixels++;}
  }
  if(clipped)throw Error(cfg.id+'/'+f.id+': kiếm ra ngoài canvas '+clipped);
  const full=createImage(288,288);for(const im of [back,body,front,hands])blit(full,im,0,0);
  for(const [part,im]of [['weapon-back',back],['weapon',front]] as const){const path=part+'/'+cfg.id+'/'+f.id+'.png';writePng(join(stage,path),im);w.files.push(path);}
  writePng(join(stage,'composite',cfg.id,f.id+'.png'),full);
  records.push({id:f.id,weapon:cfg.id,grip:p.grip,axis:p.axis,projection,behindBody:p.behindBody,partialRear:partial,clippedPixels:clipped,frontPixels:visiblePixels,bodyChanged:false,handsChanged:false});
 }
}
writeFileSync(join(stage,'weapon-manifest.json'),JSON.stringify(w,null,2));
const provenance={tool:'built-in image_gen',canvas:[64,128],grip:[32,92],bladeBase:[32,82],tip:[32,10],ppu:96,sampling:'nearest, alpha>=235',bodyRedrawn:false,artApproved:false,assets:configs.map(c=>({...c,sourceSha256:createHash('sha256').update(readFileSync(join(folder,c.id+'-source.png'))).digest('hex')})),frames:records};
writeFileSync(join(folder,'registration.json'),JSON.stringify(provenance,null,2));
for(const dir of m.directions){const board=createImage(288*4,288*3);for(let i=0;i<12;i++)blit(board,readPng(join(stage,'composite',i%2?'lam-ngoc':'hac-diem',`attack-${dir}-${i}.png`)),i%4*288,Math.floor(i/4)*288);writePng(join(stage,dir+'-variants.png'),board);}
const comparison=createImage(288*3,288*3);
for(const [r,id]of ['steel','lam-ngoc','hac-diem'].entries())for(const [c,pose]of ['attack-S-0','attack-S-3','attack-E-7'].entries())blit(comparison,readPng(join(stage,'composite',id,pose+'.png')),c*288,r*288);
writePng(join(stage,'three-swords-comparison.png'),comparison);
console.log(JSON.stringify({weapons:w.variants,newWeaponFrames:records.length,bodyChanged:false,handsChanged:false,clipped:records.filter(r=>r.clippedPixels).length}));
