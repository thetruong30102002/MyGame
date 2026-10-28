import { createImage, getPixel, setPixel, type RGBAImage } from '../image/rgba.js';
import type { Point } from './art.js';

const handColor=(c:readonly number[]):boolean => c[3]!>0&&c[0]!>120&&c[0]!-c[1]!>25&&c[1]!-c[2]!>12&&c[0]!-c[1]!<110&&c[1]!-c[2]!<95;

/** Neo tay theo từng vũ khí/pose; không dùng alpha bất kỳ ở đầu mút cánh tay. */
export function handContact(image:RGBAImage, expected:Point):Point {
 let best=Infinity,point=expected;
 for(let y=-6;y<=6;y++)for(let x=-6;x<=6;x++) {
  const px=expected[0]+x,py=expected[1]+y,c=getPixel(image,px,py);
  if(!c[3])continue;
  const skin=handColor(c);
  const score=x*x+y*y+(skin?0:28);
  if(score<best){best=score;point=[px,py];}
 }
 if(!Number.isFinite(best))throw new Error('Không tìm thấy tay gần neo khai');
 return point;
}

/** Đưa cán vào lòng bàn tay thay vì neo ở pixel ngoài cùng của nắm tay. */
export function palmContact(image:RGBAImage,expected:Point):Point {
 const edge=handContact(image,expected);
 let sumX=0,sumY=0,count=0;
 for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++) {
  const c=getPixel(image,edge[0]+x,edge[1]+y);
  const skin=handColor(c);
  if(skin){sumX+=edge[0]+x;sumY+=edge[1]+y;count++;}
 }
 if(count<2)return edge;
 const dx=Math.max(-1,Math.min(1,Math.round(sumX/count-edge[0])));
 const dy=Math.max(-1,Math.min(1,Math.round(sumY/count-edge[1])));
 const center:Point=[edge[0]+dx,edge[1]+dy];
 if(handColor(getPixel(image,...center)))return center;
 let best=Infinity,selected=edge;
 for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)if(handColor(getPixel(image,center[0]+x,center[1]+y))&&x*x+y*y<best){best=x*x+y*y;selected=[center[0]+x,center[1]+y];}
 return selected;
}

/** Lớp ngón tay nằm TRÊN cán, nối với lòng bàn tay của pose gốc. */
export function handOcclusion(image:RGBAImage,grip:Point,weapon:RGBAImage):RGBAImage {
 const out=createImage(112,112);
 for(let y=-2;y<=2;y++)for(let x=-3;x<=3;x++)if(x*x/9+y*y/4<=1)setPixel(out,grip[0]+x,grip[1]+y,getPixel(image,grip[0]+x,grip[1]+y));
 let finger=handColor(getPixel(image,...grip))?getPixel(image,...grip):getPixel(image,-1,-1);
 if(!finger[3])for(let radius=1;radius<=3&&!finger[3];radius++)for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++) {
  const c=getPixel(image,grip[0]+x,grip[1]+y);
  if(handColor(c)){finger=c;break;}
 }
 if(!finger[3]||!getPixel(weapon,...grip)[3])return out;
 // Một dải ngón ôm qua mặt trước cán; đầu còn lại vẫn dính với tay gốc.
 let sumX=0,sumY=0,count=0;
 for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++)if(getPixel(image,grip[0]+x,grip[1]+y)[3]){sumX+=x;sumY+=y;count++;}
 const inwardX=count?Math.sign(sumX):0,inwardY=count?Math.sign(sumY):0;
 const farX=grip[0]-inwardX,farY=grip[1]-inwardY;
 setPixel(out,grip[0],grip[1],finger);
 if(Math.abs(inwardX)+Math.abs(inwardY)>0) {
  setPixel(out,farX,farY,finger);
  if(getPixel(weapon,farX-inwardX,farY-inwardY)[3])setPixel(out,farX-inwardX,farY-inwardY,finger);
 }
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
