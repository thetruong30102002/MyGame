from pathlib import Path
import json
from PIL import Image

p = Path('apps/server/site/media/layered/diagonal-sword-pilot-20261103')
m = json.loads((p / 'manifest.json').read_text())
frames = [Image.open(p / f['full']).convert('RGBA') for f in m['frames']]
frames[0].save(p / 'attack.webp', save_all=True, append_images=frames[1:], duration=[f['ms'] for f in m['frames']], lossless=True, loop=0)
(p / 'index.html').write_text('''<!doctype html>
<html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PixelLab · thử chém chéo một tay</title>
<style>body{margin:0;background:#171b21;color:#e8e3d8;font:16px system-ui}main{max-width:960px;margin:auto;padding:24px}h1{font-size:24px}p{line-height:1.6;color:#bfc7d0}.stage{display:flex;flex-wrap:wrap;gap:20px}figure{margin:0;text-align:center;flex:1}canvas{width:320px;max-width:100%;height:auto;background:#252c34;image-rendering:pixelated}figcaption{padding:10px}button,select{padding:10px;margin:5px;border:1px solid #78828c;background:#29323d;color:white;border-radius:5px}input[type=range]{width:280px;max-width:85%}details{margin-top:24px}details img{width:100%;image-rendering:pixelated}label{display:inline-block;margin:8px}a{color:#dfbc79}</style>
<main><h1>Thử chém chéo một tay · PixelLab</h1><p>15 frame, nhìn từ sau. Lấy đà phía trên vai cầm kiếm, chém xuống phía chân đối diện. Kiếm là lớp riêng. Đây là bản thử để duyệt, chưa đưa vào game; phần xoay vai/thân còn ít.</p>
<div class="stage"><figure><canvas id="idle" width="160" height="160"></canvas><figcaption>Đứng yên gốc · cùng tỉ lệ</figcaption></figure><figure><canvas id="attack" width="160" height="160"></canvas><figcaption id="info">Đang tải…</figcaption></figure></div>
<div><button id="play">Tạm dừng</button><button id="prev">← Frame</button><button id="next">Frame →</button><select id="speed"><option value="1">1×</option><option value="0.5">0.5×</option><option value="0.25">0.25×</option></select></div>
<input id="scrub" type="range" min="0" max="14" value="0"><label><input id="mirror" type="checkbox">Lật toàn bộ</label><label><input id="weapon" type="checkbox" checked>Kiếm</label><label><input id="head" type="checkbox" checked>Đầu</label>
<details><summary>Xem đủ 15 frame đã ghép</summary><img src="contact-2x.png"></details><details><summary>Frame gốc PixelLab trước khi ghép đầu và kiếm</summary><img src="raw-contact-2x.png"></details><p id="error"></p></main>
<script type="module">
const $=s=>document.getElementById(s),m=await fetch('manifest.json').then(r=>r.json()),cache={};
const names=new Set([m.head.head,m.head.back,m.idle.body,...m.frames.flatMap(f=>[f.body,f.front,f.hand,f.weapon])]);
try{await Promise.all([...names].map(async n=>{const im=new Image;im.src=n;await im.decode();cache[n]=im}));}catch(e){$('error').textContent='Không tải được ảnh: '+e;throw e}
let frame=0,playing=true,elapsed=0,last=performance.now();
function draw(canvas,f){const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,160,160);c.save();if($('mirror').checked){c.translate(160,0);c.scale(-1,1)}const x=f.chin[0]-m.head.chinOffset[0]-24,y=f.chin[1]-m.head.chinOffset[1]-40;const put=n=>{if(n&&cache[n])c.drawImage(cache[n],0,0)};if($('head').checked)c.drawImage(cache[m.head.back],x,y);if(f.behind&&$('weapon').checked)put(f.weapon);put(f.body);if($('head').checked)c.drawImage(cache[m.head.head],x,y);put(f.front);if(!f.behind&&$('weapon').checked)put(f.weapon);put(f.hand);c.restore()}
function paint(){draw($('idle'),m.idle);draw($('attack'),m.frames[frame]);$('scrub').value=frame;$('info').textContent=`Frame ${frame+1}/15 · ${m.frames[frame].ms} ms`;$('play').textContent=playing?'Tạm dừng':'Phát'}
$('play').onclick=()=>{playing=!playing;elapsed=0;paint()};function step(d){playing=false;frame=(frame+d+15)%15;elapsed=0;paint()}$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);$('scrub').oninput=()=>{playing=false;frame=+$('scrub').value;paint()};for(const id of ['mirror','weapon','head'])$(id).onchange=paint;
function tick(now){const dt=Math.min(now-last,100);last=now;if(playing){elapsed+=dt*+$('speed').value;while(elapsed>=m.frames[frame].ms){elapsed-=m.frames[frame].ms;frame=(frame+1)%15}paint()}requestAnimationFrame(tick)}paint();requestAnimationFrame(tick);
</script></html>''', encoding='utf-8')
print('Preview HTML and lossless animated WebP ready; no game build.')
