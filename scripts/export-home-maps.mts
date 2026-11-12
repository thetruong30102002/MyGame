/** Ghép map Gia viên từ các atlas đã có + hình GPT đã chuẩn hoá; không sinh hình mới hoặc sửa map thế giới thật. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {blit,createImage,crop,readPng,writePng,type RGBAImage} from '../packages/asset-pipeline/src/image/rgba.js';
import {packShelf,propMeta,type PropMeta} from '../packages/asset-pipeline/src/props/buildProps.js';
import type {PropKind} from '../packages/asset-pipeline/src/props/humanKingdom.js';
const out='assets/home/maps';mkdirSync(out,{recursive:true});
const homeAtlas=JSON.parse(readFileSync('assets/home/props.json','utf8'));
const homeMeta=JSON.parse(readFileSync('assets/home/props.meta.json','utf8'));
const townAtlas=JSON.parse(readFileSync('assets/maps/human/props.json','utf8'));
const townMeta=JSON.parse(readFileSync('assets/maps/human/props.meta.json','utf8'));
const home=readPng('assets/home/props.png'),town=readPng('assets/maps/human/props.png');
const items=Object.entries(homeAtlas.frames).map(([k,v]:[string,any])=>({id:k.split('/')[1]!,img:crop(home,v.frame.x,v.frame.y,v.frame.w,v.frame.h)}));
const meta:Record<string,PropMeta>={...homeMeta};
for(const id of ['tree','barrel','log_bench','lamp','flower_planter']){const f=townAtlas.frames['human/'+id].frame;items.push({id,img:crop(town,f.x,f.y,f.w,f.h)});meta[id]=townMeta[id];}

// ---- Hình GPT (Codex) đã chuẩn hoá — docs/ke-hoach-nha-rieng.md mục 9.12 ----
const GPT='packages/asset-pipeline/sources/gpt-review';
const gpt=(batch:string,name:string):RGBAImage=>{const f=join(GPT,batch,'chuan-hoa',name+'.png');if(!existsSync(f))throw new Error('Thiếu ảnh GPT chuẩn hoá '+f);return readPng(f);};
/** Đồ GPT đứng trên nền: chân chặn theo tỉ lệ bề ngang (w) và độ sâu (h px). */
const addGpt=(id:string,batch:string,name:string,kind:PropKind,w:number,h:number,blocks=true)=>{const img=gpt(batch,name);items.push({id,img});meta[id]=propMeta({id,path:'',kind,footprint:{w:blocks?w:0,h:blocks?h:0},blocks},img);};
const addImg=(id:string,img:RGBAImage)=>{items.push({id,img});meta[id]=propMeta({id,path:'',kind:'flower',footprint:{w:0,h:0},blocks:false},img);};
// Khuôn viên: nhà chính / giếng / nhà kính / chuồng gà đợt 1, rào gỗ đợt 7.
addGpt('gv_nha_chinh','dot-1','gv_nha_chinh','building',0.86,58);
addGpt('gv_gieng','dot-1','gv_gieng','decor',0.8,18);
addGpt('gv_nha_kinh','dot-1','gv_nha_kinh','building',0.9,46);
addGpt('gv_chuong_ga','dot-1','gv_chuong_ga','building',0.85,34);
addGpt('gv_rao_go','dot-7','rao_go_ngang','decor',1,8);
addGpt('gv_rao_cot','dot-7','rao_go_cot','decor',0.5,8);
// Trong nhà: 3 phòng đúng bố cục ảnh ghép thử đã gửi (chủ dự án 11/11 "nhà thì phải có đủ phòng chứ phòng ngủ, bếp, khách",
// "Mỗi phòng là 1 map chứ nhìn mới đúng", "Phòng ngủ nên để trên tầng") — đồ GPT đợt 2 / 3 / 4 + đồ PixelLab Gia viên.
const W2=(n:string,w=0.9,h=16)=>addGpt('gv_'+n,'dot-2',n,'decor',w,h),W3=(n:string,w=0.9,h=16)=>addGpt('gv_'+n,'dot-3',n,'decor',w,h);
W3('dong_ho_dung',0.8,12);W3('ghe_dai',0.9,20);W3('ke_trung_bay');W2('cau_thang_go',0.7,10);W3('ban_tra',0.85,14);
W3('chan_bat');W3('bep_lo_cui',0.9,18);W3('bon_rua',0.85,14);W3('lo_nuong_banh',0.9,18);W3('tu_lanh_da',0.9,18);W3('quay_so_che',0.95,22);W3('thung_tao_rau',0.85,14);W3('ban_an_dai',0.9,26);
W3('chau_cay_lon',0.6,12);W3('ban_trang_diem',0.9,16);W3('giuong_doi',0.9,48);W3('tu_dau_giuong',0.9,14);W3('tu_ngan_keo',0.9,14);
addGpt('gv_lo_cau_thang_xuong','dot-4','lo_cau_thang_xuong','decor',0.9,80);
addGpt('gv_ke_gia_vi','dot-3','ke_gia_vi','flower',0,0,false);
addGpt('gv_tham_lon','dot-3','tham_lon','flower',0,0,false);
addGpt('gv_den_chum_go','dot-2','den_chum_go','flower',0,0,false);

