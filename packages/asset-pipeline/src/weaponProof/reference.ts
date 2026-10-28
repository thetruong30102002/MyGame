// Nguồn vẽ liền: idle/walk giữ atlas; chuỗi bổ sửa lỗi có bản nguồn riêng, chưa nghiệm thu.
import {readFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {readPng,writePng,crop,createImage,blit,scaleNearest,type RGBAImage} from '../image/rgba.js';
export const root=resolve(import.meta.dirname,'../../../..');
export const out=join(root,'.aether-stage/weapon-proof-v2');
export const source=join(root,'packages/asset-pipeline/sources/player-weapon-proof-v2');
const dir=join(root,'assets/characters/player_verdant_sword');
const atlas=readPng(join(dir,'player_verdant_sword.png'));
const table=JSON.parse(readFileSync(join(dir,'player_verdant_sword.json'),'utf8'));
export const motionFamily=existsSync(join(source,'motion-family.json'))?JSON.parse(readFileSync(join(source,'family-r4/registration.json'),'utf8')):null;
export const ids:string[]=motionFamily?motionFamily.frames.map((f:{id:string})=>f.id):[...['S','SW','W','NW','N','NE','E','SE'].map(d=>'idle-'+d),...Array.from({length:8},(_,i)=>'walk-E-'+i),...Array.from({length:12},(_,i)=>'attack-S-'+i)];
export function legacyOriginal(id:string):RGBAImage{const key='player_verdant_sword/'+id.replaceAll('-','_')+(id.startsWith('idle-')?'_0':''),f=table.frames[key];if(!f)throw Error('Thiếu frame gốc '+key);const img=createImage(f.sourceSize.w,f.sourceSize.h);blit(img,crop(atlas,f.frame.x,f.frame.y,f.frame.w,f.frame.h),f.spriteSourceSize.x,f.spriteSourceSize.y);return img;}
export const attackRevision=existsSync(join(source,'attack-revision.json'))?JSON.parse(readFileSync(join(source,'attack-revision.json'),'utf8')):null;
export function original(id:string):RGBAImage{return motionFamily&&ids.includes(id)?readPng(join(source,'family-r4/native',id+'.png')):attackRevision&&id.startsWith('attack-')?readPng(join(source,attackRevision.folder,'native',id+'.png')):legacyOriginal(id);}
mkdirSync(out,{recursive:true});mkdirSync(source,{recursive:true});
const contact=createImage(144*4,144*Math.ceil(ids.length/4));
for(let i=0;i<ids.length;i++){const img=original(ids[i]!);writePng(join(out,'reference',ids[i]+'.png'),img);blit(contact,img,i%4*144,Math.floor(i/4)*144);}
writePng(join(out,'reference-2x.png'),scaleNearest(contact,2));
writeFileSync(join(out,'reference-order.json'),JSON.stringify(ids,null,2));

if(!motionFamily)for(const [name,frames] of [['idle',ids.slice(0,8)],['walk',ids.slice(8,16)],['attack-a',ids.slice(16,24)],['attack-b',[...ids.slice(24),...ids.slice(24)]]] as [string,string[]][]){const sheet=createImage(576,288);frames.forEach((id,i)=>blit(sheet,original(id),i%4*144,Math.floor(i/4)*144));writePng(join(source,'reference-sheets',name+'.png'),sheet);}
