/** Đóng gói bộ PixelLab gốc thành 25 lựa chọn nam. Không sinh ảnh, không lấy bất kỳ nguồn ImageGen nào. */
import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';import{readPng,writePng,createImage,crop,blit,opaqueBounds,type RGBAImage}from'../packages/asset-pipeline/src/image/rgba.js';
const src='packages/asset-pipeline/sources/layered-character/mau-1/baseline-pixellab-v1',data=JSON.parse(readFileSync(join(src,'layered.json'),'utf8')),heads=readPng(join(src,data.head.sheet));
const races=[['human','Nhân tộc'],['elf','Elf'],['demon','Ma tộc'],['beast','Thú nhân'],['dragon','Long tộc']];
const classes=[['sword','Kiếm sĩ','m','slash','attack'],['staff','Pháp sư','m-mage','cast','cast'],['spear','Thương thủ','m-lancer','thrust','thrust'],['bow','Cung thủ','m-archer','shoot','shoot'],['shield','Hộ vệ','m-guard','bash','bash']];
const dest='assets/player-roster/pixellab-male-v1';mkdirSync(dest,{recursive:true});const manifest=JSON.parse(readFileSync('assets/manifest.json','utf8')),catalog:any[]=[];const proof:any[]=[];
for(const[classId,classLabel,bodyId,sourceAction,action]of classes){const b=data.bodies.find((b:any)=>b.id===bodyId),sheet=readPng(join(src,b.sheet));const cell=(i:number)=>crop(sheet,i%16*160,Math.floor(i/16)*160,160,160);
 for(const[raceId,raceLabel]of races){const head=data.heads.find((h:any)=>h.id==='m-'+raceId+'1');if(!head)throw Error('Thiếu đầu '+raceId);const id='player_pl_'+raceId+'_'+classId+'_m1',folder='assets/characters/'+id;mkdirSync(folder,{recursive:true});
  const cells:RGBAImage[]=[],frames:any={},animations:any={},spec:any={};let frameCount=0;
  for(const state of['idle','walk','run',sourceAction])for(const dir of['S','E','N','W']){
   const sourceDir=state===sourceAction&&dir==='S'?'E':dir,key=state+'_'+sourceDir,clip=b.clips[key];if(!clip?.length)throw Error(id+' thiếu '+key);const name=state===sourceAction?action:state,animKey=name+'_'+dir,names=[];
   for(const[i,f]of clip.entries()){
    const hf=head.clips?.[key]?.length===clip.length?head.clips[key][i]:head.dirs[sourceDir],h=crop(heads,hf.head%16*48,Math.floor(hf.head/16)*48,48,48),hb=hf.hairBack>=0?crop(heads,hf.hairBack%16*48,Math.floor(hf.hairBack/16)*48,48,48):null;
    const im=createImage(160,160),nx=f.chin[0]-(hf.chinOffset?.[0]||0)-24,ny=f.chin[1]-(hf.chinOffset?.[1]||0)-40;
    if(f.weaponBehind&&f.weapon>=0)blit(im,cell(f.weapon),0,0);if(hb)blit(im,hb,nx,ny);blit(im,cell(f.body),0,0);blit(im,h,nx,ny);if(f.front>=0)blit(im,cell(f.front),0,0);if(!f.weaponBehind&&f.weapon>=0)blit(im,cell(f.weapon),0,0);if(f.hand>=0)blit(im,cell(f.hand),0,0);
    const n=cells.length,file=id+'_'+animKey+'_'+String(i).padStart(2,'0');frames[file]={frame:{x:n%12*160,y:Math.floor(n/12)*160,w:160,h:160},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:160,h:160},sourceSize:{w:160,h:160},anchor:{x:.5,y:.9}};names.push(file);cells.push(im);frameCount++;
   }
   animations[animKey]=names;const total=clip.reduce((n:number,f:any)=>n+f.ms,0);spec[name]={fps:clip.length*1000/total,frames:clip.length,loop:state!==sourceAction,hitFrame:state===sourceAction?Math.max(1,clip.findIndex((f:any)=>f.event==='hit')+1):undefined,directions:['S','E','N','W']};
  }
  for(const state of['idle','walk','run',action])for(const[d,from]of[['SE','E'],['SW','W'],['NE','N'],['NW','N']])animations[state+'_'+d]=animations[state+'_'+from];
  // Chỉ bỏ biên alpha rỗng khi đóng gói. sourceSize/pivot giữ nguyên ô160, tuyệt đối không co hình.
  const names=Object.keys(frames),packed:any[]=[],frameHashes:Record<string,string>={};let px=0,py=0,rowHeight=0;
  cells.forEach((im,i)=>{const box=opaqueBounds(im);if(!box)throw Error('Khung rỗng '+id);const w=box.x1-box.x0,h=box.y1-box.y0;if(px+w+2>1536){px=0;py+=rowHeight+2;rowHeight=0;}const name=names[i]!,fr=frames[name];fr.frame={x:px,y:py,w,h};fr.trimmed=true;fr.spriteSourceSize={x:box.x0,y:box.y0,w,h};packed.push({image:crop(im,box.x0,box.y0,w,h),x:px,y:py});frameHashes[name]=createHash('sha256').update(im.data).digest('hex');px+=w+2;rowHeight=Math.max(rowHeight,h);});
  const atlasHeight=py+rowHeight;if(atlasHeight>2048)throw Error('Atlas vượt trần mobile: '+id);const image=createImage(1536,atlasHeight);packed.forEach(p=>blit(image,p.image,p.x,p.y));writePng(join(folder,id+'.png'),image);writeFileSync(join(folder,id+'.json'),JSON.stringify({frames,animations,meta:{image:id+'.png',size:{w:image.width,h:image.height}}}));
  manifest.characters[id]={displayName:raceLabel+' · '+classLabel,role:'player',atlas:'characters/'+id+'/'+id+'.json',frameSize:{width:160,height:160},anchor:{x:.5,y:.9},bodyHeight:106,directions:['S','E','N','W'],animations:spec};
  catalog.push({id,displayName:raceLabel,classId,classLabel,gender:'male',raceId,raceLabel,variant:1,playable:true});proof.push({id,bodyId,headId:head.id,frames:frameCount,atlasSize:[image.width,image.height],frameHashes,source:'PixelLab original baseline, before GPT motion experiment',atlasSha256:createHash('sha256').update(readFileSync(join(folder,id+'.png'))).digest('hex')});
 }
}
writeFileSync('assets/manifest.json',JSON.stringify(manifest,null,'\t')+'\n');writeFileSync(dest+'/catalog.json',JSON.stringify({version:'pixellab-male-v1',characters:catalog},null,2));writeFileSync(dest+'/provenance.json',JSON.stringify({source:src,gptArt:false,newImageCalls:0,models:proof},null,2));
const protocol='packages/protocol/src/roster.ts';let text=readFileSync(protocol,'utf8');if(!text.includes('PIXELLAB_MALE_MODELS')){text=text.replace('export const PLAYER_MODELS = [','const LEGACY_PLAYER_MODELS = [');text=text.replace('export const playerModel =',`export const PIXELLAB_MALE_MODELS = ${JSON.stringify(catalog.map(c=>({id:c.id,classId:c.classId,gender:c.gender,name:c.displayName,raceId:c.raceId})),null,2)} as const;\nexport const PLAYER_MODELS = [...PIXELLAB_MALE_MODELS, ...LEGACY_PLAYER_MODELS] as const;\nexport const playerModel =`);writeFileSync(protocol,text);}
console.log('Exported '+catalog.length+' PixelLab male models (5 races × 5 classes), original 15-frame attacks; zero GPT frames.');