// ---- Nền trong nhà: sàn vẽ bằng code + tường GPT ghép liền + thảm chùi chân ở cửa — nướng vào ảnh nền (decal) ----
const T=32,WALL=128;// hàng 0–3 là dải tường (128 px), sàn bắt đầu ở y = 128; viền 1 ô trái / phải / dưới
type RGB=[number,number,number];
const shade=(img:RGBAImage,x:number,y:number,c:RGB,k:number)=>img.data.set([Math.min(255,Math.round(c[0]*k)),Math.min(255,Math.round(c[1]*k)),Math.min(255,Math.round(c[2]*k)),255],(y*img.width+x)*4);
/** Sàn ván gỗ: ván dài 96 px, 4 hàng ván / ô 32 px, mạch và sắc lệch theo hàng (cùng công thức bản ghép thử). */
function woodFloor(w:number,h:number,base:RGB):RGBAImage{
 const img=createImage(w,h),tones=[1,0.92,1.06,0.96,1.02,0.9];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const j=Math.floor(y/T),row=Math.floor((y%T)/8),y0=row*8,yy=y%T,off=(row*40+(j%4)*56)%96,gx=x+off;
  const plank=Math.floor(gx/96)+row*2+(j%4)*3;let k=tones[plank%tones.length]!;
  if(yy===y0+7||gx%96===0)k=0.55;else if(yy===y0)k*=1.1;else if((gx*5+yy*3)%37===0)k*=0.85;
  shade(img,x,y,base,k);
 }
 return img;
}
/** Sàn đá lát bếp: viên 16 px so le, mạch tối. */
function flagFloor(w:number,h:number,base:RGB):RGBAImage{
 const img=createImage(w,h),tones=[1,0.94,1.05,0.97];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const sh=Math.floor(y/16)%2?8:0,sx=(x+sh)%16,stone=(Math.floor((x+sh)/16)+Math.floor(y/16)*3)%4;let k=tones[stone]!;
  if(y%16===0||sx===0)k=0.62;else if(y%16===1||sx===1)k*=1.08;
  shade(img,x,y,base,k);
 }
 return img;
}
/** Thảm chùi chân ở khoảng hở cửa (ngang cho cửa dưới, dọc cho cửa bên). */
function mat(w:number,h:number):RGBAImage{
 const m=createImage(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const edge=x<2||y<2||x>=w-2||y>=h-2,stripe=w>h?x>=4&&x<w-4&&(x-4)%6<2:y>=4&&y<h-4&&(y-4)%6<2;
  m.data.set(edge?[40,26,18,255]:stripe?[186,120,70,255]:[150,64,46,255],(y*w+x)*4);
 }
 return m;
}
addImg('gv_tham_cua_ngang',mat(52,14));addImg('gv_tham_cua_doc',mat(14,52));
/** Dải tường: các mảng xen kẽ, chồng 4 px chỗ nối cột, bóng đổ 6 px dưới chân tường. */
function wallBand(id:string,names:readonly (readonly [string,string])[],width:number):void{
 const ws=names.map(([b,n])=>gpt(b,n)),band=createImage(width,ws[0]!.height+6);
 for(let x=0,k=0;x<width;k++){const w=ws[k%ws.length]!;blit(band,crop(w,0,0,Math.min(w.width,width-x),w.height),x,0);x+=w.width-4;}
 for(let y=band.height-6;y<band.height;y++)for(let x=0;x<width;x++)if(!band.data[(y*width+x)*4+3])band.data.set([24,16,10,255],(y*width+x)*4);
 addImg(id,band);
}

// ---- Dựng 3 phòng (toạ độ chép từ ảnh ghép thử: sàn x = fx + 32, y = fy + 128; đồ dựa tường chân ở y = 134) ----
type Pt={id:string;x:number;y:number};type Spot={id:string;name:string;x:number;y:number;r:number};
interface Room{id:string;name:string;cols:number;rows:number;doors:{bottom?:boolean;left?:boolean;right?:boolean};props:Pt[];decals:Pt[];spots:Spot[];spawn:{x:number;y:number}}
const p=(id:string,x:number,y:number):Pt=>({id,x,y});
const X=(fx:number)=>fx+T,Y=(fy:number)=>fy+WALL;
function makeRoom(id:string,name:string,cols:number,rows:number,floor:RGBAImage,walls:readonly (readonly [string,string])[],doors:Room['doors']):Room{
 addImg(`gv_san_${id}`,floor);wallBand(`gv_tuong_${id}`,walls,cols*T);
 const r:Room={id,name,cols,rows,doors,props:[],decals:[p(`gv_san_${id}`,X(cols*T/2),Y(rows*T)),p(`gv_tuong_${id}`,X(cols*T/2),Y(4)+6)],spots:[],spawn:{x:X(cols*T/2),y:Y(rows*T-40)}};
 const midY=Y(rows*T/2+16);
 if(doors.bottom)r.decals.push(p('gv_tham_cua_ngang',X(cols*T/2),Y(rows*T)));
 if(doors.left)r.decals.push(p('gv_tham_cua_doc',X(9),midY+26));
 if(doors.right)r.decals.push(p('gv_tham_cua_doc',X(cols*T-9),midY+26));
 return r;
}
const onWall=(r:Room,id:string,fx:number,lift=0)=>{if(lift)r.decals.push(p(id,X(fx),Y(6)-lift));else r.props.push(p(id,X(fx),Y(6)));};
const put=(r:Room,id:string,fx:number,fy:number)=>r.props.push(p(id,X(fx),Y(fy)));
const flat=(r:Room,id:string,fx:number,fy:number)=>r.decals.push(p(id,X(fx),Y(fy)+meta[id]!.h));
const hang=(r:Room,id:string,fx:number)=>r.decals.push(p(id,X(fx),4+meta[id]!.h));

// Phòng khách 18×9: lối ra vườn cạnh dưới, cửa trái sang bếp, cầu thang góc phải lên tầng.
const lv=makeRoom('house','Phòng khách',18,9,woodFloor(18*T,9*T,[176,124,78]),[['dot-2','tuong_thach_cao'],['dot-3','tuong_thach_cao_cua_so']],{bottom:true,left:true});
onWall(lv,'gv_dong_ho_dung',36);onWall(lv,'home_bookshelf',98);onWall(lv,'home_fireplace',178);onWall(lv,'gv_ghe_dai',296);onWall(lv,'gv_ke_trung_bay',404);onWall(lv,'gv_cau_thang_go',516);
flat(lv,'gv_tham_lon',296,20);put(lv,'gv_ban_tra',296,64);put(lv,'home_potted_plant',40,280);put(lv,'home_potted_plant',536,280);hang(lv,'gv_den_chum_go',296);
lv.spots.push({id:'door_garden',name:'Ra khuôn viên',x:X(288),y:Y(272),r:70},{id:'door_kitchen',name:'Sang bếp',x:X(16),y:Y(160),r:70},{id:'stairs_up',name:'Lên phòng ngủ',x:X(516),y:Y(30),r:80},
 {id:'from_garden',name:'Cửa vào',x:X(288),y:Y(236),r:40},{id:'from_kitchen',name:'Cửa bếp',x:X(48),y:Y(160),r:40},{id:'from_bedroom',name:'Chân cầu thang',x:X(470),y:Y(50),r:40});
