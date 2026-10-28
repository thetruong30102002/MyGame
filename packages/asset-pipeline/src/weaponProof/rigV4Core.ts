import {createImage,crop,getPixel,setPixel,opaqueBounds,type RGBAImage} from '../image/rgba.js';
export const DIRECTIONS=['S','SW','W','NW','N','NE','E','SE'];
export const SOURCE_DIRECTIONS=['S','SW','W','NW','N'];
export const MIRRORS:Record<string,string>={NE:'NW',E:'W',SE:'SW'};
export const ATTACK_TIMES=[.11,.095,.09,.085,.075,.07,.11,.04,.025,.03,.045,.065,.07,.075,.1];
export function clean(im:RGBAImage){
 for(let i=3;i<im.data.length;i+=4)im.data[i]=im.data[i]!>=235?255:0;
 const seen=new Uint8Array(im.width*im.height),groups:number[][]=[];
 for(let i=0;i<seen.length;i++){if(seen[i]||!im.data[i*4+3])continue;const q=[i],g:number[]=[];seen[i]=1;while(q.length){const k=q.pop()!;g.push(k);const x=k%im.width,y=Math.floor(k/im.width);for(let Y=y-1;Y<=y+1;Y++)for(let X=x-1;X<=x+1;X++){const n=Y*im.width+X;if(X>=0&&Y>=0&&X<im.width&&Y<im.height&&!seen[n]&&im.data[n*4+3]){seen[n]=1;q.push(n);}}}groups.push(g);}
 const largest=Math.max(...groups.map(g=>g.length));for(const g of groups)if(g.length<largest*.002)for(const p of g)im.data.fill(0,p*4,p*4+4);return im;
}
export function cell(raw:RGBAImage,index:number,cols:number,rows:number){const x=Math.floor(index%cols*raw.width/cols),y=Math.floor(Math.floor(index/cols)*raw.height/rows),x1=Math.floor((index%cols+1)*raw.width/cols),y1=Math.floor((Math.floor(index/cols)+1)*raw.height/rows);return clean(crop(raw,x,y,x1-x,y1-y));}
const componentCells=new WeakMap<RGBAImage,Map<string,RGBAImage[]>>();
/** Tách trọn thân theo alpha, không cắt mất cổ/tay khi nguồn vượt biên ô lưới một ít. Không thay mật độ. */
export function bodyCell(raw:RGBAImage,index:number,cols:number,rows:number){
 let cache=componentCells.get(raw);if(!cache){cache=new Map();componentCells.set(raw,cache);}const key=cols+'x'+rows;let frames=cache.get(key);
 if(!frames){
  const seen=new Uint8Array(raw.width*raw.height),groups:{points:number[];cx:number;cy:number;area:number}[]=[];
  for(let k=0;k<seen.length;k++){if(seen[k]||raw.data[k*4+3]!<235)continue;const q=[k],points:number[]=[];seen[k]=1;let x0=raw.width,y0=raw.height,x1=0,y1=0;
   while(q.length){const p=q.pop()!,x=p%raw.width,y=Math.floor(p/raw.width);points.push(p);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy,n=Y*raw.width+X;if(X>=0&&Y>=0&&X<raw.width&&Y<raw.height&&!seen[n]&&raw.data[n*4+3]!>=235){seen[n]=1;q.push(n);}}
   }
   if(points.length>=100)groups.push({points,cx:(x0+x1)/2,cy:(y0+y1)/2,area:points.length});
  }
  groups.sort((a,b)=>b.area-a.area);const chosen=groups.slice(0,cols*rows);if(chosen.length!==cols*rows||chosen.some(g=>g.area<chosen[0]!.area*.14))throw Error('Không tách đủ thân nguồn '+key);
  chosen.sort((a,b)=>a.cy-b.cy);const ordered=[];for(let row=0;row<rows;row++)ordered.push(...chosen.slice(row*cols,(row+1)*cols).sort((a,b)=>a.cx-b.cx));
  const w=Math.ceil(raw.width/cols),h=Math.ceil(raw.height/rows),pad=Math.ceil(h*.3),padX=Math.ceil(w*.3);frames=[];
  for(const[i,g]of ordered.entries()){const out=createImage(w+padX*2,h+pad*2),left=Math.floor(i%cols*raw.width/cols)-padX,top=Math.floor(Math.floor(i/cols)*raw.height/rows)-pad;let clipped=0;
   for(const p of g.points){const x=p%raw.width-left,y=Math.floor(p/raw.width)-top;if(x<0||y<0||x>=out.width||y>=out.height){clipped++;continue;}const c=getPixel(raw,p%raw.width,Math.floor(p/raw.width));setPixel(out,x,y,[c[0],c[1],c[2],255]);}
   if(clipped)throw Error('Thân vượt cả vùng đệm nguồn '+i+' '+clipped);frames.push(out);
  }
  cache.set(key,frames);
 }
 return frames[index]!;
}
export function sole(im:RGBAImage){const b=opaqueBounds(im);if(!b)throw Error('Ô nguồn rỗng');return b.y1-1;}
export function neutralNeck(im:RGBAImage){const b=opaqueBounds(im)!;const xs:number[]=[];for(let y=b.y0;y<=Math.min(b.y1-1,b.y0+Math.max(1,Math.round((b.y1-b.y0)*.012)));y++)for(let x=b.x0;x<b.x1;x++)if(getPixel(im,x,y)[3])xs.push(x);if(!xs.length)throw Error('Không có neo cổ');return{x:(Math.min(...xs)+Math.max(...xs))/2,y:b.y0};}
export function collar(im:RGBAImage,expectedY:number,scale=1){
 let best={x:im.width*.5,y:expectedY,score:-Infinity};
 for(let y=Math.max(0,Math.floor(expectedY-im.height*.09));y<Math.min(im.height,expectedY+im.height*.09);y++)for(let x=Math.floor(im.width*.36);x<im.width*.64;x++){
  const[r,g,b,a]=getPixel(im,x,y);if(!a||r<130||g<75||r<g+8||g<b+30)continue;
  const score=-Math.abs(y-expectedY)-Math.abs(x-im.width*.5)*.24;
  if(score>best.score)best={x,y,score};
 }
 // Chỉ đọc viền vàng của cổ; tuyệt đối không bắt nhầm găng giơ trên đầu làm neo cổ.
 if(!Number.isFinite(best.score))return{x:im.width*.5,y:expectedY};
 const xs:number[]=[],ys:number[]=[];for(let y=Math.max(0,Math.round(best.y-im.height*.008));y<=Math.min(im.height-1,best.y+im.height*.008);y++)for(let x=Math.max(0,Math.round(best.x-im.width*.04));x<=Math.min(im.width-1,best.x+im.width*.04);x++){const[r,g,b,a]=getPixel(im,x,y);if(a&&r>130&&g>75&&r>g+8&&g>b+30){xs.push(x);ys.push(y);}}
 return{x:xs.length?(Math.min(...xs)+Math.max(...xs))/2:best.x,y:(ys.length?Math.min(...ys):best.y)-2/scale};
}
export function sample(im:RGBAImage,scale:number,dx:number,dy:number){const out=createImage(288,288),b=opaqueBounds(im);if(!b)return out;
 // Bounds chỉ giảm miền duyệt pixel, tuyệt đối không dùng để fit/đổi scale theo pose.
 for(let y=Math.max(0,Math.floor(dy+b.y0*scale)-1);y<Math.min(288,Math.ceil(dy+b.y1*scale)+1);y++)for(let x=Math.max(0,Math.floor(dx+b.x0*scale)-1);x<Math.min(288,Math.ceil(dx+b.x1*scale)+1);x++){const c=getPixel(im,Math.round((x-dx)/scale),Math.round((y-dy)/scale));if(c[3])setPixel(out,x,y,c);}return out;}
