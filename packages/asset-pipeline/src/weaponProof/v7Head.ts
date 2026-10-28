// Thử nguyên cụm đầu trên master S: chia pixel nguồn, không vẽ tóc rời hay sửa khuôn mặt.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng,writePng,createImage,getPixel,setPixel,blit,crop,scaleNearest} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),source=join(root,'packages/asset-pipeline/sources/player-standard-v7'),stage=join(root,'.aether-stage/player-standard-v7');mkdirSync(join(source,'head-prototype'),{recursive:true});
const original=readPng(join(source,'master-S-native.png')),head=createImage(288,288),body=createImage(288,288),collar=createImage(288,288);
const standard=JSON.parse(readFileSync(join(source,'head-standard.json'),'utf8'));
// Đường cắt rà từng hàng: cổ da thu nhỏ về tâm, toàn bộ vải/cổ áo ở thân.
// Khoảng x là [min,max), không lấy tam giác vải xanh cạnh hàm vào avatar.
const neckRows=standard.neckRowsInFrame as Record<number,[number,number]>;
function inside(x:number,y:number){const row=neckRows[y];return y>=100&&y<=143?x>=110&&x<178:!!row&&x>=row[0]&&x<row[1];}
for(let y=0;y<288;y++)for(let x=0;x<288;x++){const c=getPixel(original,x,y);if(!c[3])continue;const selected=inside(x,y);setPixel(selected?head:body,x,y,c);if(!selected&&x>=124&&x<=164&&y>=144&&y<=166)setPixel(collar,x,y,c);}
const complete=createImage(288,288);for(const p of [body,head,collar])blit(complete,p,0,0);
let mismatch=0;for(let i=0;i<complete.data.length;i++)if(complete.data[i]!==original.data[i])mismatch++;
if(mismatch)throw Error('Thử nguyên đầu ghép khác nguồn '+mismatch);
for(const[name,img]of [['head-S',head],['body-starter-S',body],['collar-front-S',collar],['reassembled-S',complete]] as const){writePng(join(source,'head-prototype',name+'.png'),img);writePng(join(stage,name+'-2x.png'),scaleNearest(img,2));}
writePng(join(source,'head-prototype','avatar-navy-S.png'),crop(head,112,100,64,64));writePng(join(stage,'avatar-navy-4x.png'),scaleNearest(crop(head,112,100,64,64),4));
const metadata={status:'idle-front-prototype-not-approved',wholeHead:true,separateHair:false,headContainsClothing:false,headPose:'S-neutral',headAssetOrigin:[112,100],headAssetCanvas:[64,64],neckAnchorInFrame:[144,154],neckAnchorInAsset:[32,54],collarFront:true,neckRows,pixelsReassemblyExact:mismatch===0,bodySha256:createHash('sha256').update(body.data).digest('hex'),bodyFrameSize:[288,288],bodyRoot:[144,256],ppu:96,completeMotion:false,targetSwordAttackFrames:15,productionEnabled:false,artApproved:false};writeFileSync(join(source,'head-prototype','rig.json'),JSON.stringify(metadata,null,2));console.log(JSON.stringify(metadata));