lv.spots.push({id:'steward',name:'Quản gia',x:X(200),y:Y(150),r:80});
lv.spawn={x:X(288),y:Y(236)};
// Bếp 14×9: cửa phải về phòng khách; điểm nấu ăn.
const kt=makeRoom('kitchen','Bếp',14,9,flagFloor(14*T,9*T,[168,150,128]),[['dot-3','tuong_bep_gach']],{right:true});
onWall(kt,'gv_chan_bat',44);onWall(kt,'gv_bep_lo_cui',132);onWall(kt,'gv_ke_gia_vi',206,58);onWall(kt,'gv_bon_rua',212);onWall(kt,'gv_lo_nuong_banh',300);onWall(kt,'gv_tu_lanh_da',395);
put(kt,'gv_quay_so_che',170,96);put(kt,'gv_thung_tao_rau',40,120);put(kt,'home_rice_bin',40,190);put(kt,'home_water_barrel',410,120);put(kt,'gv_ban_an_dai',210,250);hang(kt,'gv_den_chum_go',210);
kt.spots.push({id:'door_house',name:'Về phòng khách',x:X(432),y:Y(160),r:70},{id:'from_house',name:'Cửa phòng khách',x:X(400),y:Y(160),r:40},{id:'stove',name:'Bếp lò',x:X(132),y:Y(40),r:70});
kt.spawn={x:X(400),y:Y(160)};
// Phòng ngủ tầng 2, 14×9: lỗ cầu thang xuống góc phải; tủ quần áo đổi bộ đồ ở nhà.
const bd=makeRoom('bedroom','Phòng ngủ',14,9,woodFloor(14*T,9*T,[168,112,72]),[['dot-3','tuong_thach_cao_cua_so'],['dot-2','tuong_thach_cao']],{});
onWall(bd,'gv_chau_cay_lon',36);onWall(bd,'home_wardrobe',300);onWall(bd,'gv_ban_trang_diem',370);
put(bd,'gv_giuong_doi',170,meta['gv_giuong_doi']!.h-34);put(bd,'gv_tu_dau_giuong',108,20);put(bd,'gv_tu_dau_giuong',232,20);flat(bd,'gv_tham_lon',170,40);
put(bd,'home_chest',170,136);put(bd,'gv_tu_ngan_keo',40,200);put(bd,'gv_lo_cau_thang_xuong',384,280);
bd.spots.push({id:'stairs_down',name:'Xuống phòng khách',x:X(384),y:Y(230),r:80},{id:'from_house',name:'Đầu cầu thang',x:X(300),y:Y(250),r:40},{id:'wardrobe',name:'Tủ quần áo',x:X(300),y:Y(30),r:80});
bd.spawn={x:X(300),y:Y(250)};

// ---- Khu chăn nuôi ngoài trời (chủ dự án 12/11: "Chăn nuôi thì phải có cả chuồng ngoài trời bên ngoài nhà nữa chứ", "Ở ngoài nhà sắp xếp
// k đúng lắm còn nơi chuồng gà, chuồng heo"): bãi quây bò / cừu + sân gà kín 4 phía (lớp rào dựng sẵn bằng `scripts/build-home-pens.py`
// theo bản ghép thử đã duyệt), con vật PixelLab đứng tĩnh (bò ×2, cừu ×1,5, gà ×0,6), đồ chăn nuôi GPT đợt 7. Chưa có heo: chờ vẽ.
const PENS='packages/asset-pipeline/sources/home-pens';
interface PenInfo{width:number;height:number;backY:number;frontY:number;inner:{x0:number;x1:number;y0:number;y1:number};layers:Record<string,{x:number;y:number;w:number;h:number}>}
const pens:Record<string,PenInfo>={};
for(const pen of ['bo_cuu','san_ga']){
 if(!existsSync(join(PENS,pen,'pen.json')))throw new Error('Chưa dựng lớp rào — chạy python -I scripts/build-home-pens.py');
 const info=JSON.parse(readFileSync(join(PENS,pen,'pen.json'),'utf8')) as PenInfo;pens[pen]=info;
 for(const [layer,box] of Object.entries(info.layers)){
  const id=`gv_rao_${pen}_${layer}`,img=readPng(join(PENS,pen,layer+'.png'));items.push({id,img});
  // Hàng sau / trước chặn dải 8 px ở chân; cạnh bên chặn suốt chiều dọc.
  meta[id]=propMeta({id,path:'',kind:'decor',footprint:layer.startsWith('side')?{w:1,h:box.h-6}:{w:1,h:8},blocks:true},img);
 }
}
for(const a of ['bo_e','bo_s','cuu_s','cuu_w','ga_s','ga_e','ga_w']){const id='gv_'+a,img=readPng(join(PENS,'animals',a+'.png'));items.push({id,img});meta[id]=propMeta({id,path:'',kind:'decor',footprint:{w:0.5,h:8},blocks:true},img);}
for(const [n,w,h] of [['chuong_bo_lon',0.9,60],['chuong_ga_lon',0.9,30],['mang_nuoc_da',0.95,14],['mang_thoc_ga',0.9,12],['gia_co_kho',0.85,16],['cuon_rom_tron',0.85,12],
 ['xe_thung_sua',0.85,12],['xe_cut_kit_rom',0.85,10],['to_ong_go',0.8,12],['to_ong_rom',0.8,12],['cot_gai_bo',0.6,10]] as const)addGpt('gv_'+n,'dot-7',n,'decor',w,h);
addGpt('gv_cho_tam_cat','dot-7','cho_tam_cat','flower',0,0,false);addGpt('gv_bon_hoa_ong','dot-7','bon_hoa_ong','decor',0.9,10);

/** Bể cá tạm vẽ bằng code (chủ dự án 12/11 "Bể cá cũng là trang trí trong nhà"): tủ gỗ 22 px + bể kính 88 × 54, nước hai tông, cát, sỏi,
 * rong; vùng nước khớp `FARM_TANK.water` (neo giữa đáy). Thay bằng hình GPT khi có (đề bài đợt sau). */
