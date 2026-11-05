from pathlib import Path
import json, sys

name=sys.argv[1] if len(sys.argv)>1 else 'sword-new-3d-keyposes-v2-20261103'
assert name in ['sword-new-3d-keyposes-v2-20261103','sword-new-3d-keyposes-v3-20261103']
p=Path('apps/server/site/media/layered')/name
m=json.loads((p/'manifest.json').read_text())
assert len(m['frames'])==3
for f in m['frames']:
 assert (p/f['full']).exists()
(p/'index.html').write_text('''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ba tư thế chém · xương 3D mới</title><style>body{margin:0;background:#1c232b;color:#ece8dc;font:16px system-ui}main{max-width:1080px;margin:auto;padding:24px}h1{font-size:25px}p{line-height:1.7;color:#c1cad2}.poses{display:flex;flex-wrap:wrap;gap:16px}figure{margin:0;flex:1;min-width:220px;text-align:center}figure img{width:320px;max-width:100%;background:#29323b;image-rendering:pixelated}figcaption{padding:12px}button{padding:10px;margin:5px;background:#334354;color:white;border:1px solid #8194a4;border-radius:5px}details{margin:20px 0}details img{max-width:100%;image-rendering:pixelated}.mirror figure img{transform:scaleX(-1)}.note{border-left:3px solid #c5a46b;padding:10px 16px}</style>
<main><h1>Ba tư thế chính · bộ xương tấn công mới</h1><p>Dựng tư thế 3D mới, IK giữ chiều dài tay/chân, PixelLab vẽ lại. Khung đứng chỉ dùng để đo tỷ lệ; không dùng bộ xương chém cũ. Đứng yên và di chuyển trong game giữ nguyên.</p><p class="note">Đây là 3 tư thế để kiểm tra trước khi vẽ các frame nối, chưa phải animation hoàn chỉnh và chưa đưa vào game. Đầu và kiếm đang ghép riêng để rà chỗ nắm và lớp che.</p>
<button id="mirror">Lật toàn bộ</button><button id="layer">Xem thân không đầu/kiếm</button><div class="poses" id="poses"><figure><img src="attack-00-full.png"><figcaption>1 · Lấy đà phía vai cầm kiếm</figcaption></figure><figure><img src="attack-01-full.png"><figcaption>2 · Ra đòn phía trước người</figcaption></figure><figure><img src="attack-02-full.png"><figcaption>3 · Kết thúc về phía hông đối diện</figcaption></figure></div>
<p>Góc nhìn từ sau: tay và chuôi ở phía trước thân sẽ bị thân che theo chiều sâu. Cần xét cả ảnh gốc để phân biệt che khuất đúng với lỗi mất tay.</p><details><summary>Frame PixelLab nguyên gốc, trước khi tách đầu và ghép kiếm</summary><img src="raw-contact-2x.png"></details><details><summary>Thân không đầu và kiếm</summary><img src="body-contact-2x.png"></details></main>
<script>let bare=false;document.getElementById('mirror').onclick=()=>document.getElementById('poses').classList.toggle('mirror');document.getElementById('layer').onclick=()=>{bare=!bare;document.querySelectorAll('figure img').forEach((im,i)=>im.src='attack-'+String(i).padStart(2,'0')+(bare?'-body.png':'-full.png'));document.getElementById('layer').textContent=bare?'Xem ghép đầu và kiếm':'Xem thân không đầu/kiếm'};</script></html>''',encoding='utf-8')
print('Published three-keypose proof only; game untouched.')
if 'v3' in name:
 text=(p/'index.html').read_text(encoding='utf-8').replace('Ba tư thế chính · bộ xương tấn công mới','Sửa tư thế nâng tay · khuỷu về trước, không bè ngang').replace('Dựng tư thế 3D mới, IK giữ chiều dài tay/chân, PixelLab vẽ lại.','Tư thế lấy đà: tay nâng trên vai cầm kiếm, khuỷu dưới nắm tay và hướng về trước. Sửa hướng khuỷu trong khung 3D, không kéo riêng ảnh tay; IK giữ chiều dài tay/chân, PixelLab vẽ lại.').replace('1 · Lấy đà phía vai cầm kiếm','1 · Nâng tay trên vai, kiếm gần thẳng đứng')
 (p/'index.html').write_text(text,encoding='utf-8')
