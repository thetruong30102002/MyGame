// Chuyển hướng nội dung; không sửa dữ liệu lưu Unity.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {WORLD_DESIGN} from '../packages/sim/src/worldDesign.ts';
const archive=resolve('docs/archive/2026-10-26-ancien-univers');mkdirSync(archive,{recursive:true});
for(const file of ['story.md','story-arc.md','cot-truyen-aether.md']){
 try{const src=resolve('docs',file),old=readFileSync(src,'utf8');if(!old.includes('Tài liệu đã nghỉ sử dụng')){copyFileSync(src,resolve(archive,file));writeFileSync(src,'# Tài liệu đã nghỉ sử dụng\n\nBản truyện cũ được lưu tại [kho lịch sử](archive/2026-10-26-ancien-univers/'+file+'). Không dùng làm nội dung hiện hành.\n\nNguồn mới: [Định hướng Aether](dinh-huong-aether.md) và [kế hoạch tổng](ke-hoach-nang-cap-the-gioi.md).\n');}}catch{}
}
const src=resolve('packages/sim/src/worldDesign.ts'),old=readFileSync(src,'utf8');
if(!old.includes('2026-10-26-roster-reboot'))copyFileSync(src,resolve(archive,'worldDesign.ts.txt'));
const factionRows=[
 ['rowanmere_crown','Triều đình Đồng Bằng','human','Bảo vệ các tuyến đường và cân bằng lợi ích giữa thủ phủ với làng nhỏ.','Quân trấn, kho lương, luật giao thương.','Thiếu tiếng nói từ vùng ngoài thành.'],
 ['thistlewood_commons','Hội đồng Làng Khởi Hành','human','Phát triển vườn hộ, nghề thủ công và đào tạo người mới.','Đất canh tác, xưởng gỗ, thương quán.','Mùa vụ và nhu cầu mở rộng làng cạnh tranh diện tích.'],
 ['seal_order','Nghiệp đoàn Công Trình','human,swamp,desert,highland,volcano,fungal,ruins,void','Xây cầu, đập và trạm tiếp tế giữa các vùng.','Kỹ sư và đội vận chuyển.','Cần đồng thuận cư dân trước khi khai thác tài nguyên.'],
 ['grey_reed','Liên hội Bến Nước','swamp','Giữ đường thủy, mùa cá và các vườn dược liệu.','Thuyền, bến nổi và người dẫn đường.','Lũ và nguồn nước ô nhiễm.'],
 ['sahrin_court','Vương triều Ốc Đảo','desert','Bảo vệ giếng nước và tuyến thương caravan.','Cung thành, đội hộ tống, kho nước.','Phân phối nước giữa phố lớn và trạm xa.'],
 ['zahra_network','Hội Thương Nhân Cát','desert,isles','Kết nối hàng hóa sa mạc với cảng biển.','Đoàn xe và bản đồ giếng.','Chi phí đường dài và an toàn đoàn buôn.'],
 ['wind_league','Liên hội Trạm Gió','highland','Giữ đường đèo và mạng cối xay.','Hoa tiêu núi, thợ máy và len.','Bão và các trạm cô lập.'],
 ['snow_clans','Hội đồng Tuyết Lĩnh','tundra','Giữ nơi trú, kho củi và mùa đánh cá băng.','Thợ săn và kho dự trữ.','Mùa đông dài hơn mùa thu hoạch.'],
 ['red_anvil','Hội đồng Lò Rèn','volcano','Rèn công cụ và khai khoáng bền vững.','Thợ rèn, mỏ và hợp kim.','An toàn lò và lao động trong vùng nóng.'],
 ['coral_ports','Liên hội Cảng Biển','isles','Giữ vận tải, chợ cá và cứu nạn.','Đội tàu, kho muối và hoa tiêu.','Áp lực khai thác rạn biển.'],
 ['maris_people','Hội Bảo Vệ Rạn','isles','Bảo vệ sinh cảnh và nguồn thực phẩm biển.','Tri thức dòng biển và thợ lặn.','Cần nguồn thu thay cho khai thác quá mức.'],
 ['spore_commons','Cộng đồng Bào Tử','fungal','Gìn giữ thành phố nấm và các vườn phát quang.','Dược nấm và tinh thể hang.','Bào tử lạ lan qua đường hầm.'],
 ['lumerian_archive','Viện Khảo Cổ','ruins','Khôi phục công nghệ và lịch sử khởi nguyên.','Học giả, thư khố và công cụ đo.','Phân biệt dữ kiện với giả thuyết.'],
 ['relic_claimants','Hội Sưu Tầm Cổ Vật','ruins','Định nguồn và bảo tồn châu báu tìm được.','Thợ phục chế và thị trường đồ cổ.','Nạn trộm di vật, hàng giả.'],
 ['frontier_alliance','Liên quân Biên Giới','void','Giữ tiền đồn trước các khe nứt.','Quân y và tiếp tế liên vùng.','Bảo vệ người dân khi nguồn tiếp tế bị chia cắt.'],
 ['root_wardens','Hội Thủ Lâm','wood','Giữ rừng cổ, cây giống và vườn thuốc.','Thảo dược và đường rễ.','Cân bằng nhu cầu gỗ với phục hồi rừng.'],
 ['dawn_custodians','Học viện Bình Minh','light','Chia sẻ tri thức ánh sáng, chữa lành và công nghệ pha lê.','Thư viện và trường học.','Tránh độc quyền tri thức.'],
 ['night_lanterns','Hội Đèn Đêm','dark','Bảo vệ thành phố đêm và lối qua rừng tối.','Đèn dẫn đường và nghề vải.','Giữ an toàn mà không cô lập vùng.'],
 ['rift_cult','Đoàn Khai Thác Khe Nứt','dark,void','Chiếm nguồn lực từ các vết rạn.','Máy dò và mạng buôn di vật.','Khai thác quá mức đe dọa cả cư dân bóng tối.'],
 ['caravan_compact','Hiệp hội Giao Thương','human,swamp,desert,highland,tundra,volcano,isles,fungal,ruins,wood,light,dark,void','Kết nối nông sản, cá, cây giống và đồ trang trí.','Chợ, kho trung chuyển, người bảo lãnh.','Cần kiểm nguồn hàng, chống lạm phát và giao dịch gian lận.'],
];
const factions=factionRows.map(([id,name,regions,goal,leverage,cost])=>({id,name,status:'proposal',regions:regions!.split(','),goal,leverage,cost}));
const concepts:Record<string,[string,string,string,string,string[]]>={
 human:['Vương quốc đồng bằng và hội đồng làng','Quân chủ tại thủ phủ; tên và nhân vật vua chưa chốt','Nhà gỗ đá 2–3 tầng, mái dốc, chợ nông sản và công xưởng.','Đồng bằng khởi hành; mở về hồ câu và các khuôn viên cá nhân.',['Giao lúa mì cho chợ đầu mối.','Khôi phục một nhà phụ thành xưởng nghề.']],
 swamp:['Liên hội làng sông','Hội đồng các bến nước','Nhà sàn cao, cầu gỗ, thuyền hàng và vườn dược liệu nổi.','Đầm nước nhiều tầng cao độ, đường nổi và bến liên kết.',['Dọn đường thủy để mở tuyến chợ cá.','Tìm hạt giống chịu ngập trong mê cung kênh chìm.']],
 desert:['Vương quốc ốc đảo','Vua hoặc nữ hoàng ốc đảo; danh tính chưa chốt','Cung thành sa thạch cao, vòm che nắng, chợ thảm và giếng nước.','Cồn cát, khe đá và các trạm caravan cách xa nhau.',['Hộ tống cây giống về giếng mới.','Tìm kính cổ và đồ lưu niệm trong mê cung cát.']],
 highland:['Liên minh thành trạm núi','Hội đồng các trạm gió','Nhà đá cao mái đồng, cầu treo, cối xay và bến mây.','Cao nguyên nhiều gió; dành tuyến riêng lên Thiên Thành.',['Khôi phục trạm gió phục vụ đoàn hàng.','Khảo sát bến mây trước khi mở đường lên trời.']],
 tundra:['Liên minh thị tộc','Hội đồng Tuyết Lĩnh','Nhà gỗ dày 2 tầng, mái tuyết dốc và đại sảnh lò sưởi.','Miền băng tuyết, hồ đóng băng và các điểm trú bão.',['Dự trữ thực phẩm cho trạm xa.','Câu cá băng và thu thập vật liệu cách nhiệt.']],
 volcano:['Thành bang công nghiệp','Hội đồng Lò Rèn','Pháo đài bazan cao, cầu thép, lò rèn và đường vận quặng.','Thềm dung nham và hệ mỏ; nhà ở tách khỏi luồng lò nóng.',['Sửa lò công cộng để mở công thức chế tạo.','Tìm nhiên liệu hiếm trong mỏ nguy hiểm.']],
 isles:['Liên bang cảng đảo','Đại diện cảng và cộng đồng rạn','Nhà cảng nhiều tầng, đài hải đăng và chợ cá dọc cầu tàu.','Quần đảo nhiệt đới, rạn san hô và lối xuống hang biển.',['Tổ chức chuyến câu cùng bạn bè.','Trục vớt châu báu và đồ trang trí có nguồn gốc.']],
 fungal:['Thành phố cộng sinh dưới đất','Đại hội các cụm nấm','Nhà thân nấm nhiều tầng, cầu sợi nấm, đèn bào tử; bộ cảnh riêng.','Đô thị nấm ngầm, không dùng cây đầm lầy làm cây chủ đạo.',['Nuôi nấm thực phẩm tại vườn hang.','Tìm vật phẩm phát quang trong mê cung rễ nấm.']],
 ruins:['Khu khảo cổ liên vùng','Viện Khảo Cổ và hội bảo tồn','Tháp đá vỡ cao, cơ cấu cổ, đường khảm và thư khố; bỏ cây/cối xay mượn.','Vành đai phế tích nhiều niên đại, giữ khoảng trống gợi quy mô cổ thành.',['Ghi nguồn một kho châu báu trước khi khai quật.','Tìm bản ghi dẫn tới tri thức khởi nguyên.']],
 void:['Tiền tuyến liên vùng','Bộ chỉ huy Liên quân Biên Giới','Thành trì trên đá nổi, neo ma pháp, trạm quân y và cổng khe nứt.','Vùng rạn không gian riêng, không đồng nhất miền Bóng tối.',['Bảo vệ đoàn tiếp tế.','Thu thập mẫu rạn để Viện Khảo Cổ nghiên cứu.']],
 wood:['Cộng đồng thành rừng','Hội Thủ Lâm và đại diện vườn','Nhà ôm thân cây cao, cầu rễ, vườn treo và xưởng cây giống.','Rừng cổ đa tầng với bộ cây, rễ và đồ cảnh Mộc riêng.',['Ươm cây giống cho khuôn viên người chơi.','Khôi phục vườn thuốc và tìm đồ gỗ cổ.']],
 light:['Thánh thành học thuật','Học viện Bình Minh','Tháp đá sáng, mái kính, sân học viện và vườn pha lê.','Bậc thềm sáng, kiến trúc cao và khoảng sân rõ ràng.',['Phục chế đèn pha lê cho nhà riêng.','Sưu tầm bản chép về thiên phú nguyên tố.']],
 dark:['Liên hội đô thị đêm','Hội Đèn Đêm','Nhà đá tím cao, mái đen, đèn dẫn đường và chợ đêm; bộ cảnh riêng.','Rừng đêm và đô thị trú ẩn; màu tối không mặc định phản diện.',['Mở tuyến chợ đêm an toàn.','Tìm chất nhuộm và đồ lưu niệm trong mê cung đêm.']],
};
const regions=WORLD_DESIGN.regions.map(r=>{const [government,authority,architecture,geography,questHooks]=concepts[r.region]!;return {...r,government,authority,tension:architecture,questHooks,continuity:'Thiết kế mới: '+geography+' Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.'};});
const layout=WORLD_DESIGN.layout.map(p=>({...p,geography:concepts[p.id]?.[3]||'Lâu đài trên không với một vị thần giữ tri thức và lịch sử khởi nguyên. Chưa mở map chơi.'}));
const relations=WORLD_DESIGN.relations.map(r=>({...r,reason:r.kind==='trade'?'Trao đổi nguồn hàng đặc trưng và mở đường vận chuyển.':r.kind==='alliance'?'Hợp tác bảo vệ sinh cảnh và an toàn dân cư.':'Khác biệt về quyền khai thác và sử dụng tài nguyên.',pressure:'Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay.'}));
const evidence=WORLD_DESIGN.evidence.map((e,i)=>({...e,name:['Bản ghi Đồng Bằng','Niên luân Cổ Thụ','Bản chép Bình Minh','Bản khắc Đèn Đêm','Sổ luồng Bến Nước','Lịch giếng Ốc Đảo','Bản đo Trạm Gió','Hợp kim Lò Rèn','Bản ghi Cổ Thành','Mẫu rạn Không Gian'][i],note:'Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game.'}));
const chapterRows=[
 ['origin','Khởi nguyên Aether','Nơi hội tụ đầu tiên của vật chất và dòng Aether hình thành thế giới. Thần Tri Thức lưu giữ dấu vết khởi nguyên; chi tiết nguồn gốc cuối cùng còn là bản thảo.'],
 ['pact','Tám dòng thiên phú','Bóng tối, Ánh sáng, Mộc, Thủy, Hỏa, Thổ, Phong và Băng là tám thiên phú. Cấp 10 phát hiện đúng một nguyên tố, xác suất đều 12,5%; class và giới tính không quyết định nguyên tố.'],
 ['burden','Những thành phố và đường giao thương','Các cộng đồng xây thành, phát triển nghề và trao đổi tài nguyên theo môi trường. Khuôn viên, chợ và các mê cung kết nối đời sống người chơi với lịch sử từng vùng.'],
 ['memory','Tri thức trên tầng mây','Những bản ghi từ mọi vùng hội tụ ở Thiên Thành. Người chơi khám phá nguyên nhân các vết rạn và tự lựa chọn vai trò của mình; diễn biến và kết thúc sẽ được viết theo hướng mới.'],
];
const chapters=WORLD_DESIGN.chapters.map((c,i)=>({...c,id:chapterRows[i]![0],title:chapterRows[i]![1],revelation:chapterRows[i]![2],keeper:['Mỗi miền đất giữ một phần của lịch sử.','Hãy đối chiếu những gì tìm thấy với bản ghi tại thư khố.'],question:'Người chơi sẽ mang tri thức này về giúp cộng đồng như thế nào?',journal:'Đã đọc bản ghi nghiên cứu của chương '+(i+1)+'. Nội dung đang ở giai đoạn thiết kế.'}));
const sky={...WORLD_DESIGN.sky,constraints:['Đúng một vị thần tại lâu đài trên không.','Giữ tổng 140 kỹ năng trong thiết kế mới.','Nguyên tố không quy định đạo đức, quốc tịch hoặc giới tính.','Điều kiện cấp 60 hiện là đề xuất, chưa khóa đường chơi.','Chỉ mở map khi đã có asset, nhiệm vụ và QA.']};
const notes=['Hướng selectable-roster-reboot: người chơi chọn một trong 30 tạo hình, 5 class, mỗi class 3 nam + 3 nữ; mỗi người dùng một vũ khí. Bộ hình vẽ liền hiện tại là mẫu đối chiếu; yêu cầu mới thống nhất tay cầm chính và khảo sát vũ khí thay thế theo từng frame, chưa triển khai đại trà.','Nhân vật đời cũ sẽ được biên soạn thành NPC. Không tiếp tục tuyến nhân vật chính và cốt truyện cũ trên web hiện hành.','Tám nguyên tố phát hiện ở cấp 10, xác suất bằng nhau 12,5%; mỗi nhân vật chỉ có một nguyên tố.','140 kỹ năng là phạm vi thiết kế; kiếm có 3 phái, pháp sư có 8 bộ nguyên tố. Chiêu cuối từng bộ chuyên dồn sát thương.','Khuôn viên riêng, trồng trọt, chế tạo, nấu ăn, nhà có bạn bè tham quan; hồ câu chung, chợ và mê cung là hướng phát triển đã chốt.','13 ID vùng và các cổng hiện có được dùng để đối chiếu kỹ thuật. Văn hóa, thành chính, chính trị và tên tổ chức mới dưới đây là đề xuất, không kế thừa cốt truyện cũ.','Thiên Thành có một vị thần hé lộ tri thức toàn thế giới và lịch sử khởi nguyên. Bản đồ tổng sẽ vẽ lại sau khi bố trí được duyệt.'];
const reserved=WORLD_DESIGN.reserved.map(r=>({...r,note:'Dành chỗ thiết kế cho '+r.name.toLocaleLowerCase('vi')+'; nguồn thực phẩm, châu báu hoặc trang trí. Chưa mở map.'}));
const encode=(v:unknown)=>JSON.stringify(v,null,'\t');
let next=old.slice(0,old.indexOf('export const WORLD_DESIGN_REVISION'));
next+=`export const WORLD_DESIGN_REVISION = '2026-10-26-roster-reboot';\nexport const WORLD_DESIGN_STATUS = 'design-draft';\n`;
for(const [name,type,value] of [['FACTIONS','readonly FactionDesign[]',factions],['POLITICAL_REGIONS','readonly PoliticalRegion[]',regions],['FACTION_RELATIONS','readonly FactionRelation[]',relations],['WORLD_LAYOUT','readonly WorldPin[]',layout],['RESERVED_DESTINATIONS','',reserved],['WORLD_DESIGN_NOTES','',notes]])next+='export const '+name+(type?': '+type:'')+' = '+encode(value)+(type?';':' as const;')+'\n';
next+=old.slice(old.indexOf('export interface ArchiveEvidence'),old.indexOf('export const ARCHIVE_EVIDENCE'));
next+='export const ARCHIVE_EVIDENCE: readonly ArchiveEvidence[] = '+encode(evidence)+';\n';
next+=old.slice(old.indexOf('export interface ArchiveChapter'),old.indexOf('export const ARCHIVE_CHAPTERS'));
next+='export const ARCHIVE_CHAPTERS: readonly ArchiveChapter[] = '+encode(chapters)+';\nexport const SKY_CASTLE_DESIGN = '+encode(sky)+' as const;\n';
next+=old.slice(old.indexOf('export interface ArchiveProgress'));writeFileSync(src,next);
console.log('Đã thay hướng thế giới mới; lưu bản cũ trong docs/archive, chưa đổi quest đang chạy.');