function fishTank():RGBAImage{
 const W=96,H=88,img=createImage(W,H);
 const rect=(x0:number,y0:number,x1:number,y1:number,c:[number,number,number])=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)img.data.set([...c,255],(y*W+x)*4);};
 rect(2,64,94,88,[40,26,18]);rect(4,66,92,86,[138,88,50]);rect(4,66,92,68,[176,116,66]);// tủ gỗ
 for(let x=10;x<90;x+=20)rect(x,70,x+16,84,[118,74,42]);
 rect(4,8,92,64,[24,30,40]);// khung bể
 rect(6,10,90,62,[96,176,210]);rect(6,10,90,18,[150,214,236]);// nước + mặt nước sáng
 rect(6,52,90,62,[214,190,130]);for(let x=8;x<88;x+=7)rect(x,50+(x%3),x+4,54,[150,140,128]);// cát + sỏi
 for(const [x,h] of [[16,26],[22,18],[72,30],[78,20]] as const)for(let y=52-h;y<52;y++)rect(x+((y>>2)%2),y,x+2+((y>>2)%2),y+1,[46,130,70]);
 for(let i=0;i<10;i++)rect(80-i,14+i*2,82-i,15+i*2,[210,240,250]);// vệt sáng kính
 rect(4,6,92,10,[60,44,30]);// nắp
 return img;
}
addImg('gv_be_ca',fishTank());
// ---- Bộ sưu tập đồ bày trí (chủ dự án 12/11 chọn B: mua bằng xu ở người bán đồ Gia viên, Quản gia đặt) ----
// Nội thất 16 kiểu nhà (đợt 8 / 9 / 11: giường, sofa, lò sưởi, đèn treo, thảm, món đặc trưng — giá tăng theo bậc nhà) + đồ đợt 3 / 5
// (tên theo bảng đề bài, giá theo cỡ). Tường đi theo kiểu nhà, không bán lẻ. Đèn treo gờ trần, thảm nằm phẳng dưới đồ.
const HOUSE_TIERS:[string,string,string][]=[['dq','Đồng quê','dot-8'],['nk','Nấm khổng lồ','dot-11'],['dv','Đá vùng cao','dot-8'],['cx','Cối xay hoa','dot-11'],['tt','Gỗ tuyết tùng','dot-8'],['ns','Nhà sàn','dot-8'],['bh','Thuyền trưởng','dot-11'],['sm','Sa mạc','dot-9'],['ct','Nhà cây Elf','dot-11'],['gd','Gạch đỏ','dot-9'],['pd','Phương Đông','dot-11'],['ln','Người lùn','dot-11'],['ld','Lâu đài','dot-9'],['lk','Lâu kính','dot-11'],['lb','Lâu đài băng','dot-11'],['hv','Haven','dot-9']];
const HOUSE_KINDS:[string,string,number][]=[['giuong','Giường',800],['sofa','Sofa',800],['lo_suoi','Lò sưởi',2000],['den','Đèn treo',300],['tham','Thảm',300],['dac_trung','Món đặc trưng',5000]];
const collection:{id:string;name:string;price:number}[]=[];
HOUSE_TIERS.forEach(([pre,house,batch],tier)=>{for(const [k,label,base] of HOUSE_KINDS){const id=`gv_${pre}_${k}`;const flat=k==='tham'||k==='den';
 if(!meta[id])addGpt(id,batch,`${pre}_${k}`,flat?'flower':'decor',k==='giuong'?0.9:0.85,flat?0:k==='giuong'?40:18,!flat);
 collection.push({id,name:`${label} · ${house}`,price:Math.round(base*(1+tier*0.25)/50)*50});}});
for(const [batch,n,name] of [['dot-3','ban_an_dai','Bàn ăn dài + ghế'],['dot-3','ban_tra','Bàn trà thấp'],['dot-3','ban_trang_diem','Bàn trang điểm gương'],['dot-3','bep_lo_cui','Bếp lò củi'],['dot-3','bon_rua','Bồn rửa đá có bơm tay'],['dot-3','chan_bat','Chạn bát'],['dot-3','chau_cay_lon','Chậu cây lớn'],['dot-3','dong_ho_dung','Đồng hồ quả lắc đứng'],['dot-3','ghe_dai','Ghế dài bọc nệm (sofa)'],['dot-3','giuong_doi','Giường đôi lớn'],['dot-3','ke_gia_vi','Kệ gia vị + giá treo'],['dot-3','ke_trung_bay','Tủ kính trưng bày'],['dot-3','lo_nuong_banh','Lò nướng bánh gạch'],['dot-3','quay_so_che','Quầy sơ chế (thớt)'],['dot-3','tham_lon','Thảm lớn chữ nhật'],['dot-3','thung_tao_rau','Thùng rau củ'],['dot-3','tu_dau_giuong','Tủ đầu giường + đèn'],['dot-3','tu_lanh_da','Tủ đá ướp lạnh'],['dot-3','tu_ngan_keo','Tủ ngăn kéo'],['dot-5','ban_tho_pha_le','Bàn thờ pha lê Haven'],['dot-5','bang_treo_chia_khoa','Bảng treo chìa khoá'],['dot-5','binh_hoa_lon','Bình hoa lớn'],['dot-5','binh_phong','Bình phong gấp'],['dot-5','bon_tam_go','Bồn tắm gỗ'],['dot-5','buc_giang','Bục giảng'],['dot-5','chan_nen_dung','Chân nến đứng'],['dot-5','chau_cay_duong_xi','Chậu dương xỉ treo'],['dot-5','chau_rua_mat','Giá chậu rửa mặt'],['dot-5','ghe_bang_dai','Ghế băng dài trong đền'],['dot-5','ghe_tua_cua_so','Ghế tựa đọc sách'],['dot-5','gio_do_giat','Giỏ đồ giặt'],['dot-5','giuong_don','Giường đơn phòng trọ'],['dot-5','ke_khan','Kệ khăn tắm'],['dot-5','ke_nen_cau_nguyen','Kệ nến cầu nguyện'],['dot-5','quay_le_tan','Quầy lễ tân nhà trọ'],['dot-5','ruong_hanh_ly','Rương hành lý'],['dot-5','tham_do_dai','Thảm đỏ dài'],['dot-5','tu_guong_rua','Tủ gương rửa mặt']] as const){const id=`gv_${n}`;const flat=n.startsWith('tham')||n.startsWith('den_chum');
 if(!meta[id])addGpt(id,batch,n,flat?'flower':'decor',0.85,flat?0:16,!flat);
 const m=meta[id]!,big=Math.max(m.w,m.h);collection.push({id,name,price:big<60?300:big<100?800:2000});}
