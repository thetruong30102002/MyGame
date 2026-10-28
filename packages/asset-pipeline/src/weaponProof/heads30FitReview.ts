// Bảng ghép chính diện để rà cằm/cổ/màu da; không dùng thân S giả làm thân8 hướng.
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {readPng,writePng,createImage,blit,getPixel,setPixel,scaleNearest} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),stage=join(root,'.aether-stage/player-heads-v1'),base=join(root,'packages/asset-pipeline/sources/player-standard-v7/unisex-sword-v1'),c=JSON.parse(readFileSync(join(root,'packages/asset-pipeline/sources/player-heads-v1/catalog.json'),'utf8')),body=readPng(join(base,'body-S.png')),collar=readPng(join(base,'collar-front-S.png')),board=createImage(864,720);
for(const[i,h]of c.heads.entries()){const im=createImage(288,288);blit(im,body,0,0);blit(im,readPng(join(stage,h.id,'S.png')),104,92);blit(im,collar,0,0);const small=createImage(144,144);for(let y=0;y<144;y++)for(let x=0;x<144;x++)setPixel(small,x,y,getPixel(im,x*2,y*2));blit(board,small,i%6*144,Math.floor(i/6)*144);}
writePng(join(stage,'fitted-30-world-1x.png'),board);writePng(join(stage,'fitted-30-world-2x.png'),scaleNearest(board,2));console.log('30 heads on identical covered swordsman body / S only');
