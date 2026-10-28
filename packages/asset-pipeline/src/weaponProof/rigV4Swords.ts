import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {join,resolve} from 'node:path';
import {readPng,writePng,createImage,getPixel,setPixel,opaqueBounds,type RGBAImage} from '../image/rgba.js';import {cell} from './rigV4Core.js';
const root=resolve(import.meta.dirname,'../../../..'),base=join(root,'packages/asset-pipeline/sources/player-rig-v4');
export const WEAPON_PIVOT=[48,96],WEAPON_CANVAS=[96,128];
export function exportSwords(){const raw=readPng(join(base,'swords-three-tiers-source.png')),config=JSON.parse(readFileSync(join(base,'tiers.json'),'utf8')),result:any[]=[];mkdirSync(join(base,'weapons'),{recursive:true});
 for(const[i,tier]of config.tiers.entries()){
  const tile=cell(raw,i,3,1),bounds=opaqueBounds(tile)!;let guardY=0,best=-Infinity;
  for(let y=Math.round(tile.height*.54);y<tile.height*.78;y++){let count=0;for(let x=0;x<tile.width;x++){const[r,g,b,a]=getPixel(tile,x,y);if(a&&r>140&&g>80&&r>g+8&&g>b+40)count++;}const score=count-Math.abs(y-tile.height*.665)*.15;if(score>best){best=score;guardY=y;}}
  const sourceGripY=Math.round(guardY+(bounds.y1-guardY)*.46),runs:number[][]=[];let begin=-1;
  for(let x=0;x<=tile.width;x++){const[r,g,b,a]=getPixel(tile,x,sourceGripY),yes=x<tile.width&&a>0&&Math.max(r,g,b)<180;if(yes&&begin<0)begin=x;if(!yes&&begin>=0){if(x-begin>=5)runs.push([begin,x-1]);begin=-1;}}
  const run=runs.sort((a,b)=>Math.abs((a[0]!+a[1]!)/2-tile.width/2)-Math.abs((b[0]!+b[1]!)/2-tile.width/2))[0];if(!run)throw Error('Không tìm chuôi '+tier.id);
  const gripX=(run[0]!+run[1]!)/2,bladeScale=60/(guardY-bounds.y0),hiltScale=10/(sourceGripY-guardY),native=createImage(...WEAPON_CANVAS as [number,number]);
  for(let y=0;y<native.height;y++)for(let x=0;x<native.width;x++){const sy=y<86?guardY+(y-86)/bladeScale:sourceGripY+(y-WEAPON_PIVOT[1]!)/hiltScale,c=getPixel(tile,Math.round(gripX+(x-WEAPON_PIVOT[0]!)/bladeScale),Math.round(sy));if(c[3])setPixel(native,x,y,c);}
  writePng(join(base,'weapons',tier.weaponId+'.png'),native);result.push({id:tier.weaponId,minLevel:tier.minLevel,pivot:WEAPON_PIVOT,canvas:WEAPON_CANVAS,bladeLength:60,guardDistanceFromGrip:10,sourceGuardY:guardY,sourceGrip:[gripX,sourceGripY],sourceBladeScale:bladeScale,sourceHiltScale:hiltScale});
 }
 writeFileSync(join(base,'weapons/catalog.json'),JSON.stringify({separateFromBody:true,commonGrip:true,weapons:result},null,2));return result;
}
export function renderWeapon(im:RGBAImage,grip:number[],axis:number[],projection=1,width=1){
 const out=createImage(288,288),a=Math.hypot(...axis as [number,number]),ax=axis[0]!/a,ay=axis[1]!/a,b=opaqueBounds(im);if(!b)return out;
 const corners=[[b.x0,b.y0],[b.x0,b.y1],[b.x1,b.y0],[b.x1,b.y1]].map(([x,y])=>{const u=(x!-WEAPON_PIVOT[0]!)*width,t=(WEAPON_PIVOT[1]!-y!)*projection;return[grip[0]!+ax*t-ay*u,grip[1]!+ay*t+ax*u];});
 const x0=Math.max(0,Math.floor(Math.min(...corners.map(p=>p[0]!)))-2),x1=Math.min(288,Math.ceil(Math.max(...corners.map(p=>p[0]!)))+2),y0=Math.max(0,Math.floor(Math.min(...corners.map(p=>p[1]!)))-2),y1=Math.min(288,Math.ceil(Math.max(...corners.map(p=>p[1]!)))+2);
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const dx=x-grip[0]!,dy=y-grip[1]!,u=(-ay*dx+ax*dy)/width,t=(ax*dx+ay*dy)/projection,c=getPixel(im,Math.round(WEAPON_PIVOT[0]!+u),Math.round(WEAPON_PIVOT[1]!-t));if(c[3])setPixel(out,x,y,c);}return out;
}