const {image,frames}=packShelf(items,2048);writePng(join(out,'props.png'),image);
writeFileSync(join(out,'props.json'),JSON.stringify({frames:Object.fromEntries(Object.entries(frames).map(([id,frame])=>['home/'+id,{frame}])),meta:{image:'props.png',size:{w:image.width,h:image.height}}}));
writeFileSync(join(out,'props.meta.json'),JSON.stringify(meta));
const base={tileSize:32,seed:20261108,npcs:[],monsterZones:[],boss:null,dummies:[],exits:[],areas:[]};
const roomMap=(r:Room)=>{
 const H=r.rows+5,W=r.cols+2,mid=Math.floor(Y(r.rows*T/2+16)/T);
 return {...base,id:r.id,name:r.name,width:W,height:H,spawn:r.spawn,props:r.props,decals:r.decals,spots:r.spots,
  terrain:Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>{
   if(x>=1&&x<=r.cols&&y>=4&&y<=r.rows+3)return'b';
   if(r.doors.bottom&&y===H-1&&(x===Math.floor(W/2)-1||x===Math.floor(W/2)))return'b';
   if((r.doors.left&&x===0||r.doors.right&&x===W-1)&&(y===mid||y===mid-1))return'b';
   return'#';
  }).join(''))};
};
// ---- Bày trí (chủ dự án 12/11: "Quản gia chỉ là người để mở bảng chọn các đồ vật trong nhà sắp xếp như bếp, giường, ghế, bể cá"):
// đồ trong 3 phòng thành ĐỒ BÀY TRÍ theo dữ liệu người chơi (máy chủ giữ), bố cục ảnh ghép thử là MẶC ĐỊNH; chỉ cầu thang, lỗ cầu thang và
// tủ quần áo (chỗ đổi bộ đồ ở nhà) giữ cố định trong map. Ghi danh mục + mặc định sang `packages/sim/src/farmDecor.generated.ts`.
const FIXED=new Set(['gv_cau_thang_go','gv_lo_cau_thang_xuong','home_wardrobe']);
const DECOR_NAMES:Record<string,string>={gv_dong_ho_dung:'Đồng hồ cây',home_bookshelf:'Kệ sách',home_fireplace:'Lò sưởi đá',gv_ghe_dai:'Ghế sofa dài',gv_ke_trung_bay:'Tủ kính trưng bày',
 gv_ban_tra:'Bàn trà',home_potted_plant:'Chậu cây nhỏ',gv_chan_bat:'Chạn bát',gv_bep_lo_cui:'Bếp lò củi',gv_bon_rua:'Bồn rửa',gv_lo_nuong_banh:'Lò nướng bánh',gv_tu_lanh_da:'Tủ đá',
 gv_quay_so_che:'Quầy sơ chế',gv_thung_tao_rau:'Thùng rau củ',home_rice_bin:'Thùng gạo',home_water_barrel:'Thùng nước',gv_ban_an_dai:'Bàn ăn dài',gv_chau_cay_lon:'Chậu cây lớn',
 gv_ban_trang_diem:'Bàn trang điểm',gv_giuong_doi:'Giường đôi',gv_tu_dau_giuong:'Tủ đầu giường',home_chest:'Rương',gv_tu_ngan_keo:'Tủ ngăn kéo',gv_be_ca:'Bể cá'};
const decorDefault:Record<string,Pt[]>={},fixedProps:Record<string,Pt[]>={};
for(const r of [lv,kt,bd]){decorDefault[r.id]=r.props.filter(q=>!FIXED.has(q.id));fixedProps[r.id]=r.props.filter(q=>FIXED.has(q.id));r.props=fixedProps[r.id]!;}
for(const c of collection)DECOR_NAMES[c.id]=c.name;
for(const id of new Set([...Object.values(decorDefault).flat().map(q=>q.id),'gv_be_ca']))if(!DECOR_NAMES[id])throw new Error('Thiếu tên đồ bày trí '+id);
const priceOf=(id:string)=>collection.find(c=>c.id===id)?.price??(()=>{const m=meta[id]!,big=Math.max(m.w,m.h);return big<60?300:big<100?800:2000;})();
const catOf=(id:string)=>/giuong/.test(id)?'Giường':/den/.test(id)?'Đèn':/tham/.test(id)?'Thảm':/lo_suoi|fireplace/.test(id)?'Lò sưởi':/bon_tam|chau_rua|gio_do|ke_khan|tu_guong/.test(id)?'Phòng tắm':
 /bep|lo_nuong|bon_rua|quay_so_che|tu_lanh|thung|chan_bat|ke_gia_vi|rice_bin|water_barrel|ban_an/.test(id)?'Bếp':/sofa|ghe|armchair/.test(id)?'Ghế · sofa':/ban_/.test(id)?'Bàn':/tu_|ke_|chest|ruong|bookshelf|wardrobe/.test(id)?'Tủ · kệ':'Trang trí';
const placeOf=(id:string)=>/_den$|den_chum/.test(id)?'lamp':/tham/.test(id)?'rug':'floor';
{
 const fp=(id:string)=>{const m=meta[id]!;return{name:DECOR_NAMES[id]??id,w:m.w,h:m.h,fx:m.footprint.x,fw:m.footprint.w,fh:m.footprint.h,blocks:m.blocks,cat:catOf(id),price:priceOf(id),place:placeOf(id)};};
 const items=Object.fromEntries([...new Set([...Object.values(decorDefault).flat().map(q=>q.id),'gv_be_ca',...collection.map(c=>c.id)])].sort().map(id=>[id,fp(id)]));
 const floor=Object.fromEntries([lv,kt,bd].map(r=>[r.id,{x0:X(0),x1:X(r.cols*T),y0:Y(0),y1:Y(r.rows*T)}]));
 const solids=Object.fromEntries([lv,kt,bd].map(r=>[r.id,fixedProps[r.id]!.filter(q=>meta[q.id]!.blocks).map(q=>{const m=meta[q.id]!;return{x0:q.x+m.footprint.x,x1:q.x+m.footprint.x+m.footprint.w,y0:q.y+m.footprint.y,y1:q.y};})]));
 const doors=Object.fromEntries([lv,kt,bd].map(r=>[r.id,r.spots.filter(sp=>/^door_|^stairs_|^wardrobe$/.test(sp.id)).map(sp=>({x:sp.x,y:sp.y}))]));
 writeFileSync('packages/sim/src/farmDecor.generated.ts',`// SINH TỰ ĐỘNG bởi scripts/export-home-maps.mts — đừng sửa tay. Đồ bày trí trong nhà Gia viên: danh mục (cỡ ảnh + chân chặn, px),
// bố cục mặc định từng phòng (ảnh ghép thử đã duyệt), sàn đặt được, khối cố định (cầu thang / tủ quần áo) và các cửa phải chừa lối.
export const DECOR_ITEMS: Record<string,{name:string;w:number;h:number;fx:number;fw:number;fh:number;blocks:boolean;cat:string;price:number;place:'floor'|'rug'|'lamp'}> = ${JSON.stringify(items)};
export const DECOR_DEFAULT: Record<string,{id:string;x:number;y:number}[]> = ${JSON.stringify(decorDefault)};
export const DECOR_FLOOR: Record<string,{x0:number;x1:number;y0:number;y1:number}> = ${JSON.stringify(floor)};
export const DECOR_FIXED: Record<string,{x0:number;x1:number;y0:number;y1:number}[]> = ${JSON.stringify(solids)};
export const DECOR_DOORS: Record<string,{x:number;y:number}[]> = ${JSON.stringify(doors)};
`);
}
const rooms=[lv,kt,bd].map(roomMap);

