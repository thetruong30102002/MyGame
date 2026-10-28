// Xuất đúng một module thiết kế và cập nhật phần đọc được trên admin. Không sửa % công việc hoặc map đang chơi.
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { join,resolve } from 'node:path';
import { WORLD_DESIGN } from '../packages/sim/src/worldDesign.ts';
import { REGIONS } from '../packages/sim/src/regions.ts';
import { auditWorldConnections,type WorldLinkMap } from '../packages/sim/src/worldConnections.ts';
import { parsePlan } from '../apps/server/src/developmentPlan.ts';

const root=resolve('.');
const maps:WorldLinkMap[]=[];
for(const r of REGIONS){const folder=join(root,'assets/maps',r.id);const index=JSON.parse(readFileSync(join(folder,'world.json'),'utf8'));for(const id of Object.keys(index.maps)){const m=JSON.parse(readFileSync(join(folder,id+'.json'),'utf8'));maps.push({...m,key:r.id+'/'+id});}}
const topology=auditWorldConnections(maps);
if(topology.errors.length||topology.unreachable.length)throw Error('Cổng thế giới chưa hợp lệ: '+JSON.stringify(topology));
const snapshot={...WORLD_DESIGN,topology};
const dir=join(root,'.havenlord-stage/world-renewal');mkdirSync(dir,{recursive:true});
writeFileSync(join(dir,'world-design.json'),JSON.stringify(snapshot,null,2));
writeFileSync(join(dir,'world-topology.json'),JSON.stringify(topology,null,2));
// Chỉ thêm JSON module mới, không xuất lại các module nhân vật/chiêu đang dở.
const unityDir=join(root,'UnityGame/Assets/HavenLord/Data/Sim');mkdirSync(unityDir,{recursive:true});
writeFileSync(join(unityDir,'worldDesign.json'),JSON.stringify({WORLD_DESIGN},null,'\t')+'\n');

const planPath=join(root,'docs/ke-hoach-nang-cap-the-gioi.md');
const markdown=readFileSync(planPath,'utf8');const p=parsePlan(markdown);
for(const region of p.regions){const design=WORLD_DESIGN.regions.find(r=>r.region===region.id);if(design){region.politics=design.government+'; '+design.authority+'. '+design.continuity;region.chief=design.authority;region.architecture=design.tension;region.life=design.questHooks.join(' ');}}
const politics=p.tasks.find(t=>t.id==='politics');
if(politics){politics.detail='Bản thiết kế mới cho 13 vùng, 20 tổ chức đề xuất và 13 quan hệ; bỏ các nhân vật/quyền kế vị từ truyện cũ. Đã đối chiếu vị trí map thật; chưa đặt NPC hoặc mở nhiệm vụ.';for(const step of politics.steps)if(step.evidence.includes('Amira'))step.evidence='26/10/2026: docs/dinh-huong-haven.md và packages/sim/src/worldDesign.ts; các chính quyền và tên tổ chức mới là đề xuất, danh tính vua chưa chốt.';}
const next={...p,worldDesign:snapshot};
const encoded=JSON.stringify(next,null,2);
const result=markdown.replace(/(<!-- havenlord-plan:start -->\s*```json\s*)[\s\S]*?(\s*```\s*<!-- havenlord-plan:end -->)/,(_,a,b)=>a+encoded+b);
parsePlan(result);writeFileSync(planPath,result);

