import {getPixel,type RGBAImage} from '../image/rgba.js';
export function brooch(im:RGBAImage,slot:number,gender:string,expectedY?:number){
 const x0=Math.floor(slot*im.width/4),x1=Math.floor((slot+1)*im.width/4),cx=(x0+x1)/2,cy=expectedY??(gender==='male'?515:525),seen=new Set<number>(),groups:{x:number;y:number;w:number;h:number;area:number;score:number}[]=[];
 function yes(x:number,y:number){const[r,g,b,a]=getPixel(im,x,y);return a>=235&&r>175&&g>110&&b<95&&r>g+8&&g>b+55;}
 for(let y=420;y<575;y++)for(let x=Math.round(cx-80);x<cx+80;x++){
  const key=y*im.width+x;if(seen.has(key)||!yes(x,y))continue;const q=[[x,y]],pts:number[][]=[];seen.add(key);while(q.length){const[a,b]=q.pop()!;pts.push([a!,b!]);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const X=a!+dx!,Y=b!+dy!,k=Y*im.width+X;if(X<x0||X>=x1||Y<420||Y>=575||seen.has(k)||!yes(X,Y))continue;seen.add(k);q.push([X,Y]);}}
  if(pts.length<18)continue;const xs=pts.map(p=>p[0]!),ys=pts.map(p=>p[1]!),X=(Math.min(...xs)+Math.max(...xs))/2,Y=(Math.min(...ys)+Math.max(...ys))/2,w=Math.max(...xs)-Math.min(...xs)+1,h=Math.max(...ys)-Math.min(...ys)+1;if(w>36||h>34)continue;const score=Math.abs(X-cx)*.25+Math.abs(Y-cy)+Math.abs(w-h)*.5;groups.push({x:X,y:Y,w,h,area:pts.length,score});
 }
 groups.sort((a,b)=>a.score-b.score);if(!groups.length)throw Error('Thiếu khóa áo '+gender+'/'+slot);return{...groups[0]!,candidates:groups};
}
