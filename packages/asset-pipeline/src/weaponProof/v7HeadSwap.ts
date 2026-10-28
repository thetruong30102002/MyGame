// Một phép đăng ký cố định cho avatar mới; tuyệt đối không fit từng frame/hành động.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng,writePng,createImage,getPixel,setPixel,blit,scaleNearest,crop} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),source=join(root,'packages/asset-pipeline/sources/player-standard-v7/head-prototype'),stage=join(root,'.aether-stage/player-standard-v7');mkdirSync(stage,{recursive:true});
const standard=JSON.parse(readFileSync(join(source,'../head-standard.json'),'utf8'));
const rawPath=join(source,'avatar-chestnut-source-r2.png'),raw=readPng(rawPath),head=createImage(standard.headCanvas[0],standard.headCanvas[1]);
const rig=JSON.parse(readFileSync(join(source,'rig.json'),'utf8'));
// Đăng ký một lần theo hai mốc mắt, không đo theo phần tóc. Giữ bề ngang mặt thật.
const targetEyes=standard.facialLandmarks.eyeWhiteAnchors,sourceEyes=[[484,780],[826,780]],targetNeck=standard.neckAnchor,headOrigin=standard.headOrigin;
const scale=(targetEyes[1][0]-targetEyes[0][0])/(sourceEyes[1]![0]!-sourceEyes[0]![0]!),sourceNeck=[sourceEyes[0]![0]!+(targetNeck[0]-targetEyes[0][0])/scale,sourceEyes[0]![1]!+(targetNeck[1]-targetEyes[0][1])/scale];
for(let y=0;y<head.height;y++)for(let x=0;x<head.width;x++){const row=rig.neckRows[y+headOrigin[1]];if(y>=44&&(!row||x+headOrigin[0]<row[0]||x+headOrigin[0]>=row[1]))continue;const c=getPixel(raw,Math.round(sourceNeck[0]!+(x-targetNeck[0])/scale),Math.round(sourceNeck[1]!+(y-targetNeck[1])/scale));if(c[3]>=235)setPixel(head,x,y,[c[0],c[1],c[2],255]);}
writePng(join(source,'avatar-chestnut-S.png'),head);writePng(join(stage,'avatar-chestnut-4x.png'),scaleNearest(head,4));
const body=readPng(join(source,'body-starter-S.png')),collar=readPng(join(source,'collar-front-S.png')),navy=readPng(join(source,'reassembled-S.png')),complete=createImage(288,288);
blit(complete,body,0,0);blit(complete,head,headOrigin[0],headOrigin[1]);blit(complete,collar,0,0);writePng(join(source,'swapped-chestnut-S.png'),complete);writePng(join(stage,'swapped-chestnut-S-2x.png'),scaleNearest(complete,2));
for(const zoom of [1,2,4]){const size=144*zoom,board=createImage(size*2,size);[navy,complete].forEach((im,i)=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)setPixel(board,i*size+x,y,getPixel(im,Math.floor(x*288/size),Math.floor(y*288/size)));});writePng(join(stage,'head-swap-world-'+zoom+'x.png'),board);}
writePng(join(stage,'grip-inspect-8x.png'),scaleNearest(crop(navy,86,188,60,72),8));
const record={status:'idle-front-two-avatar-prototype-not-approved',sourceSha256:createHash('sha256').update(readFileSync(rawPath)).digest('hex'),sourceSize:[raw.width,raw.height],registration:{scale,sourceNeck,targetNeck,perFrameFit:false,reason:'Một lần đăng ký avatar theo mốc mắt thay vì hộp tóc',referenceEyeWhiteAnchors:[[24,40],[41,40]],sourceEyeWhiteAnchors:[[484,780],[826,780]]},wholeHead:true,separateHair:false,headContainsClothing:false,unchangedBodySha256:createHash('sha256').update(body.data).digest('hex'),originalBodySha256:rig.bodySha256,headOrigin:[112,100],neckAnchorInFrame:[144,154],collarFront:true,completeMotion:false,artApproved:false,productionEnabled:false};if(record.unchangedBodySha256!==record.originalBodySha256)throw Error('Thân bị đổi khi thử avatar');writeFileSync(join(source,'swap-registration.json'),JSON.stringify(record,null,2));console.log(JSON.stringify(record));
