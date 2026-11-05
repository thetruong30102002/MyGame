/**
 * Trang soi nhân vật ghép lớp cho chủ dự án duyệt (cả trên điện thoại): ghép thân + đầu ngay trên trình duyệt theo neo cổ từng khung,
 * phát theo thời lượng từng khung, 0,5× / 1×, phóng nguyên lần, bật / tắt lớp đầu (soi thân sót đầu cũ), nền sáng / tối / map, đặt cạnh
 * NPC chuẩn độ nét. Xuất tĩnh vào apps/server/site/media/layered/<id>/ → https://<máy>/game/site/media/layered/<id>/index.html.
 */
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { writePng, type RGBAImage } from '../image/rgba.js';
import type { LayeredStandard, Point } from './standard.js';

export interface ReviewFrame {
	body: RGBAImage;
	/** Canvas đầu chuẩn (null = khung chưa có đầu, vd đang soi thân đã cắt). */
	head: RGBAImage | null;
	/** Tóc rủ dưới đường cổ (cùng canvas / neo với đầu), vẽ DƯỚI thân; tắt cùng lớp đầu. */
	hairBack?: RGBAImage | null;
	/** Tóc dài (canvas riêng, neo cổ `hairLongAnchor`): vẽ DƯỚI thân, hoặc TRÊN thân dưới đầu khi `hairLongFront` (nhìn sau). */
	hairLong?: RGBAImage | null;
	hairLongFront?: boolean;
	hairLongAnchor?: Point;
	/** Lớp cỡ ô vẽ TRÊN đầu: đoạn tay nằm trong bóng đầu (bodyFront), vũ khí, ngón tay trên chuôi (handFront). */
	bodyFront?: RGBAImage | null;
	weapon?: RGBAImage | null;
	handFront?: RGBAImage | null;
	/** Vũ khí vẽ dưới cùng (sau tóc sau / thân / đầu) — kiếm thủ trên vai ngả ra sau. */
	weaponBehind?: boolean;
	/** Vũ khí trên thân, DƯỚI đầu (phần vũ khí đeo lưng phía người xem — tóc che). */
	weaponMid?: RGBAImage | null;
	neck: Point;
	durationMs: number;
	/** Ghi chú QA hiện dưới khung (vd "Q2: 1 pixel sót"). */
	issues?: string[];
}

export interface ReviewClip {
	id: string;
	label: string;
	dir: string;
	frames: ReviewFrame[];
	loop: boolean;
}

export interface ReviewBundle {
	id: string;
	title: string;
	/** Đoạn giới thiệu: đang soi gì, cần duyệt gì. */
	notes: string[];
	clips: ReviewClip[];
	/** Ảnh chuẩn độ nét đặt cạnh (đã đặt vào ô chuẩn). */
	reference?: { label: string; image: RGBAImage };
	/** Ảnh nền map thật (PNG) để soi trên nền game. */
	mapTile?: string;
}

