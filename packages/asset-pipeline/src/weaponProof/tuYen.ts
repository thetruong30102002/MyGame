// Thử chuyển nguyên kiếm cong của Tử Yên sang rig tay Lục Phong đã đối chiếu.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {root,out,source,original} from './reference.js';
import {readPng,writePng,createImage,getPixel,setPixel,crop,scaleNearest,blit,type RGBAImage} from '../image/rgba.js';
const input=join(root,'assets/player-integrated/source-art/wholecast-v18/native/player_sword_f03/idle-S.png');
const src=readPng(input);writePng(join(out,'tu-yen-source-detail-8x.png'),scaleNearest(crop(src,20,48,40,56),8));
const grip:[number,number]=[42,67],u:[number,number]=[-2/Math.sqrt(29),5/Math.sqrt(29)],v:[number,number]=[-u[1],u[0]];
const polygon=[[39,68],[42,69],[44,72],[45,76],[41,79],[39,83],[35,88],[30,93],[25,97],[26,93],[31,87],[34,82],[36,77],[37,73]];
function inside(x:number,y:number){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i]!,b=polygon[j]!;if((a[1]!>y)!==(b[1]!>y)&&x<(b[0]!-a[0]!)*(y-a[1]!)/(b[1]!-a[1]!)+a[0]!)yes=!yes;}return yes;}
const sword=createImage(112,112);
for(let y=0;y<112;y++)for(let x=0;x<112;x++){const c=getPixel(src,x,y),skin=c[0]>150&&c[1]>95&&c[2]>65&&c[2]/c[1]>.48&&c[0]>c[1]*1.1;if(c[3]&&inside(x+.5,y+.5)&&!skin)setPixel(sword,x,y,c);}
// Bù cán bị nắm kín bằng màu da thuộc của nguồn; đoạn này nằm sau bàn tay/cơ thể.
for(let y=0;y<112;y++)for(let x=0;x<112;x++){const dx=x-grip[0],dy=y-grip[1],t=dx*u[0]+dy*u[1],n=dx*v[0]+dy*v[1];if(t>=-6&&t<=1.2&&Math.abs(n)<=.65)setPixel(sword,x,y,getPixel(src,42,67));}
const assetDir=join(source,'tu-yen');mkdirSync(assetDir,{recursive:true});writePng(join(assetDir,'native-sword.png'),sword);writePng(join(assetDir,'donor.png'),src);writePng(join(out,'tu-yen-native-8x.png'),scaleNearest(crop(sword,23,59,24,40),8));
const metadata={owner:'Tử Yên',ownerId:'player_sword_f03',source:input.slice(root.length+1),sourceSha256:createHash('sha256').update(readFileSync(input)).digest('hex'),nativeSize:[112,112],grip,gripAxis:u,maskPolygon:polygon,scale:1,bodyRedrawn:false,hairSeparated:false,bladeCurve:'mirror-blade-only-for-screen-right-axis',notes:'Lấy nguyên pixel lưỡi cong và hộ thủ bạc/tím; loại da/ngón tay của người cho. Chỉ bù đoạn cán bị nắm kín, luôn nằm ở lớp sau. Lưỡi cong lên khi chiếu sang phải; không lật chuôi, hộ thủ hoặc tay.'};writeFileSync(join(assetDir,'asset.json'),JSON.stringify(metadata,null,2));
const manifestPath=join(out,'manifest.json'),m=JSON.parse(readFileSync(manifestPath,'utf8'));
for(const f of m.frames){const back=createImage(144,144),front=createImage(144,144),unit=f.axis as [number,number],normal:[number,number]=[-unit[1],unit[0]],mirrorBlade=unit[0]>.1;f.tuYenBladeMirrored=mirrorBlade;
 for(let y=0;y<144;y++)for(let x=0;x<144;x++){const dx=x-f.grip[0],dy=y-f.grip[1],t=dx*unit[0]+dy*unit[1];const sample=(ox:number,oy:number)=>{const tx=(dx+ox)*unit[0]+(dy+oy)*unit[1];let nx=(dx+ox)*normal[0]+(dy+oy)*normal[1];if(mirrorBlade&&tx>=10.5)nx=-nx;return getPixel(sword,Math.round(grip[0]+tx*u[0]+nx*v[0]),Math.round(grip[1]+tx*u[1]+nx*v[1]));};let c=sample(0,0);
  // Phủ cạnh ô pixel khi xoay để lưỡi cong mảnh không đứt đoạn; không trộn màu/làm mờ.
  if(!c[3])for(const[ox,oy]of [[-.34,0],[.34,0],[0,-.34],[0,.34],[-.34,-.34],[.34,-.34],[-.34,.34],[.34,.34]]){const candidate=sample(ox!,oy!);if(candidate[3]){c=candidate;break;}}
  if(!c[3])continue;setPixel(back,x,y,c);if(!f.hidden&&t>=1.2)setPixel(front,x,y,c);}
 const body=readPng(join(out,'body',f.id+'.png')),hands=readPng(join(out,'hands',f.id+'.png')),full=createImage(144,144);blit(full,back,0,0);blit(full,body,0,0);blit(full,front,0,0);blit(full,hands,0,0);writePng(join(out,'weapon-back','tu-yen',f.id+'.png'),back);writePng(join(out,'weapon','tu-yen',f.id+'.png'),front);writePng(join(out,'composite','tu-yen',f.id+'.png'),full);
}
m.assetRevision='tu-yen-'+Date.now();m.weaponCount=3;m.sharedHilt=false;m.defaultWeapon='tu-yen';m.weaponVariants=[{id:'iron',name:'Kiếm sắt',back:false,sharedHilt:true},{id:'tu-yen',name:'Kiếm Tử Yên',back:true,donor:'player_sword_f03',sharedHilt:false}];m.tuYenAsset=metadata;writeFileSync(manifestPath,JSON.stringify(m,null,2));
for(const [action,ids]of [['idle',m.frames.filter((f:{id:string})=>f.id.startsWith('idle-')).map((f:{id:string})=>f.id)],['walk',m.frames.filter((f:{id:string})=>f.id.startsWith('walk-')).map((f:{id:string})=>f.id)],['attack',m.frames.filter((f:{id:string})=>f.id.startsWith('attack-')).map((f:{id:string})=>f.id)]] as [string,string[]][]){const board=createImage(96*ids.length,112*2);ids.forEach((id,i)=>{[original(id),readPng(join(out,'composite','tu-yen',id+'.png'))].forEach((img,j)=>blit(board,crop(img,24,24,96,112),i*96,j*112));});writePng(join(out,action+'-tu-yen-2x.png'),scaleNearest(board,2));}
console.log(JSON.stringify({frames:m.frames.length,weapon:'Tử Yên',sourceSha256:metadata.sourceSha256,bodyChanged:false,scale:1}));
