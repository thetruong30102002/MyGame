// Xuất quy chuẩn kèm đúng ảnh roster gốc; không sinh/vẽ thêm hình trong bước này.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng,writePng,createImage,blit,crop,scaleNearest} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),folder=join(root,'packages/asset-pipeline/sources/player-weapon-proof-v2/style-standard-v1'),publicRoot=join(root,'apps/server/site/media/weapon-proof-v2'),media=join(publicRoot,'style-standard');
const standard=JSON.parse(readFileSync(join(folder,'standard.json'),'utf8'));
const headStandard=JSON.parse(readFileSync(join(root,standard.headStandardSource),'utf8'));
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
mkdirSync(media,{recursive:true});mkdirSync(join(folder,'references'),{recursive:true});
const hashFile=join(folder,'reference-hashes.json'),locked=existsSync(hashFile)?JSON.parse(readFileSync(hashFile,'utf8')):null;
const hashes=[];
// Mẫu độ nét NPC tóc trắng: lấy nguyên frame, chỉ thêm khoảng trống để chung root/PPU.
const gameManifest=JSON.parse(readFileSync(join(root,'assets/manifest.json'),'utf8')),npcEvidence=[];
for(const id of ['npc_silver_youth','npc_silver_youth_f']){
 const entry=gameManifest.characters[id],atlasFile=join(root,'assets',entry.atlas),atlas=JSON.parse(readFileSync(atlasFile,'utf8'));
 const name=atlas.animations.idle_S[0],f=atlas.frames[name];if(f.rotated)throw Error('NPC benchmark bị xoay atlas');
 const textureFile=join(dirname(atlasFile),atlas.meta.image),raw=readPng(textureFile),native=createImage(144,144);
 const dx=72-Math.round(entry.frameSize.width*entry.anchor.x),dy=128-Math.round(entry.frameSize.height*entry.anchor.y);
 blit(native,crop(raw,f.frame.x,f.frame.y,f.frame.w,f.frame.h),dx+(f.spriteSourceSize?.x||0),dy+(f.spriteSourceSize?.y||0));
 const file=join(folder,'npc-ground-references',id+'-S.png');writePng(file,native);
 npcEvidence.push({id,atlas:entry.atlas,frame:name,sourceTextureSha256:sha(textureFile),fileSha256:sha(file),translation:[dx,dy],pixelScale:1,ppu:48,root:[72,128]});
}
writeFileSync(join(folder,'npc-ground-reference-provenance.json'),JSON.stringify(npcEvidence,null,2));
for(const ref of standard.references){const input=join(root,ref.file),hash=sha(input),prior=locked?.references.find((r:{id:string})=>r.id===ref.id);if(prior&&prior.sha256!==hash)throw Error('Ảnh master đã đổi; cần tạo phiên bản chuẩn mới: '+ref.id);const saved=join(folder,'references',ref.id+'.png');if(!existsSync(saved))copyFileSync(input,saved);if(sha(saved)!==hash)throw Error('Bản sao master sai hash '+ref.id);copyFileSync(saved,join(media,ref.id+'.png'));hashes.push({id:ref.id,file:ref.file,sha256:hash});}
writeFileSync(hashFile,JSON.stringify({version:standard.version,references:hashes},null,2));copyFileSync(hashFile,join(media,'reference-hashes.json'));
const master=createImage(144,144);blit(master,readPng(join(folder,'references/player_verdant_sword.png')),16,28);writePng(join(folder,'master-native.png'),master);writePng(join(media,'master-native.png'),master);writePng(join(media,'master-2x-geometry-guide.png'),scaleNearest(master,2));
writePng(join(media,'hair-face-detail-4x.png'),scaleNearest(crop(readPng(join(folder,'references/player_verdant_sword.png')),36,24,40,45),4));
const prompt=['MỤC TIÊU: vẽ lại mẫu chuẩn HD pixel, bắt buộc kèm hai NPC tóc trắng ở sảnh làm mốc độ nét, tối đa4 pose trong lượt thử đầu.',standard.referenceNote,'Chuẩn đầu GLOBAL bắt buộc: '+JSON.stringify(headStandard)+'. '+standard.headStandardRule,'Ảnh master là chuẩn nhân dạng/nét vẽ; ảnh thước tư thế chỉ định chuyển động. Giữ thiết kế tóc, khuôn mặt, trang phục và một vũ khí.','Chuẩn HD: canvas 288×288, root(144,256), thân đứng 150px, PPU96; cùng tỷ lệ/cỡ đầu và mật độ chi tiết cho cả bộ. Ảnh thước 2× chưa phải mỹ thuật HD.','Hành động/hướng/pose cần vẽ: [điền rõ trước khi gọi sinh ảnh].',...standard.sections.flatMap((s:{title:string;rules:string[]})=>[s.title.toUpperCase(),...s.rules]),'PNG nền trong suốt, không chữ/hiệu ứng/bóng nền. Giữ đủ khoảng trống cho kiếm giơ thẳng trên đầu; không để chồng ô.'].join('\n\n');
writeFileSync(join(folder,'prompt-template.vi.txt'),prompt);copyFileSync(join(folder,'prompt-template.vi.txt'),join(media,'prompt-template.vi.txt'));copyFileSync(join(folder,'standard.json'),join(media,'standard.json'));
copyFileSync(join(root,'docs/thiet-ke/quy-chuan-net-ve-nhan-vat.md'),join(media,'quy-chuan-net-ve-nhan-vat.md'));
const esc=(s:unknown)=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const table=[['Canvas','144 × 144','288 × 288'],['Root','(72, 128)','(144, 256)'],['Cao cơ thể đứng','75 px','150 px'],['PPU','48','96'],['Thước bề ngang đầu S','24 px','48 px']];
const html=`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quy chuẩn nét vẽ nhân vật — Haven</title><style>
*{box-sizing:border-box}body{margin:0;background:#292821;color:#f0e5cb;font:15px/1.65 Arial,sans-serif}main{max-width:1080px;margin:auto;padding:24px 20px 48px}a{color:#efc675}h1{font-size:28px;line-height:1.25}h2{font-size:20px;color:#efc675;margin-top:30px}p{max-width:900px}.notice{padding:14px 18px;border:1px solid #a48048;background:#413626}.refs{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.ref{margin:0;border:1px solid #776344;background:#38372d;padding:12px;text-align:center}.ref img{width:224px;height:224px;max-width:100%;object-fit:contain;image-rendering:pixelated}.ref figcaption{font-weight:bold}.ref small{display:block;color:#c7b895}table{border-collapse:collapse;width:100%;max-width:680px}td,th{border:1px solid #776344;padding:10px;text-align:left}th{background:#4b3e29}li{margin:12px 0}.geometry{display:flex;align-items:center;gap:24px;flex-wrap:wrap}.geometry img{width:288px;height:288px;image-rendering:pixelated;background:#38372d}.detail{width:160px;height:180px;image-rendering:pixelated}.downloads{display:flex;gap:18px;flex-wrap:wrap}footer{border-top:1px solid #776344;margin-top:30px;padding-top:14px;color:#b9ac92}@media(max-width:650px){.refs{grid-template-columns:1fr}.ref img{max-width:none}main{padding:18px 14px}h1{font-size:24px}td,th{padding:7px;font-size:13px}}</style><main>
<a href="../../../admin#plan">Kế hoạch admin</a>
<h1>${esc(standard.title)}</h1><p class="notice">Quy chuẩn làm việc · ${esc(standard.date)}. Các mẫu R3/R4/HD nháp chưa đạt mỹ thuật. Chưa phát hành bộ nhân vật thay thế trong Unity.</p>
<p>${esc(standard.referenceNote)}</p><h2>Ảnh gốc dùng để đối chiếu</h2><div class="refs">${standard.references.map((r:{id:string;name:string;role:string})=>`<figure class="ref"><img src="style-standard/${esc(r.id)}.png" alt="${esc(r.name)} — ảnh roster gốc"><figcaption>${esc(r.name)}</figcaption><small>${esc(r.role)}</small></figure>`).join('')}</div>
<h2>Thước tỷ lệ cho mẫu HD</h2><p>${esc(standard.geometry.upscaleNote)} PPU tăng cùng mật độ pixel để nhân vật giữ chiều cao trong thế giới game.</p><div class="geometry"><img src="style-standard/master-2x-geometry-guide.png" alt="Thước master phóng nearest 2×, không phải bản HD vẽ mới"><table><thead><tr><th>Thuộc tính</th><th>Mẫu gốc</th><th>Thước HD</th></tr></thead><tbody>${table.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')}</tbody></table></div><p>${esc(standard.geometry.headEnvelopeSource)}</p>
<h2>Nét tóc, mặt và giáp của master</h2><img class="detail" src="style-standard/hair-face-detail-4x.png" alt="Cụm pixel tóc mặt và giáp của ảnh gốc, phóng nguyên lần">
${standard.sections.map((s:{title:string;rules:string[]})=>'<section><h2>'+esc(s.title)+'</h2><ul>'+s.rules.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul></section>').join('')}
<h2>Các bản chưa được dùng làm chuẩn</h2><ul>${standard.rejectedDrafts.map((d:{id:string;reason:string})=>'<li><strong>'+esc(d.id)+'</strong>: '+esc(d.reason)+'</li>').join('')}</ul>
<h2>Tài liệu và prompt dùng lại</h2><div class="downloads"><a href="style-standard/quy-chuan-net-ve-nhan-vat.md">Tài liệu Markdown</a><a href="style-standard/standard.json">Quy chuẩn JSON</a><a href="style-standard/prompt-template.vi.txt">Prompt mẫu</a><a href="style-standard/reference-hashes.json">Hash ảnh tham chiếu</a></div><section><h2>Chuẩn đầu GLOBAL</h2><p>${standard.headStandardRule}</p><pre>${JSON.stringify(headStandard,null,2)}</pre></section><footer>Đây là chuẩn để tránh vẽ sai style. Kiểm kỹ thuật hoặc thay đúng hướng kiếm không đồng nghĩa mẫu mỹ thuật đã được nghiệm thu.</footer></main></html>`;
writeFileSync(join(publicRoot,'style-standard.html'),html);
console.log(JSON.stringify({styleStandard:standard.version,references:hashes.length,hashesVerified:true,url:'https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/style-standard.html'}));