// ---- Khuôn viên 48 × 32 ô: nửa tây giữ nhà / ruộng / giếng / hộp gửi hàng (toạ độ luật máy chủ `FARM_LAYOUT`), nửa đông là khu chăn
// nuôi; hồ câu là map riêng dùng chung `home/pond` (chủ dự án 12/11), cổng ra hồ ở mép nam (FARM_LAYOUT.pondGate*). ----
const GW=48,GH=32;
const terrain=Array.from({length:GH},(_,y)=>Array.from({length:GW},(_,x)=>{
 if(x===0||y===0||x===GW-1||y===GH-1)return'#';
 if((x===7||x===8)&&y>=14&&y<=GH-1)return'd';// lối xuống cổng hồ câu
 // Đường ngang hàng 14–15 (dưới chân nhà lớn, cửa y = 440); lối lên cửa nhà nhỏ cột 17–18.
 if(y>=14&&y<=15&&x<=28||x>=17&&x<=18&&y>=9&&y<=15)return'd';
 return'g';
}).join(''));
// Nhà nhỏ có sẵn (cửa 576, 264); nhà lớn mua được vẽ lúc chạy, cửa (576, 440) — chủ dự án 12/11 "Ok làm đi" (đổi nhà). Vùng nhà lớn
// x 230–922 × y 20–445 không đặt đồ (chỉ hàng cây nền phía sau).
const props=[p('gv_nha_chinh',576,264),p('gv_gieng',180,440),p('gv_nha_kinh',150,246),p('home_shipping_box',880,520),p('home_scarecrow',620,700),p('home_water_barrel',312,620),p('home_tool_rack',312,690),
 p('home_gate',930,520),p('log_bench',520,750),p('lamp',672,530),p('lamp',944,400),
 p('home_gate',240,996),p('lamp',300,960),p('flower_planter',120,600)];
/** Đặt một bãi quây: (ox, oy) là góc trên trái khung bãi trong map; lớp rào neo chân giữa đáy; đồ bên trong theo toạ độ trong khung. */
function placePen(pen:string,ox:number,oy:number,inside:[string,number,number][]):void{
 const info=pens[pen]!;
 for(const [layer,box] of Object.entries(info.layers))props.push(p(`gv_rao_${pen}_${layer}`,ox+box.x+box.w/2,oy+box.y+box.h));
 for(const [id,x,y] of inside){
  const mt=meta[id]!,l=x-mt.w/2,r=x+mt.w/2,t=y-mt.h;
  if(l<info.inner.x0||r>info.inner.x1||t<info.inner.y0||y>info.inner.y1)throw new Error(`${pen}: ${id} dính rào (${x}, ${y}); vùng trong ${JSON.stringify(info.inner)}`);
  props.push(p(id,ox+x,oy+y));
 }
}
// Bãi quây bò / cừu (góc đông bắc) và sân gà (đông nam) — bố cục trong bãi chép bản ghép thử pen_bo_cuu / pen_san_ga.
// Con vật đi lại trong bãi theo đàn của người chơi (client, sim FARM_PENS) — bãi chỉ giữ máng / giá cỏ / chuồng gà / ổ tắm cát.
placePen('bo_cuu',930,30,[['gv_mang_nuoc_da',130,345],['gv_gia_co_kho',470,330]]);
placePen('san_ga',960,600,[['gv_chuong_ga_lon',130,250],['gv_cho_tam_cat',370,160],['gv_mang_thoc_ga',300,270]]);
// Ngoài bãi: chuồng bò lớn, xe sữa, cuộn rơm, cột gãi; tổ ong cạnh bồn hoa (ong cần hoa).
props.push(p('gv_chuong_bo_lon',760,860),p('gv_xe_thung_sua',660,620),p('gv_cuon_rom_tron',890,640),p('gv_cuon_rom_tron',890,690),p('gv_cot_gai_bo',900,560),p('gv_xe_cut_kit_rom',320,780),
 p('gv_bon_hoa_ong',480,950),p('gv_to_ong_go',380,930),p('gv_to_ong_rom',590,940));
for(let x=64;x<GW*32-64;x+=64){if(x>460&&x<900)props.push(p('tree',x,92));if(x>1480)props.push(p('tree',x,GH*32-44));}
for(let y=300;y<GH*32-60;y+=70)props.push(p('tree',64,y));
const garden={...base,id:'garden',name:'Gia viên của bạn',width:GW,height:GH,decals:[] as Pt[],terrain,spawn:{x:860,y:416},props,
 spots:[{id:'door',name:'Cửa nhà',x:576,y:264,r:70},{id:'door_big',name:'Cửa nhà lớn',x:576,y:440,r:70},{id:'from_house_big',name:'Trước cửa nhà lớn',x:576,y:476,r:40},{id:'pond_gate',name:'Cổng ra hồ câu',x:240,y:960,r:80},{id:'from_house',name:'Trước cửa nhà',x:576,y:300,r:40},{id:'from_pond',name:'Cổng hồ câu',x:240,y:924,r:40},
  {id:'shop',name:'Người bán đồ Gia viên',x:780,y:470,r:90},{id:'field',name:'Ruộng',x:464,y:608,r:140},{id:'pasture',name:'Bãi quây bò cừu',x:1220,y:300,r:160},{id:'chicken_run',name:'Sân gà',x:1230,y:820,r:140},{id:'barn',name:'Chuồng bò',x:760,y:880,r:90},{id:'hives',name:'Tổ ong',x:560,y:960,r:100}]};