export function writeReview(bundle: ReviewBundle, outDir: string, std: Pick<LayeredStandard, 'cell' | 'head' | 'version'>): string {
	rmSync(outDir, { recursive: true, force: true });
	// JSON mới phải đi cùng ảnh mới; trình duyệt giữ ảnh cũ1giờ sẽ ghép sai pose/cổ nếu tái dùng tên file.
	const frameDir = 'f/' + randomUUID().slice(0, 12);
	mkdirSync(join(outDir, frameDir), { recursive: true });
	const clips = bundle.clips.map((c, ci) => ({
		id: c.id,
		label: c.label,
		dir: c.dir,
		loop: c.loop,
		frames: c.frames.map((f, fi) => {
			const body = `${frameDir}/${ci}-${fi}-body.png`;
			writePng(join(outDir, body), f.body);
			let head: string | null = null;
			if (f.head) {
				head = `${frameDir}/${ci}-${fi}-head.png`;
				writePng(join(outDir, head), f.head);
			}
			let back: string | null = null;
			if (f.hairBack) {
				back = `${frameDir}/${ci}-${fi}-hairback.png`;
				writePng(join(outDir, back), f.hairBack);
			}
			let long: string | null = null;
			if (f.hairLong) {
				long = `${frameDir}/${ci}-${fi}-hairlong.png`;
				writePng(join(outDir, long), f.hairLong);
			}
			const extra = (key: 'bodyFront' | 'weapon' | 'handFront' | 'weaponMid', img?: RGBAImage | null): string | null => {
				if (!img) return null;
				const path = `${frameDir}/${ci}-${fi}-${key.toLowerCase()}.png`;
				writePng(join(outDir, path), img);
				return path;
			};
			return { body, head, back, ...(long ? { long, la: f.hairLongAnchor ?? std.head.neckAnchor, ...(f.hairLongFront ? { lf: true } : {}) } : {}), front: extra('bodyFront', f.bodyFront), weapon: extra('weapon', f.weapon), hand: extra('handFront', f.handFront), ...(f.weaponBehind ? { wb: true } : {}), ...(f.weaponMid ? { wm: extra('weaponMid', f.weaponMid) } : {}), neck: f.neck, ms: f.durationMs, issues: f.issues ?? [] };
		}),
	}));
	let reference: { label: string; src: string } | null = null;
	if (bundle.reference) {
		writePng(join(outDir, frameDir, 'reference.png'), bundle.reference.image);
		reference = { label: bundle.reference.label, src: frameDir+'/reference.png' };
	}
	let map: string | null = null;
	if (bundle.mapTile) {
		map = `${frameDir}/map-${basename(bundle.mapTile)}`;
		copyFileSync(bundle.mapTile, join(outDir, map));
	}
	const data = { id: bundle.id, title: bundle.title, notes: bundle.notes, cell: std.cell, head: std.head, standardVersion: std.version, clips, reference, map };
	writeFileSync(join(outDir, 'data.json'), `${JSON.stringify(data, null, '\t')}\n`);
	// Dữ liệu nhúng thẳng vào trang: mở được cả từ file (không cần server), data.json giữ lại cho công cụ khác đọc.
	// Thoát "<" (chặn "</script>" trong ghi chú đóng thẻ sớm); hàm thay thế để "$" trong dữ liệu không bị hiểu thành mẫu thay thế.
	const inline = JSON.stringify(data).replace(/</g, '\\u003c');
	writeFileSync(join(outDir, 'index.html'), PAGE.replaceAll('__TITLE__', escapeHtml(bundle.title)).replace('__DATA__', () => inline));
	return join(outDir, 'index.html');
}

