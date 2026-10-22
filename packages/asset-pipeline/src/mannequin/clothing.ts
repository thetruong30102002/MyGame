// Phân lớp trên lưới native, không cắt ngang ảnh theo ba dải hình chữ nhật.
import { createImage, getPixel, setPixel, type RGBA, type RGBAImage } from '../image/rgba.js';

export const garmentSlots = [
 {id:'upper',name:'Áo',order:2,items:[{id:'jacket_navy',name:'Áo xanh'},{id:'jacket_wine',name:'Áo đỏ rượu'},{id:'cuirass_silver',name:'Giáp bạc'},{id:'vest_leather',name:'Áo da đinh tán'}]},
 {id:'pants',name:'Quần',order:1,items:[{id:'pants_dark',name:'Quần tối'},{id:'pants_linen',name:'Quần sáng'},{id:'pants_mail',name:'Giáp chân lưới'}]},
 {id:'boots',name:'Giày',order:0,items:[{id:'boots_brown',name:'Ủng nâu'},{id:'boots_black',name:'Ủng đen'},{id:'boots_plate',name:'Ủng thép'}]},
];
export type ClothingGuide = { waist: number; bootLeft: number; bootRight: number; splitX: number; hipLeft?:number; hipRight?:number; spread?:number };
export type Garments = { base:RGBAImage; upper:RGBAImage; pants:RGBAImage; boots:RGBAImage };

function skin(c:RGBA):boolean {
 const [r,g,b,a]=c;
 return a>0 && r>140 && g>75 && r-g>32 && r-g<95 && g-b>15 && g-b<80;
}

export function splitGarments(body:RGBAImage, guide:ClothingGuide):Garments {
 const result:Garments={base:createImage(112,112),upper:createImage(112,112),pants:createImage(112,112),boots:createImage(112,112)};
 for(let y=0;y<112;y++)for(let x=0;x<112;x++) {
  const c=getPixel(body,x,y);if(!c[3])continue;
  const [r,g,b]=c;
  // Tà áo/sash xanh ngọc vẫn thuộc áo, kể cả khi rủ xuống cạnh quần hoặc ủng.
  const teal=(color:RGBA) => color[3]>0&&color[1]>55&&color[2]>65&&color[1]-color[0]>35&&color[2]-color[0]>55;
  let sash=teal(c);
  // Chỉ nối bóng tối sát cụm sash thật, không coi toàn bộ vải navy của quần là xanh ngọc.
  if(!sash&&g>r*1.5&&b>r*1.5)
   for(let dy=-1;dy<=1&&!sash;dy++)for(let dx=-1;dx<=1;dx++)if(teal(getPixel(body,x+dx,y+dy))){sash=true;break;}
  const expansion=Math.min(1,Math.max(0,(y-guide.waist)/13))*(guide.spread??8);
  const legRegion=x>=(guide.hipLeft??48)-expansion&&x<=(guide.hipRight??65)+expansion;
  let target: keyof Garments;
  if(y<guide.waist+8 && skin(c)) target='base';
  else if(sash || y<guide.waist || (!legRegion&&y<82)) target='upper';
  else if(y >= (x<guide.splitX?guide.bootLeft:guide.bootRight) || (y>=82&&r>g*1.05&&g>b*1.05)) target='boots';
  else target='pants';
  setPixel(result[target],x,y,c);
 }
 return result;
}

export function garmentVariant(src:RGBAImage, slot:string):RGBAImage {
 const out=createImage(112,112);
 for(let y=0;y<112;y++)for(let x=0;x<112;x++) {
  const c=getPixel(src,x,y);if(!c[3])continue;
  let [r,g,b,a]=c;
  if(slot==='upper') {
   // Da tay và viền kim loại giữ nguyên. Đổi vải xanh/navy + sash theo ramp rượu vang.
   if((b>r*1.12&&b>g*.88)||(g>r*1.2&&b>r*1.15)) {
    const lum=(r+g+b)/3;
    r=Math.min(255,Math.round(lum*1.35+9));g=Math.round(lum*.55+3);b=Math.round(lum*.76+7);
   }
  } else if(slot==='pants') {
   // Quần linen sáng: giữ pixel viền tối, chuyển các cụm vải cùng bảng độ sáng.
   const lum=(r+g+b)/3;
   if(lum>24) {r=Math.min(240,Math.round(lum*1.45+61));g=Math.min(230,Math.round(lum*1.3+53));b=Math.min(210,Math.round(lum*1.06+40));}
  } else if(slot==='boots') {
   // Da đen than; khóa vàng vẫn vàng.
   if(r>g&&g>b && !(r>170&&g>120&&r-g<65)) {
    const lum=(r+g+b)/3;r=Math.round(lum*.42+7);g=Math.round(lum*.45+9);b=Math.round(lum*.55+13);
   }
  }
  setPixel(out,x,y,[r,g,b,a]);
 }
 return out;
}
