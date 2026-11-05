"""Xuất nguyên frame PixelLab: không fit, sharpen, kéo xương hoặc ghép đầu."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, shutil, sys

name=sys.argv[1] if len(sys.argv)>1 else 'sword-bodymechanics-20261103'
assert name in ['sword-bodymechanics-20261103','sword-bodymechanics-v2-20261103']
src=Path('packages/asset-pipeline/sources/layered-character/mau-1')/name
out=Path('apps/server/site/media/layered')/name
out.mkdir(parents=True,exist_ok=True)
paths=sorted(src.glob('frame-*.png'))
assert len(paths)==17, f'Chưa đủ 17 ảnh: {len(paths)}'
ims=[Image.open(p).convert('RGBA') for p in paths]
assert len(set(im.size for im in ims))==1,'Canvas khác nhau: dừng, không tự fit'
w,h=ims[0].size
durations=[140]+[80]*16
contact=Image.new('RGBA',(w*6,(h+18)*3),(29,35,43,255))
for i,(p,im) in enumerate(zip(paths,ims)):
 shutil.copyfile(p,out/p.name)
 x,y=i%6*w,i//6*(h+18)
 contact.alpha_composite(im,(x,y))
 ImageDraw.Draw(contact).text((x+6,y+h),str(i)+' / '+('reference' if i==0 else 'generated'),fill='white')
contact.resize((contact.width*2,contact.height*2),Image.Resampling.NEAREST).save(out/'contact-2x.png')
ims[0].save(out/'attack.webp',save_all=True,append_images=ims[1:],duration=durations,loop=0,lossless=True)
manifest={'frames':[p.name for p in paths],'durations':durations,'width':w,'height':h,'previewOnly':True,'weaponSeparated':False,'bodyRescaled':False,'artApproved':False}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
(out/'index.html').write_text('''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PixelLab · chuyển động toàn thân mới</title>
<style>body{background:#1d232b;color:#ede9e0;font:16px system-ui;margin:0}main{max-width:1000px;margin:auto;padding:24px}h1{font-size:24px}p{line-height:1.6;color:#bdc7d0}.stage{display:flex;flex-wrap:wrap;gap:20px}figure{margin:0;flex:1;text-align:center}canvas{background:#29333b;width:320px;max-width:100%;image-rendering:pixelated}figcaption{padding:12px}button,select{background:#303e4a;color:white;border:1px solid #78909c;padding:10px;margin:6px;border-radius:4px}input[type=range]{width:300px;max-width:90%}details img{width:100%;image-rendering:pixelated}details{margin-top:24px}</style>
<main><h1>Chém chéo · thử chuyển động toàn thân mới</h1><p>PixelLab vẽ từ mô tả chuyển động, không dùng bộ xương tấn công cũ. Ảnh nguồn + 16 frame mới, giữ nguyên pixel xuất. Kiếm hiện vẽ cùng người để duyệt tư thế; chưa tách kiếm, chưa tích hợp game.</p>
<div class="stage"><figure><canvas id="idle"></canvas><figcaption>Ảnh nguồn</figcaption></figure><figure><canvas id="attack"></canvas><figcaption id="info"></figcaption></figure></div>
<button id="play">Tạm dừng</button><button id="prev">← Frame</button><button id="next">Frame →</button><select id="speed"><option value="1">1×</option><option value=".5">0.5×</option><option value=".25">0.25×</option></select><label><input id="mirror" type="checkbox">Lật toàn bộ</label><p><input id="scrub" type="range" min="0" max="16" value="0"></p><details><summary>Đủ frame nguồn</summary><img src="contact-2x.png"></details></main>
<script type="module">
const $=s=>document.getElementById(s),m=await fetch('manifest.json').then(r=>r.json()),ims=await Promise.all(m.frames.map(async n=>{const im=new Image;im.src=n;await im.decode();return im}));for(const id of ['idle','attack']){$(id).width=m.width;$(id).height=m.height}
let i=0,playing=true,last=performance.now(),elapsed=0;
function draw(id,n){const c=$(id).getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,m.width,m.height);c.save();if($('mirror').checked){c.translate(m.width,0);c.scale(-1,1)}c.drawImage(ims[n],0,0);c.restore()}
function paint(){draw('idle',0);draw('attack',i);$('info').textContent=i===0?'Ảnh nguồn':`Frame mới ${i}/16`;$('scrub').value=i;$('play').textContent=playing?'Tạm dừng':'Phát'}
function step(d){playing=false;i=(i+d+17)%17;elapsed=0;paint()}$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);$('play').onclick=()=>{playing=!playing;elapsed=0;paint()};$('mirror').onchange=paint;$('scrub').oninput=()=>{playing=false;i=+$('scrub').value;paint()};
function tick(t){const dt=Math.min(t-last,100);last=t;if(playing){elapsed+=dt*+$('speed').value;while(elapsed>=m.durations[i]){elapsed-=m.durations[i];i=(i+1)%17}paint()}requestAnimationFrame(tick)}paint();requestAnimationFrame(tick);
</script></html>''',encoding='utf-8')
print(json.dumps({'output':str(out),'canvas':[w,h],'frames':len(ims),'rescaled':False}))