// ---- Hồ câu dùng chung: hồ ở phía đông (động tác câu vẽ hướng E), chỗ câu dọc bờ tây + đầu cầu gỗ (FARM_LAYOUT.pondSpots) ----
const pondTerrain=Array.from({length:22},(_,y)=>Array.from({length:28},(_,x)=>{
 if(x===0||y===0||x===27||y===21)return'#';
 if(x>=11&&x<=15&&y>=10&&y<=11)return'b';
 if(x>=12&&x<=24&&y>=4&&y<=18)return'w';
 if(y>=10&&y<=11&&x<=10)return'd';return'g';
}).join(''));
const pondProps=[p('home_gate',96,330),p('log_bench',250,250),p('log_bench',250,500),p('barrel',230,420),p('flower_planter',200,140),p('flower_planter',200,600),p('home_water_barrel',240,640)];
for(const [x,y] of [[340,160],[340,400],[340,600]])pondProps.push(p('lamp',x!-30,y!));
for(let x=64;x<848;x+=64){pondProps.push(p('tree',x,92));pondProps.push(p('tree',x,690));}
for(let y=200;y<640;y+=90)if(y<300||y>420)pondProps.push(p('tree',64,y));
const pond={...base,id:'pond',name:'Hồ câu sau Gia viên',width:28,height:22,decals:[] as Pt[],terrain:pondTerrain,spawn:{x:160,y:352},props:pondProps,
 spots:[{id:'garden_gate',name:'Cổng về khuôn viên',x:96,y:352,r:80},{id:'from_garden',name:'Cổng vào hồ',x:160,y:352,r:40},
  ...[[360,160],[360,240],[480,352],[360,440],[360,520],[360,592]].map(([x,y],i)=>({id:`fish${i+1}`,name:'Chỗ câu',x:x!,y:y!,r:60}))]};

// Tự kiểm: đồ không chạm nhau (chân cách ≥ 8 px, chủ dự án 12/11 "quá xấu"), không tràn mép, đồ trong nhà nằm trọn trên sàn.
const maps=[garden,pond,...rooms];
for(const m of maps){
 const box=(q:Pt)=>{const mt=meta[q.id]!;return{x0:q.x+mt.footprint.x,x1:q.x+mt.footprint.x+mt.footprint.w,y0:q.y+mt.footprint.y,y1:q.y};};
 for(const q of [...m.props,...m.decals])if(!meta[q.id])throw new Error(`${m.id}: thiếu đồ ${q.id}`);
 const solid=m.props.filter(q=>meta[q.id]!.blocks&&q.id!=='tree');
 for(let i=0;i<solid.length;i++)for(let j=i+1;j<solid.length;j++){const a=box(solid[i]!),b=box(solid[j]!);if(a.x0<b.x1+8&&b.x0<a.x1+8&&a.y0<b.y1+8&&b.y0<a.y1+8&&!(solid[i]!.id.startsWith('gv_rao')&&solid[j]!.id.startsWith('gv_rao'))&&!(solid[i]!.id.startsWith('gv_rao_')!==solid[j]!.id.startsWith('gv_rao_')&&[solid[i]!,solid[j]!].some(q=>/^gv_(bo|cuu|ga)_|^gv_(mang|gia_co|chuong_ga_lon)/.test(q.id))))throw new Error(`${m.id}: ${solid[i]!.id} chạm ${solid[j]!.id}`);}
 for(const q of m.props){const mt=meta[q.id]!;if(q.x-mt.w/2<0||q.x+mt.w/2>m.width*T)throw new Error(`${m.id}: ${q.id} tràn mép map`);}
 if(rooms.includes(m as never))for(const q of m.props){const mt=meta[q.id]!;if(q.x-mt.w/2<T||q.x+mt.w/2>(m.width-1)*T||q.y>(m.height-1)*T)throw new Error(`${m.id}: ${q.id} ra ngoài sàn`);}
}
// Chỗ trồng cây ăn quả / đặt máy chế biến (sim FARM_TREE_SPOTS / FARM_MACHINE_SPOTS, vẽ lúc chạy theo dữ liệu người chơi) phải trống.
for(const [x,y] of [[360,800],[440,800],[520,800],[600,800],[612,566],[680,566],[748,566],[816,566],[748,636],[816,636]] as const){
 for(const q of garden.props){const mt=meta[q.id]!;if(!mt.blocks)continue;const x0=q.x+mt.footprint.x,x1=x0+mt.footprint.w,y0=q.y+mt.footprint.y;if(x0<x+34&&x1>x-34&&y0<y+8&&q.y>y-18)throw new Error(`garden: ${q.id} đè chỗ cây / máy (${x}, ${y})`);}}
