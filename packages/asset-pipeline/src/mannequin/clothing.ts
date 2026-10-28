// Phân lớp trên lưới native, không cắt ngang ảnh theo ba dải hình chữ nhật.
import { createImage, getPixel, setPixel, type RGBA, type RGBAImage } from '../image/rgba.js';

export const garmentSlots = [
 {id:'upper',name:'Áo',equipSlot:'body',order:2,items:[{id:'jacket_navy',name:'Áo xanh'},{id:'jacket_wine',name:'Áo đỏ rượu'},{id:'cuirass_silver',name:'Giáp bạc'},{id:'vest_leather',name:'Áo da đinh tán'},{id:'dragon_guard',name:'Giáp Long Vệ'}]},
 {id:'pants',name:'Quần',equipSlot:'legs',order:1,items:[{id:'pants_dark',name:'Quần tối'},{id:'pants_linen',name:'Quần sáng'},{id:'pants_mail',name:'Giáp chân lưới'},{id:'dragon_legs',name:'Quần Long Vệ'}]},
 {id:'boots',name:'Giày',equipSlot:'feet',order:0,items:[{id:'boots_brown',name:'Ủng nâu'},{id:'boots_black',name:'Ủng đen'},{id:'boots_plate',name:'Ủng thép'},{id:'dragon_boots',name:'Ủng Long Vệ'}]},
];
export type ClothingGuide = { waist: number; bootLeft: number; bootRight: number; splitX: number; hipLeft?:number; hipRight?:number; spread?:number };
export type Garments = { base:RGBAImage; upper:RGBAImage; pants:RGBAImage; boots:RGBAImage };

/** Cơ thể nam từ bản vẽ AI tám hướng, đưa lên lưới pose hiện hành. Chỉ mặc quần đùi. */
export function underwear(pieces:Garments, guide:ClothingGuide, neck:number,hand:[number,number],template:RGBAImage,direction:number,idle:boolean):RGBAImage {
 const out=createImage(112,112),waist=guide.waist;
 const shorts:RGBA[]=[[24,25,28,255],[35,37,41,255],[49,50,53,255]];
 const skinShades:RGBA[]=[[111,69,53,255],[145,91,65,255],[174,115,81,255],[205,149,108,255]];
 const leftHand=hand[0]<56;
 let other:[number,number]=[leftHand?72:40,waist+1],best=-Infinity;
 for(let y=neck+8;y<=waist+9;y++)for(let x=0;x<112;x++) {
  const c=getPixel(pieces.base,x,y);
  if(!skin(c)||Math.abs(x-56)<9||(leftHand?x<56:x>56))continue;
  const score=y+Math.abs(x-56)*.5;
  if(score>best){best=score;other=[x,y];}
 }
 const distanceToArm=(x:number,y:number,start:[number,number],end:[number,number]):number => {
  const vx=end[0]-start[0],vy=end[1]-start[1],length=vx*vx+vy*vy;
  const t=length?Math.max(0,Math.min(1,((x-start[0])*vx+(y-start[1])*vy)/length)):0;
  return Math.hypot(x-start[0]-t*vx,y-start[1]-t*vy);
 };
 const weaponShoulder:[number,number]=[leftHand?47:65,neck+6];
 const otherShoulder:[number,number]=[leftHand?65:47,neck+6];
 for(let y=0;y<112;y++)for(let x=0;x<112;x++) {
  const bare=getPixel(pieces.base,x,y),upper=getPixel(pieces.upper,x,y),pants=getPixel(pieces.pants,x,y),boots=getPixel(pieces.boots,x,y);
  // Cắt nền ở silhouette nguồn: không để tay/chân trần thò ra cạnh áo hoặc ủng.
  if(!bare[3]&&!upper[3]&&!pants[3]&&!boots[3])continue;
  const painted=getPixel(template,direction*112+x,y);
  const shade=x<52?1:x<59?3:2;
  const skinColor=skinShades[shade]!;
  if(idle&&y>neck&&painted[3])setPixel(out,x,y,painted);
  if(!idle) {
   const torso=y>neck&&y<waist+1&&Math.abs(x-56)<=9;
   const armA=distanceToArm(x,y,weaponShoulder,hand)<=3.5;
   const armB=distanceToArm(x,y,otherShoulder,other)<=3.5;
   if(torso)setPixel(out,x,y,painted[3]?painted:skinColor);
   if(armA||armB)setPixel(out,x,y,skinColor);
   if(y>=waist&&y<waist+9&&Math.abs(x-56)<8)setPixel(out,x,y,shorts[x<53?0:x<59?1:2]!);
   if(pants[3])setPixel(out,x,y,y<waist+11?shorts[x<55?0:x<61?1:2]!:skinColor);
   if(boots[3])setPixel(out,x,y,skinColor);
  }
  // Bàn tay của pose chuyển động luôn bám điểm cầm vũ khí, nhưng không mang pixel găng cũ.
  if(!idle&&bare[3]&&(Math.hypot(x-hand[0],y-hand[1])<8||Math.hypot(x-other[0],y-other[1])<8))setPixel(out,x,y,skinColor);
 }
 return out;
}

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