export function mirror(im:RGBAImage){const out=createImage(im.width,im.height),b=opaqueBounds(im);if(!b)return out;for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){const c=getPixel(im,x,y);if(c[3])setPixel(out,im.width-x,y,c);}return out;}
export function grip(im:RGBAImage,predicted:number[],twoHands:boolean,socket?:number[]){
 let best={x:predicted[0]!,y:predicted[1]!,score:-Infinity};
 const x0=twoHands&&socket?socket[0]!-32:predicted[0]!-12,x1=twoHands&&socket?socket[0]!+32:predicted[0]!+12,y0=twoHands&&socket?socket[1]!-55:predicted[1]!-12,y1=twoHands&&socket?socket[1]!+52:predicted[1]!+12;
 for(let y=Math.max(0,Math.round(y0));y<=y1&&y<288;y++)for(let x=Math.max(0,Math.round(x0));x<=x1&&x<288;x++){
  if(twoHands&&socket&&Math.abs(x-socket[0]!)<10&&y>=socket[1]!-1&&y<=socket[1]!+10)continue;
  let n=0;for(let Y=y-2;Y<=y+2;Y++)for(let X=x-2;X<=x+2;X++){const[r,g,b,a]=getPixel(im,X,Y);if(a&&r<60&&g<63&&b<72&&Math.max(r,g,b)-Math.min(r,g,b)<15)n++;}
  const score=n-Math.hypot(x-predicted[0]!,y-predicted[1]!)*(twoHands?.15:.4);if(score>best.score)best={x,y,score};
 }
 const mask=createImage(288,288),radius=twoHands?7:5;for(let y=best.y-radius;y<=best.y+radius;y++)for(let x=best.x-radius;x<=best.x+radius;x++)if(Math.hypot(x-best.x,y-best.y)<=radius)setPixel(mask,x,y,getPixel(im,x,y));
 return{point:[best.x,best.y],mask,confidence:best.score};
}
