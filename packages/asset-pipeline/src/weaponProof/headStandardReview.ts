import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {readPng,writePng,createImage,getPixel,setPixel,crop,blit} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),dir=join(root,'packages/asset-pipeline/sources/player-heads-v1'),heads=JSON.parse(readFileSync(join(dir,'catalog.json'),'utf8')).heads;
const board=createImage(240*6,240*5);
for(const [i,h] of heads.entries()){
 const raw=readPng(join(dir,'heads',h.id,'source.png')),tile=crop(raw,0,0,Math.floor(raw.width/4),Math.floor(raw.height/2)),out=createImage(240,240);
 for(let y=0;y<240;y++)for(let x=0;x<240;x++)setPixel(out,x,y,getPixel(tile,x*2,y*2));
 blit(board,out,i%6*240,Math.floor(i/6)*240);
 const r=JSON.parse(readFileSync(join(root,'assets/characters/player-heads-v1',h.id,'registration.json'),'utf8'));
 const skin=(x:number,y:number)=>{const[R,G,B,A]=getPixel(tile,x,y);return A>=235&&(h.raceId==='demon'?R>90&&B>G+15&&R>G+5&&Math.abs(R-B)<100:R>140&&R>G+18&&G>B+10);};
 const rows=[];for(let y=330;y<=390;y+=3){const runs:number[][]=[];let start=-1;for(let x=155;x<=305;x++){const yes=x<305&&skin(x,y);if(yes&&start<0)start=x;if(!yes&&start>=0){runs.push([start,x-1]);start=-1;}}const rr=runs.filter(r=>r[0]<=240&&r[1]>=215).sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];rows.push([y,...rr??[]]);}
 console.log(h.id,JSON.stringify(rows));
}
writePng(join(root,'.aether-stage/player-rig-v3/clean/all30-source-front.png'),board);
