// Gói lớp V6 cho phòng Thử chiêu Unity; không thay roster hoặc manifest nhân vật chính.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {readPng,writePng,opaqueBounds,crop,createImage,blit} from '../image/rgba.js';
import {packShelf} from '../props/buildProps.js';
const root=resolve(import.meta.dirname,'../../../..'),stage=join(root,'.aether-stage/attack-eight-v6');
const target=join(root,'UnityGame/Assets/Aether/Resources/SwordTrialV6');
const m=JSON.parse(readFileSync(join(stage,'manifest.json'),'utf8')),w=JSON.parse(readFileSync(join(stage,'weapon-manifest.json'),'utf8'));
if(m.frames.length!==96||w.bodyCount!==96||w.sourceReassemblyExact!==96)throw Error('Thiếu lớp V6 đã kiểm');
const items: {id:string;img:ReturnType<typeof readPng>}[]=[], entries: {id:string;direction:string;index:number;part:number;variant:number;ox:number;oy:number;x?:number;y?:number;w?:number;h?:number}[]=[];
const variants=w.variants as string[];
for(const f of m.frames)for(const {part,path,variant} of [{part:1,path:'body',variant:-1},{part:3,path:'hands',variant:-1},...variants.flatMap((id,variant)=>[{part:0,path:'weapon-back/'+id,variant},{part:2,path:'weapon/'+id,variant}])]){
 const im=readPng(join(stage,path,f.id+'.png')),b=opaqueBounds(im);if(!b)continue;
 const id=f.id+'-'+part+'-'+variant;items.push({id,img:crop(im,b.x0,b.y0,b.x1-b.x0,b.y1-b.y0)});
 entries.push({id,direction:f.direction,index:f.index,part,variant,ox:b.x0,oy:b.y0});
}
const packed=packShelf(items,2048,2);if(packed.image.height>4096)throw Error('Atlas quá lớn');
for(const e of entries)Object.assign(e,packed.frames[e.id]);
mkdirSync(target,{recursive:true});writePng(join(target,'atlas.png'),packed.image);
const manifest={version:6,labOnly:true,artApproved:false,ppu:96,root:[144,256],frameSize:[288,288],directions:m.directions,framesPerDirection:12,variants,variantLabels:variants.map(id=>w.variantLabels?.[id]||id),durations:[.15,.1,.1,.11,.12,.06,.06,.09,.1,.1,.1,.18],entries};
writeFileSync(join(target,'catalog.json'),JSON.stringify(manifest));
console.log(JSON.stringify({target,atlas:[packed.image.width,packed.image.height],sprites:entries.length,labOnly:true}));
