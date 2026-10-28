// Đăng ký một master mới bằng một tỷ lệ chung, không fit riêng từng hành động.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng,writePng,createImage,getPixel,setPixel,blit,scaleNearest} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),source=join(root,'packages/asset-pipeline/sources/player-standard-v7'),stage=join(root,'.aether-stage/player-standard-v7');mkdirSync(stage,{recursive:true});
const selection=JSON.parse(readFileSync(join(source,'master-selection.json'),'utf8'));
const rawFile=join(source,selection.source),raw=readPng(rawFile),scale=150/selection.bodySpan,sourceRoot=selection.root as number[],N=288,master=createImage(N,N);
for(let y=0;y<N;y++)for(let x=0;x<N;x++){const c=getPixel(raw,Math.round(sourceRoot[0]!+(x-144)/scale),Math.round(sourceRoot[1]!+(y-256)/scale));if(c[3]>=235)setPixel(master,x,y,[c[0],c[1],c[2],255]);}
writePng(join(source,'master-S-native.png'),master);writePng(join(stage,'master-S-native.png'),master);writePng(join(stage,'master-S-2x.png'),scaleNearest(master,2));
const template=createImage(576,576);for(let i=0;i<4;i++)blit(template,master,i%2*288,Math.floor(i/2)*288);writePng(join(source,'four-pose-template.png'),template);
const npcFolder=join(root,'packages/asset-pipeline/sources/player-weapon-proof-v2/style-standard-v1/npc-ground-references');
const references=[readPng(join(root,'packages/asset-pipeline/sources/player-weapon-proof-v2/attack-eight-v6/master-S-native.png')),master,scaleNearest(readPng(join(npcFolder,'npc_silver_youth-S.png')),2),scaleNearest(readPng(join(npcFolder,'npc_silver_youth_f-S.png')),2)];
for(const zoom of [1,2]){const size=144*zoom,board=createImage(size*4,size);references.forEach((im,i)=>{const img=createImage(size,size);for(let y=0;y<size;y++)for(let x=0;x<size;x++)setPixel(img,x,y,getPixel(im,Math.floor(x*288/size),Math.floor(y*288/size)));blit(board,img,i*size,0);});writePng(join(stage,'comparison-world-'+zoom+'x.png'),board);}
const registration={version:7,status:'candidate-not-approved',source:selection.source,sourceSha256:createHash('sha256').update(readFileSync(rawFile)).digest('hex'),sourceSize:[raw.width,raw.height],sourceRoot,scale,targetCanvas:[288,288],targetRoot:[144,256],bodyHeight:150,ppu:96,filter:'nearest',alphaCutoff:235,perFrameFit:false,starterOutfit:true,targetAttackFrames:15,headModularity:'prototype-required',artApproved:false,productionEnabled:false};writeFileSync(join(source,'master-registration.json'),JSON.stringify(registration,null,2));console.log(JSON.stringify(registration));
