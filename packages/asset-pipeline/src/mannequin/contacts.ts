import { createImage, getPixel, setPixel, type RGBAImage } from '../image/rgba.js';
import type { Point } from './art.js';

/** Neo tay theo từng vũ khí/pose; không dùng alpha bất kỳ ở đầu mút cánh tay. */
export function handContact(image:RGBAImage, expected:Point):Point {
 let best=Infinity,point=expected;
 for(let y=-6;y<=6;y++)for(let x=-6;x<=6;x++) {
  const px=expected[0]+x,py=expected[1]+y,c=getPixel(image,px,py);
  if(!c[3])continue;
  const skin=c[0]>120&&c[0]-c[1]>25&&c[1]-c[2]>12&&c[0]-c[1]<110&&c[1]-c[2]<95;
  const score=x*x+y*y+(skin?0:28);
  if(score<best){best=score;point=[px,py];}
 }
 if(!Number.isFinite(best))throw new Error('Không tìm thấy tay gần neo khai');
 return point;
}

export function handOcclusion(image:RGBAImage,grip:Point):RGBAImage {
 const out=createImage(112,112);
 for(let y=-2;y<=2;y++)for(let x=-3;x<=3;x++)if(x*x/9+y*y/4<=1)setPixel(out,grip[0]+x,grip[1]+y,getPixel(image,grip[0]+x,grip[1]+y));
 return out;
}

export function staffSeed(row:number,dir:number,fallback:Point,origin:Point,scale:number):Point {
 const rows:Point[][]=[
 [[106,105],[96,107],[84,108],[83,104],[103,105],[45,103],[48,105],[45,105]],
 [[100,104],[98,103],[83,102],[84,103],[105,103],[48,99],[48,103],[44,99]],
 [[106,105],[96,107],[84,108],[83,104],[103,105],[45,103],[48,105],[45,105]],
 [[103,104],[99,103],[83,102],[83,103],[105,103],[48,99],[48,103],[44,99]],
 [],[],
 [[83,72],[93,76],[85,76],[65,77],[52,76],[80,76],[70,76],[65,76]],
 [[83,74],[83,74],[77,76],[63,77],[52,78],[83,76],[70,76],[65,75]],
 ];
 const value=rows[row]?.[dir];
 return value?[Math.round(56+(value[0]-origin[0])*scale),Math.round(100+(value[1]-origin[1])*scale)]:fallback;
}
