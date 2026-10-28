// Bốn pose thử, một hệ số đo từ pose đứng đầu; không fit từng người vào ô.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng,writePng,createImage,getPixel,setPixel,blit,scaleNearest,crop,opaqueBounds} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),source=join(root,'packages/asset-pipeline/sources/player-standard-v7'),stage=join(root,'.aether-stage/player-standard-v7');mkdirSync(join(stage,'pilot'),{recursive:true});
const rawPath=join(source,'four-pose-source.png'),raw=readPng(rawPath);if(raw.width!==1254||raw.height!==1254)throw Error('Kích thước nguồn đổi, phải đăng ký lại cả họ pose.');
const scale=150/395,sourceRoot=[313,559],names=['idle','walk-contact','overhead','impact'],frames=[];
const board=createImage(288*5,288);blit(board,readPng(join(source,'master-S-native.png')),0,0);
for(let i=0;i<4;i++){const tile=crop(raw,(i%2)*627,Math.floor(i/2)*627,627,627),im=createImage(288,288);for(let y=0;y<288;y++)for(let x=0;x<288;x++){const c=getPixel(tile,Math.round(sourceRoot[0]!+(x-144)/scale),Math.round(sourceRoot[1]!+(y-256)/scale));if(c[3]>=235)setPixel(im,x,y,[c[0],c[1],c[2],255]);}writePng(join(stage,'pilot',names[i]+'.png'),im);blit(board,im,(i+1)*288,0);frames.push({id:names[i],bounds:opaqueBounds(im)});}
writePng(join(stage,'pilot-contact-2x.png'),board);writePng(join(stage,'pilot-contact-4x.png'),scaleNearest(board,2));
const overlap=(frames[0]?.bounds?.y1??0)>264;
const record={status:overlap?'rejected-source-cell-overlap':'four-pose-pilot-not-animation-not-approved',reviewNotes:overlap?['Mũi kiếm pose giơ cao vượt ô nguồn, lẫn pixel vào dưới chân pose idle. Không dùng runtime hoặc trang duyệt.']:[],sourceSha256:createHash('sha256').update(readFileSync(rawPath)).digest('hex'),scale,sourceRoot,targetRoot:[144,256],canvas:[288,288],ppu:96,perFrameFit:false,frames,targetSwordAttackFrames:15,completeAttack:false,completeEightDirections:false,artApproved:false,productionEnabled:false};writeFileSync(join(source,'pilot-registration.json'),JSON.stringify(record,null,2));console.log(JSON.stringify(record));