const escapeHtml = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const PAGE = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
body{margin:0;font:14px/1.5 system-ui,sans-serif;background:#1b1f24;color:#e6e1d6}
header{padding:12px 16px;background:#2a2f36;position:sticky;top:0;z-index:2}
h1{font-size:18px;margin:0 0 6px}
.bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.bar button{background:#3a414b;color:#e6e1d6;border:1px solid #556;border-radius:4px;padding:4px 9px;cursor:pointer}
.bar button[aria-pressed=true]{background:#c9a24a;color:#1b1f24;border-color:#c9a24a}
.bar span{color:#9aa3ad;margin-left:6px}
main{padding:12px 16px}
.notes{color:#b8bfc7;margin:4px 0 12px;padding-left:18px}
.clip{display:inline-block;vertical-align:top;margin:0 14px 18px 0;background:#232830;border-radius:6px;padding:8px}
.clip h2{font-size:14px;margin:0 0 6px}
canvas{image-rendering:pixelated;image-rendering:crisp-edges;display:block}
.strip{display:flex;gap:2px;margin-top:6px;flex-wrap:wrap}
.strip canvas{cursor:pointer;outline:1px solid #333}
.strip canvas.on{outline:2px solid #c9a24a}
.issue{color:#ff8a7a;font-size:12px}
.ok{color:#8fd18a;font-size:12px}
</style></head><body>
<header><h1>__TITLE__</h1>
<div class="bar" id="bar"></div></header>
<main><ul class="notes" id="notes"></ul><div id="clips"></div></main>
<script id="data" type="application/json">__DATA__</script>
<script>
const S={zoom:4,speed:1,bg:'map',head:true,body:true,weapon:true,neck:false,play:true};
let D,imgs={},t0=performance.now();
const load=src=>imgs[src]||(imgs[src]=new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;}));
function btn(label,key,vals){const g=document.createElement('span');g.textContent=label;bar.appendChild(g);for(const [v,txt] of vals){const b=document.createElement('button');b.textContent=txt;b.onclick=()=>{S[key]=v;sync();draw()};b.dataset.k=key;b.dataset.v=JSON.stringify(v);bar.appendChild(b);}}
function sync(){for(const b of bar.querySelectorAll('button'))b.setAttribute('aria-pressed',JSON.stringify(S[b.dataset.k])===b.dataset.v)}
const bgs={light:'#e9e3d3',dark:'#15181c',check:null,map:null};
async function paint(ctx,f,z){const c=D.cell;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,c.width*z,c.height*z);
 if(S.bg==='map'&&D.map){const m=await load(D.map);for(let y=0;y<c.height*z;y+=m.height*z)for(let x=0;x<c.width*z;x+=m.width*z)ctx.drawImage(m,x,y,m.width*z,m.height*z);}
 else if(S.bg==='check'||(S.bg==='map'&&!D.map)){for(let y=0;y<c.height;y+=8)for(let x=0;x<c.width;x+=8){ctx.fillStyle=((x+y)/8)%2?'#bbb':'#888';ctx.fillRect(x*z,y*z,8*z,8*z);}}
 else{ctx.fillStyle=bgs[S.bg];ctx.fillRect(0,0,c.width*z,c.height*z);}
 const at=f.neck?[f.neck[0]-D.head.neckAnchor[0],f.neck[1]-D.head.neckAnchor[1]]:[0,0];
 const al=f.long?[f.neck[0]-f.la[0],f.neck[1]-f.la[1]]:at;
 if(S.head&&f.long&&!f.lf){const h=await load(f.long);ctx.drawImage(h,al[0]*z,al[1]*z,h.width*z,h.height*z);}
 if(S.head&&f.back){const h=await load(f.back);ctx.drawImage(h,at[0]*z,at[1]*z,h.width*z,h.height*z);}
 if(S.weapon&&f.weapon&&f.wb)ctx.drawImage(await load(f.weapon),0,0,c.width*z,c.height*z);
 if(S.body)ctx.drawImage(await load(f.body),0,0,c.width*z,c.height*z);
 if(S.weapon&&f.wm)ctx.drawImage(await load(f.wm),0,0,c.width*z,c.height*z);
 if(S.head&&f.long&&f.lf){const h=await load(f.long);ctx.drawImage(h,al[0]*z,al[1]*z,h.width*z,h.height*z);}
 if(S.head&&f.head){const h=await load(f.head),ox=f.neck[0]-D.head.neckAnchor[0],oy=f.neck[1]-D.head.neckAnchor[1];ctx.drawImage(h,ox*z,oy*z,h.width*z,h.height*z);}
 if(S.body&&f.front)ctx.drawImage(await load(f.front),0,0,c.width*z,c.height*z);
 if(S.weapon&&f.weapon&&!f.wb)ctx.drawImage(await load(f.weapon),0,0,c.width*z,c.height*z);
 if(S.body&&f.hand)ctx.drawImage(await load(f.hand),0,0,c.width*z,c.height*z);
 if(S.neck){ctx.fillStyle='rgba(255,0,80,.8)';ctx.fillRect(f.neck[0]*z,f.neck[1]*z,z,z);ctx.fillStyle='rgba(0,200,255,.8)';ctx.fillRect(D.cell.root[0]*z,D.cell.root[1]*z,z,z);}}
function frameAt(c,t){const tot=c.frames.reduce((n,f)=>n+f.ms,0);let x=c.loop?t%tot:Math.min(t,tot-1);for(let i=0;i<c.frames.length;i++){x-=c.frames[i].ms;if(x<0)return i}return c.frames.length-1}
const views=[];
async function draw(){for(const v of views){v.canvas.width=D.cell.width*S.zoom;v.canvas.height=D.cell.height*S.zoom;v.last=-1;
 v.thumbs.forEach(async(th,i)=>{th.width=D.cell.width;th.height=D.cell.height;await paint(th.getContext('2d'),v.clip.frames[i],1)});}
 if(D.reference){refCanvas.width=D.cell.width*S.zoom;refCanvas.height=D.cell.height*S.zoom;const ctx=refCanvas.getContext('2d');await paint(ctx,{body:D.reference.src,head:null,neck:[0,0]},S.zoom);}}
async function tick(now){const t=(now-t0)*S.speed;for(const v of views){const i=S.play?frameAt(v.clip,t):v.pick;if(i!==v.last){v.last=i;await paint(v.canvas.getContext('2d'),v.clip.frames[i],S.zoom);v.thumbs.forEach((th,k)=>th.classList.toggle('on',k===i));const f=v.clip.frames[i];v.info.innerHTML=(f.issues.length?f.issues.map(s=>'<div class=issue>'+s+'</div>').join(''):'<div class=ok>Khung '+(i+1)+'/'+v.clip.frames.length+' · '+f.ms+'ms · không lỗi QA</div>');}}requestAnimationFrame(tick)}
let refCanvas;
(async d=>{D=d;
 btn('Phóng','zoom',[[1,'1×'],[2,'2×'],[4,'4×'],[8,'8×']]);btn('Tốc độ','speed',[[0.5,'0,5×'],[1,'1×']]);
 btn('Nền','bg',[['map','map'],['light','sáng'],['dark','tối'],['check','ô cờ']]);btn('Lớp đầu','head',[[true,'bật'],[false,'TẮT (soi thân)']]);
 btn('Lớp thân','body',[[true,'bật'],[false,'tắt']]);if(d.clips.some(c=>c.frames.some(f=>f.weapon)))btn('Lớp vũ khí','weapon',[[true,'bật'],[false,'tắt']]);btn('Neo','neck',[[false,'ẩn'],[true,'hiện']]);btn('Phát','play',[[true,'chạy'],[false,'dừng (bấm khung)']]);sync();
 for(const n of d.notes){const li=document.createElement('li');li.textContent=n;notes.appendChild(li);}
 if(d.reference){const box=document.createElement('div');box.className='clip';box.innerHTML='<h2>'+d.reference.label+'</h2>';refCanvas=document.createElement('canvas');box.appendChild(refCanvas);clips.appendChild(box);}
 for(const c of d.clips){const box=document.createElement('div');box.className='clip';box.innerHTML='<h2>'+c.label+' · '+c.dir+'</h2>';const cv=document.createElement('canvas');box.appendChild(cv);
  const info=document.createElement('div');box.appendChild(info);const strip=document.createElement('div');strip.className='strip';box.appendChild(strip);
  const v={clip:c,canvas:cv,info,thumbs:[],pick:0,last:-1};c.frames.forEach((f,i)=>{const th=document.createElement('canvas');th.onclick=()=>{S.play=false;v.pick=i;sync();v.last=-1};strip.appendChild(th);v.thumbs.push(th)});
  views.push(v);clips.appendChild(box);}
 await draw();requestAnimationFrame(tick);})(JSON.parse(document.getElementById('data').textContent));
</script></body></html>
`;