for(const q of garden.props){if(q.id==='tree'||q.id==='gv_nha_chinh')continue;const mt=meta[q.id]!;if(q.x+mt.w/2>230&&q.x-mt.w/2<922&&q.y>20&&q.y-mt.h<445)throw new Error('garden: '+q.id+' nằm trong vùng nhà lớn');}
{const F={x0:336,x1:592,y0:512,y1:704};for(const q of garden.props){const mt=meta[q.id]!;if(!mt.blocks)continue;const x0=q.x+mt.footprint.x,x1=x0+mt.footprint.w,y0=q.y+mt.footprint.y;if(x0<F.x1&&x1>F.x0&&y0<F.y1&&q.y>F.y0)throw new Error('garden: '+q.id+' đè lên ruộng');}}
// ---- 16 kiểu nhà mua được: hình riêng từng nhà (Unity nạp theo nhà đang dùng, không nhét chung atlas map) ----
{
 const FLOOR_STYLE:Record<string,(x:number,y:number)=>RGB>={};
 const wood=(b:RGB)=>(x:number,y:number):RGB=>{const j=Math.floor(y/T),row=Math.floor((y%T)/8),y0=row*8,yy=y%T,off=(row*40+(j%4)*56)%96,gx=x+off;let k=[1,0.92,1.06,0.96,1.02,0.9][(Math.floor(gx/96)+row*2+(j%4)*3)%6]!;if(yy===y0+7||gx%96===0)k=0.55;else if(yy===y0)k*=1.1;else if((gx*5+yy*3)%37===0)k*=0.85;return b.map(v=>v*k) as RGB;};
 const flag=(b:RGB)=>(x:number,y:number):RGB=>{const sh=Math.floor(y/16)%2?8:0,sx=(x+sh)%16;let k=[1,0.94,1.05,0.97][(Math.floor((x+sh)/16)+Math.floor(y/16)*3)%4]!;if(y%16===0||sx===0)k=0.62;else if(y%16===1||sx===1)k*=1.08;return b.map(v=>v*k) as RGB;};
 const bamboo=(b:RGB)=>(x:number,y:number):RGB=>{const col=Math.floor(x/8);let k=[1,0.93,1.05,0.97][col%4]!;if(x%8===7)k=0.6;else if((y+col*11)%40<2)k*=0.8;return b.map(v=>v*k) as RGB;};
 const parquet=(a:RGB,c:RGB)=>(x:number,y:number):RGB=>{const q=(Math.floor(x/16)+Math.floor(y/16))%2;let base=q?a:c,k=1;if((q&&y%4===3)||(!q&&x%4===3))k=0.78;if(x%16===0||y%16===0)k*=0.6;return base.map(v=>v*k) as RGB;};
 const marble=(a:RGB,c:RGB,gold=false)=>(x:number,y:number):RGB=>{const q=(Math.floor(x/16)+Math.floor(y/16))%2;let col=q===0?a:c,k=1;if(x%16===15||y%16===15)k=0.78;else if(x%16===0||y%16===0)k=1.06;if(gold&&(x%16===0||y%16===0))return[196,160,70];return col.map(v=>v*k) as RGB;};
 Object.assign(FLOOR_STYLE,{dq:wood([128,88,54]),dv:flag([140,136,128]),tt:wood([176,124,74]),ns:bamboo([196,164,98]),sm:flag([206,172,120]),gd:parquet([132,78,46],[104,60,36]),
  ld:marble([178,120,96],[206,192,166]),hv:marble([236,230,216],[214,206,190],true),nk:wood([150,110,64]),cx:wood([206,186,150]),bh:wood([178,174,162]),ct:wood([134,108,62]),
  pd:bamboo([192,178,118]),ln:flag([78,72,70]),lk:marble([226,234,220],[160,196,160]),lb:marble([214,234,244],[176,210,230])});
 const EXTERIOR:Record<string,[string,string]>={dq:['dot-7','nha_go_dong_que'],nk:['dot-10','nha_nam_khong_lo'],dv:['dot-7','nha_da_vung_cao'],cx:['dot-10','nha_coi_xay_hoa'],tt:['dot-7','nha_go_tuyet_tung'],ns:['dot-7','nha_san_dam_lay'],
  bh:['dot-10','nha_bien_hai_cang'],sm:['dot-7','nha_vom_sa_mac'],ct:['dot-10','nha_cay_tien'],gd:['dot-7','nha_gach_do_pho'],pd:['dot-10','nha_phuong_dong'],ln:['dot-10','nha_lun_nui_lua'],
  ld:['dot-7','dinh_thu_lau_dai'],lk:['dot-10','lau_kinh_vuon_hoa'],lb:['dot-10','lau_dai_bang'],hv:['dot-7','biet_thu_haven']};
 const HOUSE_PRICE:Record<string,number>={dq:5000,nk:8000,dv:15000,cx:22000,tt:30000,ns:40000,bh:52000,sm:65000,ct:80000,gd:100000,pd:125000,ln:155000,ld:190000,lk:230000,lb:280000,hv:350000};
 // Tên bán ở Cô Lựu theo đúng mặt ngoài (tránh "Nhà Nhà sàn").
 const HOUSE_NAME:Record<string,string>={dq:'Nhà gỗ đồng quê',nk:'Nhà nấm khổng lồ',dv:'Nhà đá vùng cao',cx:'Nhà cối xay hoa',tt:'Nhà gỗ tuyết tùng',ns:'Nhà sàn đầm lầy',bh:'Nhà biển hải cảng',sm:'Nhà vòm sa mạc',ct:'Nhà cây tiên',gd:'Nhà gạch đỏ phố',pd:'Nhà Phương Đông',ln:'Nhà lùn núi lửa',ld:'Dinh thự lâu đài',lk:'Lâu kính vườn hoa',lb:'Lâu đài băng',hv:'Biệt thự Haven'};
 const dir='assets/home/houses',info:Record<string,unknown>={};
 HOUSE_TIERS.forEach(([pre,name,batch],tier)=>{
  const d=join(dir,pre);mkdirSync(d,{recursive:true});
  const ext=gpt(EXTERIOR[pre]![0],EXTERIOR[pre]![1]);writePng(join(d,'exterior.png'),ext);
  // Mẫu sàn 192 × 128 (bội số chu kỳ ván 96 / đá 16 / ô 32) — client lát lặp kín sàn phòng.
  const fl=createImage(192,128),f=FLOOR_STYLE[pre]!;for(let y=0;y<128;y++)for(let x=0;x<192;x++){const c=f(x,y);fl.data.set([Math.min(255,Math.round(c[0])),Math.min(255,Math.round(c[1])),Math.min(255,Math.round(c[2])),255],(y*192+x)*4);}writePng(join(d,'floor.png'),fl);
  // Cặp tường trơn + cửa sổ ghép liền (chồng 4 px chỗ cột) — client lát lặp ngang dải tường.
  const w0=gpt(batch,`${pre}_tuong`),w1=gpt(batch,`${pre}_tuong_cua_so`),wall=createImage(w0.width+w1.width-4,Math.max(w0.height,w1.height));blit(wall,w0,0,0);blit(wall,w1,w0.width-4,0);writePng(join(d,'wall.png'),wall);
  const stairs=readPng(join('packages/asset-pipeline/sources/home-stairs',`cau_thang_${pre}.png`));writePng(join(d,'stairs.png'),stairs);
  info[pre]={name:HOUSE_NAME[pre]??`Nhà ${name}`,tier:tier+1,price:HOUSE_PRICE[pre],exterior:{w:ext.width,h:ext.height},wall:{w:wall.width,h:wall.height},stairs:{w:stairs.width,h:stairs.height}};
 });
 writeFileSync(join(dir,'houses.json'),JSON.stringify(info,null,1));
 writeFileSync('packages/sim/src/farmHouses.generated.ts',`// SINH TỰ ĐỘNG bởi scripts/export-home-maps.mts — 16 kiểu nhà Gia viên mua được (giá đề xuất 12/11, cỡ ảnh px).\nexport const FARM_HOUSES: Record<string,{name:string;tier:number;price:number;exterior:{w:number;h:number};wall:{w:number;h:number};stairs:{w:number;h:number}}> = ${JSON.stringify(info)};\n`);
}
for(const m of maps)writeFileSync(join(out,m.id+'.json'),JSON.stringify(m));
writeFileSync(join(out,'world.json'),JSON.stringify({region:'home',start:'garden',maps:Object.fromEntries(maps.map(m=>[m.id,{name:m.name,width:m.width*32,height:m.height*32,exits:[],spots:m.spots.map(s=>s.id),zones:[],dummies:[],boss:null}]))}));
console.log(`Gia viên: khuôn viên ${garden.props.length} đồ / hồ câu chung ${pond.props.length} đồ / nhà 3 phòng (${rooms.map(r=>`${r.name} ${r.width}×${r.height} ô ${r.props.length} đồ`).join(', ')}), atlas ${image.width}×${image.height} tại ${out}`);
