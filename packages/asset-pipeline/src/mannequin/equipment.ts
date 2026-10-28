import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { blit, createImage, crop, getPixel, opaqueBounds, readPng, setPixel, writePng, type RGBAImage } from '../image/rgba.js';

/** Kit vẽ riêng; rect nguồn được khai theo ảnh thực, alpha cứng khi chuyển về native. */
export function loadEquipmentKit(root:string):RGBAImage[][] {
 const source=readPng(join(root,'source-art/equipment-kit.png'));
 const layout=JSON.parse(readFileSync(join(root,'source-art/equipment-layout.json'),'utf8'));
 if(source.width!==layout.width||source.height!==layout.height)throw new Error('Kit giáp khác kích thước đã kiểm');
 return Array.from({length:4},(_,row)=>Array.from({length:8},(_,dir)=>{
  const x=layout.x[dir],y=layout.y[row],w=layout.x[dir+1]-x,h=layout.y[row+1]-y;
  const cell=crop(source,x,y,w,h);
  for(let k=3;k<cell.data.length;k+=4)cell.data[k]=cell.data[k]!>=220?255:0;
  const bounds=opaqueBounds(cell);
  if(!bounds||bounds.x0===0||bounds.y0===0||bounds.x1===w||bounds.y1===h)throw new Error(`Kit ${row}/${dir} chạm biên cell, cần sửa layout`);
  return crop(cell,bounds.x0,bounds.y0,bounds.x1-bounds.x0,bounds.y1-bounds.y0);
 }));
}

function fitted(src:RGBAImage,w:number,h:number):RGBAImage {
 const out=createImage(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)setPixel(out,x,y,getPixel(src,Math.floor(x*src.width/w),Math.floor(y*src.height/h)));
 return out;
}

export function upperEquipment(silhouette:RGBAImage,art:RGBAImage,dir:number,neck:number,waist:number,leather:boolean):RGBAImage {
 const out=createImage(112,112);
 // May áo lót/ống tay riêng cho bộ giáp. Chỉ mượn hình dáng pose, không giữ pixel áo xanh/đỏ.
 for(let y=neck;y<=waist+2;y++)for(let x=0;x<112;x++) {
  const c=getPixel(silhouette,x,y);if(!c[3])continue;
  const light=Math.min(3,Math.floor((c[0]+c[1]+c[2])/165));
  const cloth=leather?[[48,32,27,255],[64,42,31,255],[85,56,38,255],[110,74,48,255]]
                     :[[28,35,41,255],[40,49,55,255],[57,67,72,255],[76,85,87,255]];
  setPixel(out,x,y,cloth[light]! as [number,number,number,number]);
 }
 const widths=leather?[30,27,22,27,30,27,22,27]:[36,32,25,32,36,32,25,32];
 const w=widths[dir]!;
 // Giáp nối vào cổ/vai của pose, không đổi đầu hoặc tay của mannequin.
 blit(out,fitted(art,w,30),56-Math.floor(w/2),neck-1);
 return out;
}

export function legEquipment(base:RGBAImage,art:RGBAImage,boots:boolean):RGBAImage {
 const out=createImage(112,112);
 // Mỗi pixel quần/ủng cũ được thay bằng vật liệu mới trước khi đặt chi tiết kit.
 for(let y=0;y<112;y++)for(let x=0;x<112;x++) {
  const c=getPixel(base,x,y);if(!c[3])continue;
  const light=Math.min(3,Math.floor((c[0]+c[1]+c[2])/155));
  const material=boots?[[45,49,51,255],[63,70,73,255],[88,98,101,255],[125,133,132,255]]
                      :[[46,53,58,255],[64,73,79,255],[88,101,108,255],[122,135,138,255]];
  setPixel(out,x,y,material[light]! as [number,number,number,number]);
 }
 for(const [left,right] of [[0,55],[56,111]]) {
  let x0=112,y0=112,x1=-1,y1=-1;
  for(let y=70;y<112;y++)for(let x=left!;x<=right!;x++)if(getPixel(base,x,y)[3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(x1-x0<2||y1-y0<3)continue;
  const pad=boots?1:0;
  const piece=fitted(art,x1-x0+1+pad*2,y1-y0+1);
  for(let y=0;y<piece.height;y++)for(let x=0;x<piece.width;x++){
   const dx=x0-pad+x,dy=y0+y,c=getPixel(piece,x,y);
   if(c[3]&&(boots||getPixel(base,dx,dy)[3]))setPixel(out,dx,dy,c);
  }
 }
 return out;
}

export function exportEquipmentKit(root:string,kit:RGBAImage[][]):void {
 const dirs=['S','SW','W','NW','N','NE','E','SE'];
 for(let row=0;row<4;row++)for(let d=0;d<8;d++)writePng(join(root,'clothing/kit',`${['cuirass','brigandine','greave','mail'][row]}_${dirs[d]}.png`),kit[row]![d]!);
}
