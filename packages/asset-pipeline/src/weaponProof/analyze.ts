// Dò lưỡi kiếm từ pixel kim loại; chỉ gợi ý, chưa tự nghiệm thu tay cầm.
import {ids,original,out,source,attackRevision,motionFamily} from './reference.js';
import {getPixel,createImage,blit,setPixel,writePng,scaleNearest} from '../image/rgba.js';
import {join} from 'node:path';
import {writeFileSync} from 'node:fs';
type Point=[number,number];
const specs=[];
for(const id of ids){const img=original(id),points:Point[]=[];for(let y=0;y<144;y++)for(let x=0;x<144;x++){const[r,g,b,a]=getPixel(img,x,y);if(a&&r>88&&Math.max(r,g,b)-Math.min(r,g,b)<38)points.push([x,y]);}
 const seen=new Set<string>(),components:Point[][]=[];
 const keys=new Set(points.map(p=>p.join(',')));
 for(const pt of points){const key=pt.join(',');if(seen.has(key))continue;const c:Point[]=[],todo=[pt];seen.add(key);while(todo.length){const p=todo.pop()!;c.push(p);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const q:Point=[p[0]+dx,p[1]+dy],k=q.join(',');if(keys.has(k)&&!seen.has(k)){seen.add(k);todo.push(q);}}}components.push(c);}
 const options=components.map(c=>{const mean:Point=[c.reduce((n,p)=>n+p[0],0)/c.length,c.reduce((n,p)=>n+p[1],0)/c.length];let xx=0,xy=0,yy=0;for(const p of c){const x=p[0]-mean[0],y=p[1]-mean[1];xx+=x*x;xy+=x*y;yy+=y*y;}const a=.5*Math.atan2(2*xy,xx-yy),v:Point=[Math.cos(a),Math.sin(a)],ts=c.map(p=>(p[0]-mean[0])*v[0]+(p[1]-mean[1])*v[1]),lo=Math.min(...ts),hi=Math.max(...ts),length=hi-lo,minor=c.reduce((n,p)=>n+Math.pow(-(p[0]-mean[0])*v[1]+(p[1]-mean[1])*v[0],2),0)/c.length;return{c,mean,v,lo,hi,length,minor,score:length/(1+minor)};}).filter(c=>c.length>=14&&c.c.length>=13).sort((a,b)=>b.score-a.score);
 const found=options[0];if(!found){specs.push({id,missing:true});continue;}
 const p0:Point=[found.mean[0]+found.lo*found.v[0],found.mean[1]+found.lo*found.v[1]],p1:Point=[found.mean[0]+found.hi*found.v[0],found.mean[1]+found.hi*found.v[1]];
 const gold=(p:Point)=>{let n=0;for(let y=Math.floor(p[1])-5;y<=p[1]+5;y++)for(let x=Math.floor(p[0])-5;x<=p[0]+5;x++){const[r,g,b,a]=getPixel(img,x,y);if(a&&r>130&&g>75&&r>g*1.05&&b<g*.75)n+=1/(1+Math.hypot(x-p[0],y-p[1]));}return n;};
 const start=gold(p0)>gold(p1)?p0:p1,tip=start===p0?p1:p0,dx=tip[0]-start[0],dy=tip[1]-start[1],len=Math.hypot(dx,dy),axis:Point=[dx/len,dy/len],frame=Number(id.split('-').at(-1)),handle=motionFamily?6:attackRevision&&id.startsWith('attack-')&&frame!==0&&frame!==11?8:3,grip:Point=[start[0]-axis[0]*handle,start[1]-axis[1]*handle];
 specs.push({id,bladeStart:start.map(n=>+n.toFixed(2)),tip:tip.map(n=>+n.toFixed(2)),grip:grip.map(n=>Math.round(n)),axis:axis.map(n=>+n.toFixed(5)),length:+len.toFixed(2),detectedPixels:found.c.length,reviewed:false});
}
writeFileSync(join(source,'detected-poses.json'),JSON.stringify(specs,null,2));
const contact=createImage(144*4,144*7);for(let i=0;i<ids.length;i++){const s=specs[i]!,img=original(ids[i]!);if(!('missing'in s)){for(const[x,y]of [s.grip!,s.tip!]){for(let j=-2;j<=2;j++){setPixel(img,Math.round(x!)+j,Math.round(y!),[255,70,220,255]);setPixel(img,Math.round(x!),Math.round(y!)+j,[255,70,220,255]);}}}blit(contact,img,i%4*144,Math.floor(i/4)*144);}writePng(join(out,'detected-axes-2x.png'),scaleNearest(contact,2));console.log(JSON.stringify(specs));
