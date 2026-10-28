"""Khởi tạo MỘT file kế hoạch chính. Không ghi đè tiến độ đã cập nhật."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
target = ROOT / 'docs/ke-hoach-nang-cap-the-gioi.md'
if target.exists(): raise SystemExit('File đã tồn tại; sửa trực tiếp kế hoạch để giữ tiến độ.')
audit = json.loads((ROOT/'.havenlord-stage/world-renewal/audit.json').read_text(encoding='utf-8'))
# Brief mỹ thuật và chính trị là đề xuất triển khai; tên vùng và yêu cầu chủ dự án là đã chốt.
designs = [
('human','Gỗ sồi, đá kem, mái ngói xanh rêu; nhà phố 2–3 tầng, nhà hội và tháp chuông.','Xe hàng, giếng, bảng hội, lò bánh, vườn rau, quán trọ có khách.','Hội đồng thị trấn, lãnh chúa địa phương; không đặt cung vua vào làng khởi đầu.','Linh cẩu đồng, bù nhìn ma, kỵ sĩ rừng tha hóa.','Cổ Thụ Nguyền Rủa','Quảng trường trống; cây và nhà nhỏ rải thưa, thiếu tuyến sinh hoạt.'),
('swamp','Gỗ chống ẩm, mái sậy, nhà sàn 2 tầng; đại sảnh trên cọc và cầu gỗ phân nhánh.','Bến đò, chợ cá, giỏ thuốc, lưới phơi, đèn dầu và bè chở hàng.','Hội trưởng làng và nghiệp đoàn thuyền; tránh lâu đài đá châu Âu trong bùn.','Đỉa giáp bùn, cá sấu lau, phù thủy sương.','Cá Sấu Cổ Đầm','Đã có bản sắc nhà sàn; trung tâm vẫn thiếu mật độ và cao độ.'),
('desert','Sa thạch đỏ, vòm mái, gạch men lam; thành Sahrin có cổng cao, cung điện và phố bậc thang.','Chợ vải, guồng nước, bể chứa, đoàn lạc đà, quầy gia vị, vườn trong sân.','Vua Sahrin, hội thương nhân và liên minh du mục tranh quyền quản lý nước.','Bọ kính sa mạc, kỵ binh cát, linh thể ốc đảo.','Hộ Vệ Giếng Mặt Trời','Nhà vòm nhận diện tốt nhưng chưa đủ tầm thành đô; cần tường thành và cung điện.'),
('highland','Đá sáng và gỗ đón gió, mái dốc; nhà cao sát sườn đồi, tháp cối xay nhiều tầng.','Cầu treo, cờ hướng gió, sân tập, dây phơi, chuồng chim, hàng vải.','Liên minh làng và tu viện Phong; đường hành hương lên trời, chưa phải cổng Thiên Thành tự do.','Dê đá cuồng phong, cung thủ diều, linh hạc.','Kỵ Sĩ Bão','Nhiều cây màu sặc sỡ; cần khoảng nghỉ và địa hình cao nguyên dễ đọc hơn.'),
('tundra','Gỗ thông dày, đá xám, mái tuyết; đại sảnh thợ săn 2–3 tầng với ống khói lớn.','Kho củi, xe trượt, da thú, lò sưởi, cá đông, đèn ấm và lối tuyết nén.','Liên minh thị tộc, hội thợ săn; pháo đài biên giới thay cho cung điện nhiệt đới.','Linh miêu băng, thợ săn vong, cua hồ đóng băng.','Mẫu Lang Băng','Tuyết đã rõ style nhưng trung tâm còn cùng bố cục chữ thập và nhà nhỏ.'),
('volcano','Bazan đen, đồng đỏ, thép; pháo đài Đe Đỏ nhiều tầng, lò rèn đại và đường vận quặng.','Xe mỏ, băng chuyền, bể tôi, ống khói, tời nâng, khu chợ thợ rèn.','Hội đồng người lùn và các gia tộc lò rèn; ghế hội đồng trong pháo đài, không tự thêm vua.','Bọ than, hộ vệ xỉ thép, thằn lằn lò nung.','Cự Tượng Đe Đỏ','Tối và nhiều đốm tương phản; gom ánh lửa theo cụm, làm rõ đường đi.'),
('isles','Gỗ tàu, đá san hô, vải trắng lam; cảng nhiều tầng, hải đăng và nhà hội hàng hải.','Cầu tàu, cần cẩu, kho muối, thuyền neo, chợ hải sản, quán cảng.','Hội đồng cảng, liên đoàn thương thuyền và phe hải tặc ngoài đảo.','Cá kiếm chân cạn, thủy thủ nguyền, sứa giáp.','Hải Xà San Hô','Phong cách biển có sẵn; thiếu tuyến cảng làm điểm nhấn đô thị đông đúc.'),
('fungal','Hang nhiều tầng, nấm khổng lồ tím lam; nhà mọc từ thân nấm, cầu tơ bào tử, đại sảnh vòm nấm.','Vườn bào tử, đèn sinh học, xe quặng tinh thể, bàn chế thuốc, giỏ thu hoạch.','Hội Bào Tử của người nấm; văn hóa cộng sinh, không bê nhà sàn và liễu đầm lầy.','Nấm khiên, sâu bào tử, dơi tinh thể.','Mẫu Thể Bào Tử','Đang dùng biome swamp, cây liễu/đước/nhà sàn và boss Hydra; phải thay bộ cảnh cốt lõi.'),
('ruins','Đá cẩm thạch rạn, đồng cổ, rune lam; tòa thành Aether đổ nát nhưng hùng vĩ, khu phục dựng của học giả.','Cột gãy, tượng triều đại, đồng hồ thiên văn, máy cổ, bàn khai quật và kho di vật.','Hội Khảo Cổ, hậu duệ triều đình và kẻ buôn di vật tranh di sản; phế vương là bí ẩn, không xác nhận vua còn sống.','Lính cơ giới, thư linh, tượng rune tuần tra.','Nhiếp Chính Cơ Giới','Đang dùng cây màu và cối xay highland; cảnh chưa đọc ra thành cổ.'),
('void','Đảo đá lơ lửng, kiến trúc gãy, cầu năng lượng có giới hạn; thành trì liên quân trong không gian rách.','Neo không gian, kho tiếp tế, tháp canh, lều quân y, mảnh kiến trúc treo.','Liên quân các vùng đóng tiền đồn; phe Hư Không đối địch ngoài tuyến phòng thủ.','Ký sinh khe nứt, chiến binh rỗng, mắt hư vô.','Kẻ Nuốt Chân Trời','Hiện gần biến thể núi lửa; thiếu khoảng không, đảo nổi và kết cấu siêu thực.'),
('wood','Rễ cây đại thụ, gỗ sống, đá phủ rêu; nhà ôm thân cây và đại sảnh nhiều tầng bằng cành đan.','Vườn dược, cầu rễ, giọt nhựa, hoa lớn, tổ chim, bàn chạm gỗ.','Hội Thủ Lâm và sứ giả tinh linh; quyền lực gắn với Cây Thế Giới.','Hươu mầm, hộ vệ vỏ cây, nhện dây leo.','Thủ Hộ Rễ Ngàn Năm','Có cây riêng nhưng nhà và boss vẫn thuộc đầm lầy; cây phủ kín nhiều đường.'),
('light','Đá trắng ngà, vàng nhạt, kính màu; thành thánh có tháp cao, bậc thềm, thư viện và thánh đường.','Đài nước, vườn huệ, chợ kinh sách, cờ lễ, sảnh cứu trợ và đèn pha lê.','Giáo hội Bình Minh quản lý thánh địa; xung đột học giả/giáo quyền là đề xuất, không coi ánh sáng luôn thiện.','Hộ vệ kính, sư tử nhật quang, linh tượng lạc ánh.','Chấp Chính Nhật Luân','Có cây vàng riêng nhưng nhà và boss gió còn mượn; nền sáng chưa có kiến trúc tương xứng.'),
('dark','Đá obsidian, sắt đen, tím than; thành trú ẩn nhiều tầng, tháp đêm và phố đèn tím.','Kính thiên văn, vườn dược đêm, đèn lồng, chợ đêm, tượng hộ mệnh.','Hội Dạ Đăng bảo vệ cư dân; phe cuồng tín Ám Ma riêng, không coi mọi cư dân bóng tối là ác.','Miêu bóng, chiến binh dạ giáp, bướm đêm linh.','Nữ Vương Dạ Kính','Có cây riêng nhưng còn nhà núi lửa, boss lửa; nhiều điểm tím vụn gây nhiễu.'),
]
tasks=[]
def task(id,group,name,detail,weight=3,phase=1,region=None,done=False,depends=None,steps=None):
    labels=steps or [('Thiết kế và thông số',10),('Vẽ / triển khai',45),('Ghép vào game / web',25),('Kiểm thử và nghiệm thu',20)]
    tasks.append(dict(id=id,group=group,name=name,detail=detail,weight=weight,phase=phase,region=region,
        depends=depends or [],steps=[dict(label=l,weight=w,done=done,evidence='Kiểm kê 26/10/2026: .havenlord-stage/world-renewal/' if done else '') for l,w in labels]))
task('audit','Chuẩn bị','Kiểm kê 174 map và 25 boss','Đã xem ảnh minimap của 174 map và 13 trung tâm; kiểm đếm ảnh frame bằng hash RGBA, không chỉ số slot. Chưa phải nghiệm thu trong Unity.',2,0,done=True,steps=[('Dữ liệu và ảnh tổng quan',100)])
task('style','Chuẩn bị','Chốt quy chuẩn mỹ thuật và tỷ lệ','Duyệt một phố mẫu với người chơi gốc để chốt pixel, cửa, tầng nhà, ánh sáng và khử nhiễu.',3,1,depends=['audit'])
task('politics','Cốt truyện','Bản đồ chính trị, vua và phe phái','Vua Sahrin; hội đồng Đe Đỏ; triều đình cổ Aether; liên quân Hư Không. Duyệt thêm phe của Mộc, Sáng, Tối và quan hệ thương mại/xung đột.',4,1,depends=['audit'])
task('sky-lore','Cốt truyện','Thiên Thành và vị thần tri thức','Lâu đài trên không có một vị thần; hé lộ tri thức thế giới và lịch sử khởi nguyên. Tên, ngoại hình, điều kiện lên và các chương tiết lộ còn là đề xuất.',5,1,depends=['politics'])
for rid,arch,props,politics,mobs,boss,issue in designs:
    r=next(x for x in audit['regions'] if x['id']==rid)
    r.update(architecture=arch,life=props,politics=politics,newMobs=mobs,newBoss=boss,finding=issue)
    p=2 if rid in ('human','fungal','ruins','wood','light','dark') else 3
    task('hub-'+rid,'Trung tâm vùng',r['hubName']+' — xây lại trung tâm',arch+' '+props+' Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.',6,p,rid,depends=['style','politics'])
    task('env-'+rid,'Cảnh quan',r['name']+' — toàn bộ map',issue+' Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại '+str(r['mapCount'])+' map ở zoom chơi thật.',5,p,rid,depends=['style'])
    task('mob-'+rid,'Quái và boss',r['name']+' — thêm quái','Đề xuất ít nhất 3 loài mới: '+mobs+' Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.',4,4,rid,depends=['env-'+rid])
    task('newboss-'+rid,'Quái và boss',r['name']+' — boss mới','Ý tưởng: '+boss+'. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.',5,4,rid,depends=['mob-'+rid])
for b in audit['bosses']:
    task('boss-'+b['id'],'Boss cũ',b['name']+' — frame / kích thước','Khung hiện tại '+str(b['frameSize']['width'])+'×'+str(b['frameSize']['height'])+'; '+str(len(b['lowFrames']))+' chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.',3,4,depends=['style'])
task('sky-map','Cảnh quan','Lâu đài trên không — map mới','Sân trời, cổng, đại thư viện, điện khởi nguyên; một vị thần có đối thoại/chương tri thức. Chừa không gian cho cảnh lộ lịch sử.',7,5,depends=['sky-lore','style'])
task('continent-layout','Bản đồ tổng','Bố trí địa lý và tuyến vùng mới','Sắp lại 13 vùng, nhánh Mộc/Sáng/Tối, thành chính và Thiên Thành trên tầng mây; khớp cổng thật, có chỗ cho hồ cá và mê cung.',3,1,depends=['politics','sky-lore'])
task('continent-art','Bản đồ tổng','Vẽ lại tranh lục địa','Vẽ native pixel nét, lớp biển/đất/độ cao riêng, không chữ giả trong ảnh; UI đặt nhãn/ghim đa ngôn ngữ. Cập nhật cả Unity lẫn web.',6,5,depends=['continent-layout'])
task('world-qa','Nghiệm thu','Đi qua toàn bộ map trong Unity','Cổng, đường đi, va chạm, nhà che người, boss vừa camera, ánh sáng, độ nét, fps trên PC/APK; ảnh trước/sau và video. Không đánh dấu hoàn thành từ minimap.',5,6,depends=['continent-art','sky-map']+[f'env-{x[0]}' for x in designs])
task('skills','Tính năng đã chốt','140 kỹ năng và thiên phú cấp 10','Kiếm 3 phái ×10 + khiên/thương/cung ×10 + pháp sư 8 hệ ×10 =140; mỗi bộ 7 chủ động/3 bị động, chiêu cuối dồn sát thương boss. Một nguyên tố/user, 8 hệ đồng đều 12,5%.',10,7)
task('home','Tính năng đã chốt','Khuôn viên, nhà và thăm bạn bè','Mỗi user một khuôn viên; xây/sửa/trang trí; khách tham quan không tự lấy đồ hoặc thu hoạch.',7,7)
task('production','Tính năng đã chốt','Trồng trọt, chế tạo và nấu ăn','Thu hoạch thực phẩm/nhiên liệu/nguyên liệu; máy chủ xác minh thời gian và công thức.',6,7,depends=['home'])
task('fishing','Tính năng đã chốt','Hồ câu cá cùng bạn bè','Map chung, cùng vào câu; máy chủ xác minh lượt/cá, cơ chế tổ đội và vật phẩm sẽ thiết kế thêm.',5,7)
task('market','Tính năng đã chốt','Chợ giao thương','Lúa mì, cây giống, cá, lưu niệm, đồ nhà; giao dịch an toàn, giá/phí/đơn offline chưa chốt.',7,7,depends=['production','fishing'])
task('mazes','Tính năng đã chốt','Mê cung châu báu','Nhiều mê cung có vàng, châu báu và đồ trang trí nhà; thiết kế số lượng, theme, tổ đội và bảng rơi riêng.',7,7,depends=['home'])
task('cast30','Nhân vật','30 nhân vật liền vũ khí','5 class ×6 (3 nam/3 nữ). Chưa coi số ảnh nguồn là nhân vật đã phát hành. Cần đủ chuyển động, QA tỷ lệ/độ nét và build rồi mới reset DB theo đợt phát hành đã yêu cầu.',10,2)
task('web','Web và công bố','Làm lại portal game và bảng tiến độ','Giao diện fantasy trên PC/điện thoại; kế hoạch riêng admin, nội dung công khai chia hiện có/đang làm. Chỉ hoàn thành sau kiểm thử và lên link thật.',3,1,steps=[('Thiết kế',10),('Triển khai',45),('Kiểm thử',20),('Phát hành',25)])
data={'version':1,'updated':'2026-10-26','title':'Tái thiết thế giới Aether','scope':'Tiến độ của kế hoạch nâng cấp này; không phải % hoàn thành toàn bộ game.',
      'method':'Mỗi việc = tổng trọng số các mốc đã hoàn thành / tổng trọng số mốc. Tổng = trung bình có trọng số khối lượng việc. Chỉ tích mốc khi có bằng chứng; không tự tăng theo thời gian.',
      'groups':['Chuẩn bị','Trung tâm vùng','Cảnh quan','Quái và boss','Boss cũ','Cốt truyện','Bản đồ tổng','Nghiệm thu','Tính năng đã chốt','Nhân vật','Web và công bố'],
      'totals':audit['totals'],'regions':audit['regions'],'bosses':audit['bosses'],'tasks':tasks}
head='''# Kế hoạch tổng — tái thiết thế giới và phát triển Aether

Ngày lập: **26/10/2026**. File này là nguồn tiến độ duy nhất cho tab **Kế hoạch** trên trang quản trị web. Chưa có asset mới của đợt tái thiết này được vẽ hoặc phát hành. Không dùng % cũ của bản đồ đã có để tính vào phần vẽ lại.

## Yêu cầu đã chốt

- Vẽ lại trung tâm của **tất cả 13 vùng** thành nơi đông đúc nhất vùng: nhà cao, đẹp, nhiều đồ và sinh hoạt, đúng văn hóa địa phương. **Giữ nhà nhỏ cũ làm nhà phụ**, không xóa hoặc phóng ảnh cũ thành nhà chính.
- Rà mọi map. Nấm, Phế tích, Hư Không phải có bộ cảnh riêng; hoàn thiện Mộc, Ánh sáng, Bóng tối, không chỉ đổi màu cây hoặc ghép nhà/quái của vùng khác.
- Thêm quái và boss từng vùng. Kiểm lại boss cũ ít frame; boss lớn phải có tầm vóc lớn hơn và đọc rõ đòn.
- Vẽ lại bản đồ tổng cho địa lý mới. Thêm **lâu đài trên không có một vị thần**, nơi hé lộ tri thức toàn thế giới và lịch sử khởi nguyên.
- Thành chính, nhà vua và phe phái phải hợp vùng và cốt truyện. Tên mới, số nhà, loài quái, boss và quan hệ chính trị dưới đây là **đề xuất thiết kế**, chưa phải chi tiết được chủ dự án duyệt.
- Khử nhiễu, nét pixel nhất quán; phân biệt bản đang chơi, đang làm và dự kiến trên web; công bố nội dung theo từng phần hoàn thành.

## Hiện trạng và giới hạn kiểm tra

Đã kiểm kê **174 map / 13 vùng / 25 boss** trong asset sản xuất. Đã xem 174 ảnh minimap render có prop và bảng tổng quan 13 trung tâm; đây là **rà bố cục ở ảnh thu nhỏ**, chưa thay cho chạy Unity và đánh giá ở tỷ lệ chơi. Dữ liệu NPC runtime còn ở lớp game nên số `npcs` rỗng trong map JSON không được diễn giải là game không có NPC.

Rừng Nấm dùng lại nền/cây/nhà sàn đầm lầy. Phế tích dùng lại cây màu và cối xay cao nguyên. Hư Không dùng nhiều cảnh núi lửa. Mộc/Sáng/Tối có cây riêng nhưng nhà và quái/boss còn mượn. Trung tâm nhiều vùng cùng bố cục chữ thập, khoảng rỗng lớn, ít công trình tạo đường chân trời. Interior chủ yếu còn hình phòng/hành lang đơn giản. Cổng Nguyên Tố cũng cần điểm nhấn và đồ cảnh thật.

25 boss đều có ít nhất một chuỗi dưới ngưỡng mới (idle <4, đi/đánh/gục <6 ảnh khác nhau). **Phần lớn đòn đánh hướng chính đã có 8 ảnh thật**, thiếu nhiều ở hướng chéo tạm và chuỗi đi; không được gọi tất cả boss là chỉ có một frame. Ưu tiên Quỷ vương 96×104 và Golem dung nham có chuỗi hướng chính dưới 4 ảnh; rồi Hoả thần, Kraken, nhóm rồng. Đếm bằng hash RGBA của ảnh cắt từ atlas, không tính số key trỏ cùng một ô là frame mới.

Bằng chứng và cách chạy lại: `npx tsx scripts/audit-world-plan.mts`, `python docs/tools/audit-world.py`; ảnh và JSON ở `.havenlord-stage/world-renewal/`. Không sửa atlas game khi audit.

## Chuẩn mỹ thuật và nghiệm thu

1. Chọn nhân vật PixelLab gốc làm thước. Chốt một bảng tỷ lệ native trước khi vẽ: cửa cao khoảng 1,3–1,5 lần thân người; một tầng nhà khoảng 1,8–2,2 lần chiều cao người. Nhà chính 2–4 tầng theo vùng; công trình biểu tượng cao hơn nhưng không che đường chiến đấu. Đây là mục tiêu thử, phải duyệt cảnh mẫu trong Unity.
2. Giữ hướng sáng, góc nhìn, viền và mật độ pixel. Vẽ đủ kích thước gốc; lọc Point, không blur/upscale ảnh nhỏ. Nền giảm tương phản, điểm nhấn gom cụm, tránh dither và điểm sáng vụn; không khử nhiễu bằng làm nhòe toàn ảnh.
3. Tách mái/tường/đồ trước-sau nếu cần che người đúng; footprint chỉ ở chân nhà, có fade mái khi đi khuất. Cửa, thang, hiên và đường vào phải đi được. Nhà nhỏ giữ ID và tái bố trí vào kho, chuồng, nhà vườn, phố phụ.
4. Mỗi trung tâm có các cụm chợ, nghề thủ công, dân cư và một landmark. NPC có vòng đi/nghỉ/giao tiếp nhẹ; không nhồi đồ vào trục cổng, điểm hồi sinh và lối chiến đấu. Dùng pool/culling/atlas, đo hiệu năng theo thiết bị mục tiêu.
5. Đề xuất quái thường: idle 6, di chuyển 8, tấn công 10–12, trúng đòn 4, gục 8 frame/hướng. Boss: idle 8, đi 10–12, đánh 12–16 với lấy đà/ra đòn/hồi, gục 10–12. Hướng chéo không được đứng hình bằng lặp slot. Cho phép mirror có kiểm tra tay/vũ khí; không tự đảo bất đối xứng sai thiết kế.
6. Boss lớn vẽ lại để thân hiện rõ khoảng 2,5–4 lần người theo loài, rồng/Kraken có thể lớn hơn; thử camera trước. Tách sprite bounds, chân neo, hurtbox và vùng đánh; đòn báo trước nhìn được khi boss che cảnh. Không tăng hitbox bằng scale ảnh mù quáng.
7. Nghiệm thu bằng ảnh 1× và 2×, video đứng/đi/đánh, so kích thước cùng nhân vật, kiểm góc cắt atlas, viền alpha, sorting, va chạm, cổng, minimap và PC/APK. Dữ liệu và minimap phải dựng lại từ pipeline, không sửa tay một bản rồi bỏ bản còn lại.

## Địa lý, chính trị và Thiên Thành

Giữ tuyến khởi đầu Thistlewood → các vùng theo cấp; sắp lại vị trí địa lý và các đường giao thương hợp lý thay vì đổi tọa độ cổng tùy tiện. Mộc là nhánh rừng cổ, Sáng là thánh địa tách khỏi sa mạc, Tối là vùng trú ẩn đêm tách khỏi Hư Không. Chừa lớp địa lý cho hồ câu và các cửa mê cung; mê cung là điểm phụ, không thay hết vùng ngoài trời.

Sahrin là thành của vua sa mạc; Đe Đỏ là pháo đài hội đồng người lùn; Phế tích là toà thành triều đại đã sụp; Hư Không là thành trì liên quân. Đề xuất thánh thành ở vùng Sáng và thành trú ẩn vùng Tối, không biến tất cả làng thành cung vua. Mỗi phe có vùng ảnh hưởng, mục tiêu, đồng minh/đối thủ và quan hệ buôn bán; chưa thêm cơ chế PvP phe hoặc thuế trước khi thiết kế.

**Thiên Thành Khởi Nguyên** là tên tạm. Vẽ quần đảo mây với một lâu đài lớn ở tầng trên của tranh tổng, đường lên riêng có điều kiện; bên trong có đại thư viện và điện khởi nguyên. Vị thần ở đó lưu giữ tri thức của mọi vùng và ký ức khởi nguyên. Chia tiết lộ thành chương: nguồn thế giới → nguyên tố → triều đại Aether → rạn nứt hiện tại. Điều kiện mở, danh tính thần, quan hệ với thần cũ và phần bí mật cuối chưa chốt. Public web chỉ teaser; admin giữ bản kế hoạch đầy đủ.

Tranh bản đồ tổng phải có tầng đất/biển/mây, 13 vùng đọc được, ranh giới địa hình, tuyến giao thông, thành chính và biểu tượng Thiên Thành. Chữ và ghim ở lớp UI, không để AI vẽ chữ trong ảnh. Thay tranh cũ đồng thời ở Unity và web sau khi ghim khớp.

## Trình tự làm và công bố

- GĐ0: kiểm kê và brief (đã có bằng chứng).
- GĐ1: mẫu chuẩn, chính trị, bố trí bản đồ và giao diện web.
- GĐ2: Thistlewood mẫu; ưu tiên Nấm/Phế tích/Mộc/Sáng/Tối và nhân vật đang dở.
- GĐ3: các trung tâm/cảnh quan vùng còn lại.
- GĐ4: quái và boss mới; sửa 25 boss cũ theo audit.
- GĐ5: Thiên Thành, tranh tổng và cổng/chương truyện.
- GĐ6: chạy hết map, tối ưu và build PC/APK.
- GĐ7: các hệ thống gameplay đã chốt; có thể làm song song sau khi đủ nền dữ liệu.

Thông tin công khai lên theo mốc: giới thiệu hướng phát triển → ảnh trước/sau đã duyệt → clip gameplay → ghi chú phiên bản và link tải sau build thật. Chưa công bố ngày hẹn tự suy ra, chưa gọi kế hoạch là bản cập nhật đã chơi được. Giữ tải/cập nhật client cũ hoạt động. Không reset DB khi chỉ đổi web; reset chỉ thuộc đợt phát hành nhân vật đã được yêu cầu trước đó, sau build/QA và backup.

## Các tính năng đã chốt cần theo dõi cùng

30 nhân vật (5 class × 3 nam/3 nữ, liền vũ khí) đang làm chuyển động và QA, chưa được tính là đã phát hành. 140 chiêu gồm kiếm 3 phái ×10, khiên/thương/cung ×10, pháp sư 8×10; mỗi bộ 7 chủ động, 3 bị động, chiêu cuối chuyên dồn sát thương boss. Thiên phú phát hiện ở cấp 10, một trong 8 nguyên tố/user với xác suất đều 12,5%.

Khuôn viên riêng/user: trồng/thu hoạch thực phẩm và nhiên liệu, chế tạo/nấu ăn, sửa và trang trí nhà, bạn bè tham quan. Hồ câu chung cùng bạn bè. Chợ giao thương lúa mì/cây giống/cá/lưu niệm/đồ nhà. Nhiều mê cung cung cấp châu báu/vàng/đồ nhà. Chi tiết nguồn: `ke-hoach-nha-rieng.md`, `ke-hoach-xa-hoi.md`, `ke-hoach-nguyen-to.md`, `phac-thao-ba-phai-kiem.md`; không tự coi gameplay đã triển khai vì đã có tài liệu.

## Tiến độ — nguồn dùng chung với web admin

Mốc mỗi đầu việc có trọng số tổng 100; chỉ tích `done` kèm `evidence` khi có sản phẩm/check thực tế. `% đầu việc = tổng trọng số mốc xong`; `% tổng = Σ(% việc × khối lượng)/Σ(khối lượng)`. Khối lượng là ước lượng tương đối, không phải giờ hay lịch hẹn. Web tự tính từ khối dữ liệu dưới đây mỗi lần tải; **không có bản % chép riêng**. Khi đổi phạm vi/trọng số phải ghi ngày và lý do, vì mẫu số tổng có thể đổi.

Phần dưới gồm brief từng vùng, số liệu audit boss và checklist công việc. `architecture/life/politics/newMobs/newBoss` là đề xuất; `finding`, kích thước và số frame là hiện trạng kiểm kê. Art mới để 0% tới khi thực hiện. Web chỉ có quyền đọc; sửa file này và bấm tải lại để cập nhật.

<!-- aether-plan:start -->
'''
target.write_text(head+'```json\n'+json.dumps(data,ensure_ascii=False,indent=2)+'\n```\n<!-- aether-plan:end -->\n',encoding='utf-8')
print(str(target), len(tasks),'đầu việc')
