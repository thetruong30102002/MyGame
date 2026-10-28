// Chỉ nhận nguồn không đầu thật. Không cắt một đầu cũ rồi trông chờ avatar che nó.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {createImage,readPng,writePng,getPixel,setPixel,blit,crop,opaqueBounds,type RGBAImage} from '../image/rgba.js';
import {brooch} from './rigV3Core.js';
import {HEAD_STANDARD as HS,HEAD_ORIGIN,NORMALIZED_HEADS,exportStandardHeads} from './headStandard.js';
const root=resolve(import.meta.dirname,'../../../..'),base=join(root,'packages/asset-pipeline/sources/player-rig-v3'),stage=join(root,'.aether-stage/player-rig-v3/clean'),resources=join(root,'UnityGame/Assets/Aether/Resources/PlayerRigV3');
const config={male:{neck:450,sole:794,id:'human-m03'},female:{neck:480,sole:805,id:'human-f01'}},actions=['idle','walk','attack'],groups=['master','walk-0','attack-0','attack-1','attack-2','attack-3'];
const claspY:Record<string,number[]>={'male/master':[480],'female/master':[505],'male/walk-0':[475,475,475,475],'female/walk-0':[503,503,503,503],'male/attack-0':[515,519,516,520],'male/attack-1':[515,480,480,515],'male/attack-2':[475,492,492,490],'male/attack-3':[470,470,470,470],'female/attack-0':[513,515,511,520],'female/attack-1':[508,498,501,513],'female/attack-2':[515,516,517,516],'female/attack-3':[505,505,505,505]};
// Tấm hồi thế có ô4 đứng làm thước: generator phóng cả tấm. Đổi mật độ cả tấm theo ô chuẩn,
// không fit từng pose/chém/kiếm, không thay transform/PPU runtime.
const sourceCalibration={male:{neck:432,sole:795,claspY:470},female:{neck:430,sole:795,claspY:468}};
// Kiểm toàn bộ nguồn trước khi viết Resources; tuyệt đối không fallback nguồn có đầu.
for(const g of ['male','female'])for(const group of groups){const file=join(base,'body-'+g,'headless-'+group+'-source.png');if(!existsSync(file))throw Error('Chưa đủ nguồn thân sạch: '+file);}
mkdirSync(stage,{recursive:true});mkdirSync(resources,{recursive:true});
exportStandardHeads();
const headCatalog=JSON.parse(readFileSync(join(root,'assets/characters/player-heads-v1/head-catalog.json'),'utf8')),atlas=createImage(2048,4096),entries:any[]=[],records:any[]=[],headEntries:any[]=[];
let packX=2,packY=2,rowH=0;
function pack(im:RGBAImage,info:object){const b=opaqueBounds(im)!;const w=b.x1-b.x0,h=b.y1-b.y0;if(packX+w+2>2048){packY+=rowH+4;packX=2;rowH=0;}if(packY+h>4096)throw Error('Atlas quá lớn');blit(atlas,crop(im,b.x0,b.y0,w,h),packX,packY);entries.push({...info,part:'front',x:packX,y:packY,w,h,ox:b.x0,oy:b.y0});packX+=w+4;rowH=Math.max(rowH,h);}
function mirrorLegs(im:RGBAImage){const out={...im,data:new Uint8Array(im.data)},seen=new Set<number>(),q:number[][]=[];for(let x=130;x<=158;x++)if(getPixel(im,x,201)[3])q.push([x,201]);while(q.length){const[x,y]=q.pop()!,k=y!*288+x!;if(seen.has(k)||y!<201||y!>260||x!<112||x!>176)continue;const c=getPixel(im,x!,y!);if(!c[3]||c[2]>c[0]+14||c[1]>c[0]+8)continue;seen.add(k);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])q.push([x!+dx!,y!+dy!]);}for(const k of seen)setPixel(out,k%288,Math.floor(k/288),[0,0,0,0]);for(const k of seen)setPixel(out,288-k%288,Math.floor(k/288),getPixel(im,k%288,Math.floor(k/288)));return out;}
const durations=[.11,.095,.09,.085,.075,.07,.11,.04,.025,.03,.045,.065,.07,.075,.1];
for(const g of ['male','female']as const){const cfg=config[g],scale=102/(cfg.sole-cfg.neck),sourceMaster=join(base,'body-'+g,'headless-master-source.png'),master=readPng(sourceMaster),ref=brooch(master,0,g,claspY[g+'/master']![0]),frames:any[]=[],cached:{im:RGBAImage;meta:any}[]=[];const out=join(base,'body-'+g,'clean');mkdirSync(out,{recursive:true});
 for(const action of actions){const count=action==='idle'?1:action==='walk'?8:15,board=createImage(288*8,288*Math.ceil(count/8)),bodyOnly=createImage(board.width,board.height);
  for(let n=0;n<count;n++){
   let im:RGBAImage,meta:any;
   if(action==='walk'&&n>=4){const from=cached[n-4]!;im=mirrorLegs(from.im);meta={...from.meta,index:n,mirroredLegsFrom:n-4};}
   else{const sourceIndex=action==='attack'?(n===3?4:n===4?3:n):n,group=action==='idle'?'master':action+'-'+Math.floor(sourceIndex/4),slot=sourceIndex%4,path=join(base,'body-'+g,'headless-'+group+'-source.png'),raw=readPng(path);if(raw.width!==master.width||raw.height!==master.height)throw Error('Khác thước ảnh nguồn '+path);const cal=group==='attack-3'?sourceCalibration[g]:null,localScale=cal?102/(cal.sole-cal.neck):scale,sourceNeck=cal?.neck??cfg.neck,sourceRef=cal?brooch(raw,3,g,cal.claspY):ref;let b=brooch(raw,slot,g,cal?.claspY??claspY[g+'/'+group]![slot]);if(g==='male'&&action==='attack'&&n===8)b={...b,x:235,y:475};const dy=Math.round((b.y-sourceRef.y)*localScale);im=createImage(288,288);
    for(let y=0;y<288;y++)for(let x=0;x<288;x++){const rx=Math.round(b.x+(x-144)/localScale),ry=Math.round(sourceNeck+(y-154)/localScale);if(rx<slot*raw.width/4||rx>=(slot+1)*raw.width/4)continue;const c=getPixel(raw,rx,ry);if(c[3]>=235)setPixel(im,x,y,[c[0],c[1],c[2],255]);}
    meta={gender:g,action,index:n,source:path.replace(root+'\\',''),sourceSha256:createHash('sha256').update(readFileSync(path)).digest('hex'),headlessSource:true,scale:localScale,sourceDensityCalibration:cal?{referenceSlot:3,sourceNeck:cal.neck,sourceSole:cal.sole,targetNeckToSole:102,sharedAcrossWholeSource:true}:null,perFrameFit:false,ppu:96,sourceBrooch:[b.x,b.y],headOffset:[HEAD_ORIGIN[0],HEAD_ORIGIN[1]+dy],faceChinY:HEAD_ORIGIN[1]+HS.chin[1]+dy,collarMinY:HS.bodySocket[1]+dy,root:[144,256],duration:action==='walk'?.14:action==='attack'?durations[n]:1};
   }
   const id=action+'-'+String(n).padStart(2,'0');writePng(join(out,id+'-body.png'),im);pack(im,{gender:g,action,index:n});blit(bodyOnly,im,n%8*288,Math.floor(n/8)*288);
   const full=createImage(288,288),head=readPng(join(NORMALIZED_HEADS,cfg.id,'S.png'));
   // Một đầu duy nhất, rồi thân không đầu ở lớp trước: tay/kiếm/cổ áo tự che đúng.
   blit(full,head,meta.headOffset[0],meta.headOffset[1]);blit(full,im,0,0);writePng(join(out,id+'-assembled.png'),full);blit(board,full,n%8*288,Math.floor(n/8)*288);frames.push(meta);if(action==='walk'&&n<4)cached.push({im,meta});
  }
  writePng(join(stage,g+'-'+action+'-body-only.png'),bodyOnly);writePng(join(stage,g+'-'+action+'.png'),board);
 }
 records.push({gender:g,scale,sourceNeck:cfg.neck,sourceSole:cfg.sole,frames});
}
const headAtlas=createImage(HS.canvas[0]*10,HS.canvas[1]*3);for(const[i,h]of headCatalog.heads.entries()){const raw=readPng(join(NORMALIZED_HEADS,h.id,'S.png')),x=i%10*HS.canvas[0],y=Math.floor(i/10)*HS.canvas[1];blit(headAtlas,raw,x,y);headEntries.push({id:h.id,gender:h.gender,raceId:h.raceId,raceName:h.raceName,index:h.index,x,y,w:HS.canvas[0],h:HS.canvas[1],standardId:HS.id});}
writePng(join(resources,'body-atlas.png'),crop(atlas,0,0,2048,Math.ceil((packY+rowH+4)/4)*4));writePng(join(resources,'head-atlas.png'),headAtlas);
const result={version:3,sourceRevision:'genuinely-headless',headAtlasSha256:createHash('sha256').update(readFileSync(join(resources,'head-atlas.png'))).digest('hex'),headStandard:HS,ppu:HS.ppu,canvas:HS.bodyCanvas,root:HS.bodyRoot,headOrigin:HEAD_ORIGIN,bareNeckMaxPixels:HS.bareNeckMaxPixels,bodyGenders:['male','female'],directions:['S'],completeEightDirections:false,productionRosterEnabled:false,headOverpaintForbidden:true,bodyContainsOldHead:false,layerOrder:['one-avatar','genuinely-headless-body-with-hands'],heads:headEntries,records,entries};writeFileSync(join(base,'runtime-catalog.json'),JSON.stringify(result,null,2));writeFileSync(join(resources,'catalog.json'),JSON.stringify(result));console.log(JSON.stringify({sources:12,frames:48,heads:30,standard:HS.id,parts:entries.length,bodyLayer:'front',oldHeadPixels:'nguồn không đầu thật; rà thủ công và test riêng'}));