const lines=[
 '# Chính trị, địa lý và Thiên Thành — bản thiết kế không cần sinh ảnh',
 '',`Ngày: **26/10/2026**. Trạng thái: **bản thiết kế triển khai**, chưa mở map mới hoặc phát hành gameplay. Nguồn dữ liệu: \`packages/sim/src/worldDesign.ts\`. Trang admin đọc bản xuất trong kế hoạch tổng; không có % riêng ở tài liệu này.`,
 '', '## Quyết định nền và tính liên tục', '',...WORLD_DESIGN.notes.map(n=>'- '+n),
 '', '## Chính quyền và vị trí thành chính', '',
 '| Vùng | Chính quyền / người đứng đầu | Nơi đặt cơ quan | Căng thẳng chính |', '|---|---|---|---|',
 ...WORLD_DESIGN.regions.map(p=>`| ${REGIONS.find(r=>r.id===p.region)!.name} | ${p.government}; ${p.authority} | \`${p.seatMap}\` | ${p.tension} |`),
 '', 'Các vị trí dùng ID map thật để đối chiếu kỹ thuật. Chính quyền và phe trong hướng mới đều là đề xuất; không kế thừa tuyến nhân vật chính cũ.',
 '', '## Phe phái và quan hệ', '',
 'Danh sách tổ chức mới là đề xuất; cần triển khai quest/NPC riêng. Không thêm thanh thiện/ác hoặc PvP phe mặc định.',
 '', '| Phe | Nguồn | Mục tiêu | Nguồn lực | Cái giá / giới hạn |', '|---|---|---|---|---|',
 ...WORLD_DESIGN.factions.map(f=>`| ${f.name} | ${f.status==='existing-story'?'Truyện đã có':'Đề xuất mới'} | ${f.goal} | ${f.leverage} | ${f.cost} |`),
 '',...WORLD_DESIGN.relations.map(r=>`- **${WORLD_DESIGN.factions.find(f=>f.id===r.a)!.name} ↔ ${WORLD_DESIGN.factions.find(f=>f.id===r.b)!.name}** (${r.kind}): ${r.reason} ${r.pressure}`),
 '', '## Đời sống và đầu mối nhiệm vụ từng vùng', '',
 ...WORLD_DESIGN.regions.flatMap(p=>[`### ${REGIONS.find(r=>r.id===p.region)!.name}`, '',`- Hàng đi: ${p.exports.join(', ')}. Hàng cần: ${p.imports.join(', ')}. Đây là nền kinh tế truyện, chưa phải thêm item/giá vào shop.`,`- Định hướng mới: ${p.continuity}`,...p.questHooks.map(q=>'- Đầu mối: '+q),'']),
 '## Bố trí địa lý mới', '',
 'Tọa độ 0–100 dưới đây dành cho sơ đồ thiết kế; không áp lên tranh cũ hoặc đổi cổng hiện có. Nơi ở/cung thành nằm trong vùng, không phải vùng mới. Rừng Nấm ở tầng hang, Thiên Thành và Hư Không ở tầng trời nhưng là hai nơi riêng.', '',
 '| Điểm | Tầng | X | Y | Địa hình / tuyến |', '|---|---|---:|---:|---|',
 ...WORLD_DESIGN.layout.map(p=>`| ${p.name} | ${p.layer} | ${p.x} | ${p.y} | ${p.geography} |`),
 '', '### Kiểm cổng thực tế', '',
 `Đã rà **${topology.mapCount} map**, **${topology.directedLinks} lối một chiều khai trong dữ liệu**, **${topology.connections.length} cặp kết nối vùng / ${topology.crossRegionLinks} lối qua vùng**. Mọi map đi tới được từ human/town khi bỏ qua điều kiện cấp/boss; mọi cổng có đường quay lại và toSpot tồn tại. Đây là kiểm cấu trúc, chưa là nghiệm thu collision hay di chuyển thật trong Unity.`, '',
 '| Cặp vùng | Map đầu | Map đích | Loại tuyến theo thiết kế |', '|---|---|---|---|',
 ...topology.connections.map(c=>`| ${c.fromRegion} ↔ ${c.toRegion} | \`${c.fromMap}\` | \`${c.toMap}\` | ${c.kind} |`),
 '', 'Lối San Hô → Nấm được diễn giải bằng tuyến hang biển dài. Phế tích → Hư Không và ba nhánh nguyên tố là chuyển tiếp ma pháp. Không diễn giải một cạnh map nhỏ thành khoảng cách đi bộ ngắn trên lục địa. Góc camera/map cục bộ không quyết định tọa độ ghim tranh tổng.',
 '', '### Chỗ dành cho tính năng sau', '',...WORLD_DESIGN.reserved.map(r=>`- **${r.name}** cạnh ${r.nearRegion}: ${r.note}`),
 '', 'Tên và số cửa mê cung là đề xuất chừa chỗ, không phải đã chốt chỉ có bốn mê cung. Nhà riêng là instance/account, không đặt hàng nghìn ghim nhà cá nhân trên tranh thế giới.',
 '', '## Thiên Thành và thần tri thức', '',
 `**${WORLD_DESIGN.sky.name}** là tên tạm. Có đúng **một vị thần** tại lâu đài: **${WORLD_DESIGN.sky.deity.name}** (tên đề xuất). ${WORLD_DESIGN.sky.deity.role}`,
 '', 'Thiên Thành theo yêu cầu chủ dự án: một lâu đài trên không, một vị thần hé lộ tri thức thế giới và khởi nguyên. Cốt truyện cũ đã lưu trữ.',
 '', `**Điều kiện lên (đề xuất):** cấp ${WORLD_DESIGN.sky.access.minLevel} và đối chiếu bốn nguồn mở đầu. Cổng lên từ \`${WORLD_DESIGN.sky.access.fromMap}\`, quay về \`${WORLD_DESIGN.sky.access.returnMap}\`. Chưa thêm cổng hoặc khóa tuyến chơi thật. Cho phép trở lại đọc tiếp trước/sau các chương cuối.`,
 '',...WORLD_DESIGN.sky.spaces.map(s=>`- **${s.name}:** ${s.purpose}`),
 '', '### Bốn chương hé lộ', '',
 ...WORLD_DESIGN.chapters.flatMap(c=>[`#### ${c.order}. ${c.title}`, '',`Điều kiện: ${c.previous?'đã đọc '+c.previous+'; ':''}${c.requires.map(id=>WORLD_DESIGN.evidence.find(e=>e.id===id)!.name).join(', ')}.`,`Hé lộ: ${c.revelation}`,...c.keeper.map(t=>'> '+t),`Câu hỏi cho người chơi: ${c.question}`,`Nhật ký: ${c.journal}`,'']),
 '### Nguồn chứng cứ', '',...WORLD_DESIGN.evidence.map(e=>`- **${e.name}** (\`${e.id}\`) tại \`${e.map}\`: ${e.note}`),
 '', '### Luật cần giữ', '',...WORLD_DESIGN.sky.constraints.map(s=>'- '+s),
 '', '## Triển khai và tiến độ', '',
 '- Đã có dữ liệu chính trị, phe, quan hệ, tuyến địa lý và hồ sơ thư khố; đã xuất một module JSON riêng cho Unity.',
 '- Đã có luật thuần kiểm điều kiện thư khố và chống lộ phần chương bị khóa. Đây là nền dữ liệu, chưa nối save, NPC hoặc nhiệm vụ sản xuất.',
 '- Kiểm bảy nhóm: ghế/phe hợp lệ, quan hệ không lỗi, tọa độ đủ vùng, chứng cứ trỏ map thật, khóa chương, topology thật và topology lỗi giả lập.',
 '- Phần vẽ Thiên Thành, tranh tổng, nhà vùng, NPC, quái và boss giữ nguyên tiến độ riêng; không đánh dấu hoàn thành theo bản thiết kế này.',
 '', 'Xuất lại: `npx tsx scripts/export-world-design.mts`. Kiểm: `npx tsx --test packages/sim/tests/world-design.test.ts`. Hồ sơ quan hệ thương mại chưa tạo giá, thuế, PvP phe hoặc vật phẩm mới.',
 ];
const doc=join(root,'docs/thiet-ke/chinh-tri-dia-ly-thien-thanh.md');mkdirSync(join(root,'docs/thiet-ke'),{recursive:true});writeFileSync(doc,lines.join('\n')+'\n');
console.log(JSON.stringify({regions:WORLD_DESIGN.regions.length,factions:WORLD_DESIGN.factions.length,relations:WORLD_DESIGN.relations.length,chapters:WORLD_DESIGN.chapters.length,mapCount:topology.mapCount,links:topology.directedLinks,regionPairs:topology.connections.length,topologyErrors:topology.errors.length,unreachable:topology.unreachable.length}));
