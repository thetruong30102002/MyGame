# Sinh docs/cot-truyen-aether.html + docs/cot-truyen-aether.md (cốt truyện 10 vùng × 7 map, bản chờ duyệt) — sửa dữ liệu ở đây rồi chạy:
#   python docs/tools/cot-truyen.py
# Tên vùng / map / boss phải trùng docs/tools/the-gioi-aether.py (script tự kiểm và báo tên lệch).
import html
import os
import re

TOOLS = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(TOOLS, '..')
OUT = os.path.join(DOCS, 'cot-truyen-aether.html')
OUT_MD = os.path.join(DOCS, 'cot-truyen-aether.md')

LOGLINE = ('Lior sống kiếp thứ hai với đôi mắt thấy sợi Aether. Thắng Quỷ vương ở tuổi 16 chỉ là mở màn: bảy rồng giữ bảy Mối của một giao ước '
           'ba trăm năm đang hút cạn những vùng đất rìa, trong đó có quê nhà. Đi qua mười vùng, Lior đánh mất người thầy, suýt mất mẹ, phải '
           'đối kiếm với người bạn thân nhất, và cuối cùng đứng trước Ma vương: một người cũng đến từ thế giới khác, người đã thề sẽ không bao '
           'giờ để thứ gì "để sau".')

THEME = [
    ('Câu hỏi của cả truyện', 'Khi mọi mối nối đều có giá, ta có quyền buộc người khác vào một lời hứa nhân danh điều tốt không?'),
    ('Chủ đề cá nhân', '"Để sau" → "đi ngay". Kiếp trước Minh để mọi thứ đến muộn. Kiếp này Lior học tiếp nửa sau của bài học: có mặt không có nghĩa là quyết định thay người khác.'),
    ('Tấm gương đối lập', 'Ma vương Ostrin cũng từ thế giới khác tới, cũng thề "không chờ ai". Ông làm mọi thứ một mình, không hỏi ai, và thành quái vật. Lior là phiên bản biết hỏi.'),
    ('Luật kể', 'Không phe nào hoàn toàn đúng. Mỗi lựa chọn cứu một điều và làm khó một điều khác. Bí ẩn giải bằng chứng cứ, không có giọng nói thần linh nào chỉ đường.'),
]

# (tên, vai, điều họ giấu / vết nứt, số phận theo truyện)
CAST = [
    ('Lior Ashvale', 'Người chơi · 16 tuổi trở lên', 'Mang ký ức của Minh, lập trình viên chết trong đêm mưa. Thấy sợi Aether từ lúc chào đời. Trên tay hằn dấu nút sau trận Quỷ vương.', 'Tuỳ người chơi'),
    ('Garrick Ashvale', 'Cha · thợ săn', 'Hai mươi năm trước là trinh sát dẫn đường cho Đoàn Ấn Ký đắp đập trong Đầm lầy Mù Sương. Con đập nhấn chìm làng Lau Xám cũ. Dấu khắc con hươu của ông vẫn còn trên cột mốc.', 'Thú nhận ở chương 2 hoặc bị lộ ở chương 6'),
    ('Elin Ashvale', 'Mẹ · người nuôi ong', 'Không có phép. Bà ngoại của bà nằm trong danh sách "người hiến sức" của Giao Ước. Đổ bệnh ở chương 5 khi sợi đỏ len vào tổ ong.', 'Sống. Bức thư của mẹ là cảnh cuối'),
    ('Aldric', 'Bạn thân · hiệp sĩ', 'Muốn đủ mạnh để không ai phải bị hiến tế. Theo Đoàn Ấn Ký ngay cuối chương 1, leo lên thành hiệp sĩ, bị chính Đoàn bỏ rơi, rồi tự ghép sợi hư không vào người.', 'Thành Hiệp sĩ hư không ở chương 10: cứu được hoặc chết trong tay Lior'),
    ('Mirelle', 'Nữ trị liệu', 'Em trai bà, Caelum, thấy sợi Aether như Lior và được Học viện đưa đi năm 12 tuổi. Vết sẹo bỏng trên tay bà là do cậu. Vì thế bà dạy "thả ra mà không làm ai bỏng mới khó".', 'Chọn chữa hay buông em trai ở chương 9'),
    ('Bram', 'Thương nhân · người thầy', 'Cựu cận vệ thành Sahrin, đào ngũ đêm mẹ bị xử vì chống bán mạch nước. Cha ông là thuyền trưởng Corvin buôn lậu đá ấn. Đồng xu hình nút là của mẹ ông.', 'Chết ở chương 7, giữ con tàu đắm cho Lior thoát'),
    ('Nyra', 'Đồng hành mới · thầy thuốc độc dược', 'Con gái Phù thuỷ đầm. Cha cô chết đuối khi con đập vỡ làng. Lanh lợi, chua ngoa, ghét người Rowanmere. Không biết người dẫn đường đắp đập chính là cha của Lior.', 'Ở lại hay bỏ đi tuỳ việc Lior có nói thật không'),
    ('Valen Hắc Thệ', 'Hiệp sĩ trưởng Đoàn Ấn Ký', 'Trẻ mồ côi từ một vùng bị hút cạn, tin rằng giữ nút bằng mọi giá cứu được nhiều người nhất. Đối thủ có lý nhất của Lior.', 'Bị Ma vương giết ở cuối chương 9'),
    ('Ostrin, Kẻ Buộc Nút', 'Ma vương · trùm cuối', 'Ba trăm năm trước cũng từ thế giới khác tới. Lập Giao Ước Bảy Mối, rồi tự buộc mình làm nút trung tâm. Ba thế kỷ hút sức vùng rìa biến ông thành Ma vương. Ông muốn Lior thay mình.', 'Chương 10'),
    ('Bảy rồng nguyên tố', 'Người giữ bảy Mối', 'Mỗi rồng giữ một Mối của Giao Ước; Long Châu là phần "đồng ý" của một vùng. Rồng không trao quyền, chỉ hỏi Lior một câu.', 'Gom đủ 7 Long Châu → Thần Long thức dậy'),
]

# Mỗi chương = một vùng. maps: (tên map — trùng the-gioi-aether.py, chuyện xảy ra ở đó). bosses: (boss, chuyện của boss).
CHAPTERS = [
    dict(n=1, region='Thung lũng Thistlewood', title='Hai nửa nút thắt', mood='Ấm áp → chia ly',
         core='Phần tuổi thơ và trận Quỷ vương đã chơi được. Chương 1 khép vùng: bí mật đầu tiên của Đoàn Ấn Ký nằm ngay dưới chân thị trấn, và người bạn thân nhất ra đi trong đêm.',
         maps=[
             ('Thistlewood', 'Sau trận Quỷ vương: cha chờ ở đầu cầu với chiếc đèn, mẹ giữ phần ăn nóng. Sáng hôm sau sông Brightwater đổi dòng, một thùng ong của mẹ mất đàn. Bram nhìn dấu nút trên tay Lior rồi tái mặt.'),
             ('Rừng Mossvale', 'Nấm rừng mọc thành vòng quanh những sợi đỏ còn sót. Lior lần theo và thấy chúng không chạy về tảng đá phong ấn mà chạy xa hơn, về phía đông nam, ra khỏi bản đồ.'),
             ('Nghĩa địa Hoàng Hôn', 'Hầm mộ mở ra sau trận động đất. Bia đá cổ khắc huy hiệu bảy vòng tròn nối nhau: huy hiệu của Đoàn Ấn Ký.'),
             ('Đồi Xương Trắng', 'Cung thủ xương mặc giáp có cùng huy hiệu. Cả một đội hiệp sĩ đã chết ở đây ba trăm năm trước, mặt quay về phía thị trấn như đang canh giữ.'),
             ('Vách Gargoyle', 'Gargoyle đá thức dậy cùng lúc khi dấu nút trên tay Lior nóng lên. Chúng không đuổi theo Lior mà bay về hướng hang.'),
             ('Hang Gargoyle', 'Map mới. Sâu trong hang là một gian đá ghi tên "những người hiến sức" cho Giao Ước. Trong danh sách có tên bà ngoại của mẹ. Lior chép lại và giấu đi, chưa dám kể với ai.'),
             ('Đá Phong Ấn', 'Tảng đá đã nguội. Đứng đây nhìn xuống, thị trấn bé như lòng bàn tay. Aldric hỏi: "Cậu có định đi không?" Lior chưa trả lời.'),
         ],
         bosses=[
             ('Vua Lich', 'Hiệp sĩ của Đoàn được chôn cùng lời thề. Trước khi tan, hắn nói: "Đoàn sẽ đến lấy lại nút." Câu nói thành sự thật ngay cuối chương.'),
             ('Gargoyle Đá', 'Tượng canh do Đoàn đặt từ ba trăm năm trước để canh gian đá ghi tên. Hạ nó thì danh sách mở ra.'),
             ('Quỷ vương rừng sâu', 'Đã chơi được. Sự thật chỉ lộ ở chương 10: nó từng là sinh vật canh giữ vết rạn, hoá điên khi Mối bị hút cạn.'),
         ],
         choice=('Bến sông (theo story-arc.md)', [
             ('Buộc nút tạm thời', 'Giếng và bờ sông ổn định ngay', 'Người tham gia kiệt sức, mùa ong năm đó giảm nửa'),
             ('Mở đường vòng', 'Không bắt ai làm nguồn sức', 'Nhà kho và cầu nhỏ bị ngập, Bram ở lại thêm ba tuần'),
         ]),
         ending='Valen Hắc Thệ cùng mười hiệp sĩ vào thị trấn đòi "thu hồi" đồng xu. Lior không giao. Valen mỉm cười bỏ đi. Đêm đó Aldric đi theo đoàn kỵ sĩ, để lại thanh Kiếm Sấm Sét bằng gỗ trước cửa nhà Lior. Không có thư.'),
    dict(n=2, region='Đầm lầy Mù Sương', title='Những người chết đuối dưới đập', mood='Nghi ngờ · bí mật của cha',
         core='Lior lần theo sợi đỏ vào đầm lầy và gặp Nyra, cô gái ghét người Rowanmere. Garrick lặng lẽ đi theo con. Càng vào sâu, Lior càng nhận ra những dấu khắc con hươu quen thuộc trên các cột mốc của con đập.',
         maps=[
             ('Làng nhà sàn Lau Xám', 'Dân làng nhìn người Rowanmere như nhìn rắn. Nyra chữa vết rắn cắn cho Lior bằng thứ thuốc "đắng như sự thật". Garrick tới vào buổi chiều, nói là đi săn ngang qua. Trưởng làng Ysolde nhìn ông rất lâu.'),
             ('Bãi Lau Sậy', 'Ếch độc tràn lên vì nước dâng mỗi năm một cao. Giữa lau có một cột mốc gỗ khắc con hươu, giống hệt dấu cha khắc trên khung cửa nhà. Garrick nói "dấu thợ săn ai cũng khắc vậy". Ông nói dối.'),
             ('Kênh Đỉa', 'Con kênh do Đoàn đào để dẫn nước về Mối. Đỉa đầm bám kín cửa cống. Mẹ Ếch đẻ trứng trong cống: muốn mở cống phải đánh nó, hoặc dời từng ổ trứng ra đầm (lâu hơn, Nyra nhìn Lior khác đi).'),
             ('Rừng Ngập Nấm', 'Nấm phát quang mọc trên mái những ngôi nhà chìm của làng cũ. Nyra dẫn Lior tới một mái nhà: mộ của cha cô. Cô kể đêm vỡ đập lúc cô bốn tuổi. Garrick đứng phía sau, không nói gì, tay siết cán dao.'),
             ('Đầm Rắn Nước', 'Rắn nước tụ quanh xác thuyền của đội đắp đập. Trong hòm có nhật ký đội trưởng: "Trinh sát G. dẫn lối an toàn qua đầm. Làng phía dưới đã được báo." Làng chưa từng được báo.'),
             ('Vực Sương Xanh', 'Phù thuỷ đầm Odessa, mẹ của Nyra, dùng sương giữ quái khỏi làng, nhưng cũng nuôi Hydra để một ngày trả thù Rowanmere. Thấy Garrick, bà gọi thẳng: "Kẻ khắc hươu." Garrick muốn quỳ xuống nhận tội trước mặt Nyra.'),
             ('Hồ Hydra', 'Hydra bùn lớn lên từ xác làng cũ dưới đáy hồ và từ hai mươi năm oán hận. Mỗi đầu bị chém mọc lại cho tới khi Lior thấy sợi nối nó với cửa cống.'),
         ],
         bosses=[
             ('Mẹ Ếch', 'Chỉ bảo vệ trứng. Đánh thì nhanh; dời trứng thì Nyra bắt đầu tin Lior.'),
             ('Phù thuỷ đầm', 'Odessa không phải kẻ ác. Bà là người mẹ mất chồng, giữ làng bằng sương và nuôi hận bằng Hydra. Thua trận, bà xin Lior một điều: "Đừng để con bé đi theo người Rowanmere."'),
             ('Hydra bùn', 'Boss chúa. Hạ nó thì hồ rút, mái nhà làng cũ lộ ra giữa bùn.'),
         ],
         choice=('Để cha thú nhận bây giờ hay "để sau"?', [
             ('Để Garrick nói ngay', 'Sự thật ra trước khi Nyra gắn bó. Nyra tin Lior vì Lior không giấu', 'Nyra ghét Garrick. Làng Lau Xám đuổi ông khỏi đầm. Cha con im lặng suốt đường về'),
             ('Ngăn cha lại, để sau', 'Nyra theo Lior vui vẻ, cha giữ được thể diện', 'Bom hẹn giờ: Nyra sẽ tự phát hiện ở chương 6 và bỏ đi trong đêm'),
         ]),
         choice2=('Con đập', [
             ('Phá đập', 'Đầm rút, làng cũ được chôn cất tử tế', 'Sông Brightwater ở quê cạn một mùa, ong của mẹ thiếu nước'),
             ('Giữ đập, mở cống từng phần', 'Hai bên đều còn nước', 'Cần người canh cống mãi mãi. Garrick tự nhận ở lại để chuộc lỗi, gia đình xa nhau'),
         ]),
         ending='Nyra khoác túi thuốc theo Lior lên đường. Một con chim ưng của Đoàn thả xuống mảnh giấy có ấn đỏ: "Hiệp sĩ Aldric được phong tước. Lần sau gặp, chúng ta sẽ bàn về đồng xu."'),
    dict(n=3, region='Sa mạc Hồng Cát', title='Nước của nữ hoàng', mood='Chính trị · anh em',
         core='Thành ốc đảo Sahrin đang bán mạch nước ngầm cho Đoàn Ấn Ký. Bram bị lính nhận mặt là kẻ đào ngũ và bị bắt giam ngay ngày đầu. Muốn cứu thầy, Lior phải chọn đứng về phía nữ hoàng hay phía em gái của Bram, thủ lĩnh phe nổi dậy.',
         maps=[
             ('Thành ốc đảo Sahrin', 'Nữ hoàng Amira mở tiệc đón "những người đã giết Quỷ vương". Giữa tiệc, lính hoàng gia còng tay Bram: mười lăm năm trước ông bỏ trốn đúng đêm mẹ ông bị xử vì chống bán nước. Tể tướng Hassim, người của Đoàn, mỉm cười.'),
             ('Cồn Cát Đỏ', 'Đi hộ tống đoàn buôn nước của triều đình thì bị cướp. Kẻ cướp chia nước cho dân nghèo ngoài thành. Thủ lĩnh là một phụ nữ đeo mặt nạ: Zahra.'),
             ('Hẻm Rắn', 'Hang ổ phe nổi dậy. Zahra tháo mặt nạ: cô là em gái Bram. "Anh ấy về muộn mười lăm năm." Bọ cạp chúa là thú cưỡi cũ của hoàng gia, bị bỏ đói khi triều đình bán nước.'),
             ('Lăng Mộ Cát', 'Lăng các vua đã ký Giao Ước. Tường khắc lời hứa: Sahrin được một ghế trong hội đồng Bảy Mối. Tên Sahrin đã bị đục khỏi đá.'),
             ('Vách Kền Kền', 'Kền kền ăn xác một đội lính của nữ hoàng. Thư trong túi đội trưởng chứng minh Tể tướng Hassim cố tình đưa họ vào chỗ chết để mở đường hút nước. Ông phản bội cả nữ hoàng.'),
             ('Phế tích Đá Đỏ', 'Linh hồn cát canh bản Giao Ước gốc. Pharaoh xác ướp là vị vua Sahrin đầu tiên ký vào đó, bị trói hồn ba trăm năm để giữ bản gốc.'),
             ('Hố Cát Nuốt', 'Hassim mở cống ngầm hút cạn ốc đảo. Sâu cát khổng lồ trồi lên, cả thành rung chuyển. Bram bị treo làm mồi trên miệng hố.'),
         ],
         bosses=[
             ('Bọ cạp chúa', 'Thú cưỡi hoàng gia bị bỏ đói. Zahra xin Lior đừng giết nó nếu có thể.'),
             ('Pharaoh xác ướp', 'Vị vua đã ký. Hạ ông thì hồn ông được thả, ông trao bản gốc và nói: "Chúng ta đã tin họ."'),
             ('Sâu cát khổng lồ', 'Boss chúa. Đánh trên nền cát lún trong lúc Bram treo trên đầu.'),
         ],
         choice=('Trao bản Giao Ước gốc cho ai?', [
             ('Nữ hoàng Amira', 'Bà xử Hassim, công bố sự thật từ từ, thành giữ được trật tự', 'Zahra coi Lior là kẻ phản bội. Phe nổi dậy tan. Bram mất em lần nữa'),
             ('Zahra', 'Sự thật lan khắp sa mạc trong một đêm, dân có tiếng nói', 'Nội chiến. Amira thoái vị, Sahrin hỗn loạn suốt chương sau'),
         ]),
         ending='Bram và Zahra đứng hai đầu sân thành. Ông xin lỗi. Cô không tha thứ, nhưng ném cho ông chiếc khăn của mẹ. Hassim trốn lên cao nguyên mang theo cỗ máy hút nước và một hòm đá ấn.'),
    dict(n=4, region='Cao nguyên Gió Hú', title='Bạn cũ, cờ mới', mood='Tình bạn · đối kiếm', dragon='Phong Long Tuyệt Vân',
         core='Cối xay gió ngừng quay vì Đoàn dựng tháp thu gió. Người chỉ huy đồn là Aldric. Hai người bạn đánh chung một trận, ngồi chung một đống lửa, rồi rút kiếm với nhau trước mặt con rồng đầu tiên.',
         maps=[
             ('Làng Cối Xay Gió', 'Gặp lại Aldric trong bộ giáp có huy hiệu bảy vòng. Cậu ôm chầm Lior, rồi khựng lại khi thấy Nyra: "Phù thuỷ đầm?" Dân làng không dám mở miệng trước mặt hiệp sĩ.'),
             ('Đồi Cỏ Cao', 'Sói gió hoá điên vì gió bị hút. Aldric và Lior đánh lưng tựa lưng như hồi tám tuổi. Đêm đó bên đống lửa, Aldric nhắc lại lời ngoéo tay: "Tớ vẫn đang đi đánh Quỷ vương thật đây."'),
             ('Vách Chim Ưng', 'Đại bàng bão làm tổ trên tháp thu gió. Aldric nhận lệnh giết nó. Lior thấy trong tổ có ba quả trứng.'),
             ('Thung Lũng Tiên', 'Tiên gió mất nhà vì gió cạn. Một tiên già kể về Tuyệt Vân, con rồng giữ Mối Phong, và về người đàn ông "từ ngoài trời" đã buộc Mối ba trăm năm trước.'),
             ('Bãi Đá Bay', 'Đá bay rơi xuống vì gió yếu, đè sập nửa làng. Lior bắt gặp Hassim lắp cỗ máy Sahrin vào chân tháp, Aldric ký lệnh nghiệm thu.'),
             ('Đường Lên Đền Mây', 'Pháp sư gió Orrin từng dựng chính những ngọn tháp này cho Đoàn, nay hối hận và muốn phá chúng. Aldric được lệnh bắt ông. Orrin đứng chắn đường lên đền.'),
             ('Đền Trên Mây', 'Rồng gió, con của Tuyệt Vân, điên lên vì Mối bị hút. Sau trận đánh, Lior vào Long Huyệt gặp chính Tuyệt Vân.'),
         ],
         bosses=[
             ('Đại bàng bão', 'Chỉ bảo vệ tổ. Hạ nó thì Aldric hoàn thành lệnh; xua nó đi thì Aldric bị ghi lỗi.'),
             ('Pháp sư gió', 'Orrin không muốn thắng, ông muốn ai đó nghe. Thua trận, ông trao Lior sơ đồ mọi tháp thu gió trên lục địa.'),
             ('Rồng gió', 'Boss chúa: con rồng non điên vì đói gió.'),
             ('Phong Long Tuyệt Vân', 'Rồng thứ nhất. Hỏi: "Ai cho ngươi quyền đồng ý thay cả cao nguyên?" Trao Long Châu đầu tiên. Valen xuất hiện ngay sau đó đòi lấy châu.'),
         ],
         choice=('Long Châu Phong', [
             ('Giao cho Valen', 'Aldric được thăng chức, Đoàn tạm thời để Lior yên', 'Mối Phong bị hút tiếp, tháp vẫn đứng, làng cối xay dời đi'),
             ('Giữ châu, đấu với Aldric', 'Gió trở lại cao nguyên một phần', 'Aldric thua (hoặc cố tình chém trượt). Valen tước kiếm của cậu trước mặt mọi người. Đoàn truy nã Lior'),
         ]),
         ending='Một bức thư đến chậm ba tuần, nét chữ nguệch ngoạc của cha, lá thư đầu tiên trong đời ông: "Mẹ ốm. Con đừng lo. Cha khắc thêm một vạch."'),
    dict(n=5, region='Lãnh nguyên Băng Giá', title='Bức thư đến muộn', mood='Gia đình · đi hay ở', dragon='Băng Long Hàn Sương',
         core='Mẹ đổ bệnh vì sợi đỏ len vào tổ ong ở quê: Mối Băng đang hút từ vùng rìa. Cột dịch chuyển cho Lior về nhà trong một hơi thở. Nhưng làng Tuyết Phong đang bị bão nhốt và cần người dẫn đường. Chương này hỏi thẳng câu hỏi của kiếp trước.',
         maps=[
             ('Làng gỗ Tuyết Phong', 'Bão băng chặn mọi lối ra. Trưởng làng già đã đi lên hồ ba ngày chưa về. Lior cầm thư của cha, đứng trước cột dịch chuyển rất lâu.'),
             ('Rừng Thông Tuyết', 'Sói tuyết săn theo bầy. Kael, thợ săn mười bốn tuổi, mất cha trong trận bão. Cậu săn y như cách Garrick dạy Lior: đọc gió trước, rồi mới đọc dấu chân.'),
             ('Hồ Băng', 'Nữ hoàng băng là một người mẹ của làng đã tự đóng băng mình để giữ mặt hồ khỏi vỡ. Bà không còn nhận ra con mình. Hạ bà là để bà được tan ra và nghỉ.'),
             ('Đèo Người Tuyết', 'Yeti chặn đèo vì đàn con ở phía sau. Nyra và Lior cãi nhau lần đầu: "Cậu lúc nào cũng muốn cứu hết. Có ai cứu được hết đâu."'),
             ('Bờ Biển Băng', 'Chim cánh cụt chiến giữ bãi. Một con tàu băng của Đoàn chở Long Châu bị kẹt. Bram đọc tên khắc trên thân tàu và bỗng im bặt: "Hải Âu Bạc", tàu của cha ông.'),
             ('Hang Gấu', 'Gấu băng ngủ đông trên một mạch Aether. Trong hang có câu đố của Hàn Sương khắc trên vách: muốn vào Long Huyệt phải nói ra một điều mình đang cố quên.'),
             ('Ngai Băng', 'Băng long giữ cửa Long Huyệt. Vào trong là Hàn Sương, con rồng giữ băng để quên.'),
         ],
         bosses=[
             ('Nữ hoàng băng', 'Người mẹ đóng băng chính mình. Cảnh bà tan ra là đối chiếu trực tiếp với mẹ của Lior.'),
             ('Yeti', 'Bảo vệ đàn con. Có thể đánh, hoặc dẫn đàn qua đèo trước rồi mới đi.'),
             ('Băng long', 'Boss chúa canh cửa.'),
             ('Băng Long Hàn Sương', 'Rồng thứ hai. Hỏi: "Ngươi muốn nhớ hay muốn quên?" Lior kể về cuộc gọi chưa bao giờ gọi. Trao Long Châu.'),
         ],
         choice=('Về nhà ngay hay ở lại?', [
             ('Về ngay qua cột dịch chuyển', 'Ngồi cạnh giường mẹ một đêm. Mẹ nắm tay con rồi đẩy đi: "Con về rồi. Giờ đi đi."', 'Không ai dẫn đường, trưởng làng chết trên hồ. Kael không bao giờ nhìn Lior như trước'),
             ('Ở lại đến hết bão', 'Cứu được làng và trưởng làng', 'Mẹ qua khỏi nhưng Lior không có mặt. Cha khắc một vạch mới trên khung cửa, không ghi tên'),
         ]),
         ending='Tin từ phương nam: người lùn Đe Đỏ từ chối rèn vũ khí cho Đoàn. Đoàn tuyên chiến. Người dẫn đội tiên phong là Aldric. Mirelle gửi thư từ trong pháo đài: "Ở đây cần thầy thuốc."'),
    dict(n=6, region='Núi lửa Hoả Sơn', title='Lửa trong lò, lửa trong lòng', mood='Chiến tranh · phản bội', dragon='Hoả Long Viêm Đế',
         core='Pháo đài người lùn bị vây. Trong pháo đài, hai chị em hoàng tộc chia đôi hội đồng. Ngoài pháo đài, Aldric dẫn quân. Trong túi Lior, tấm bản đồ cha vẽ chờ Nyra nhìn thấy.',
         maps=[
             ('Pháo đài Đe Đỏ', 'Nữ vương rèn Hilde muốn đóng cổng giữ trung lập. Em trai bà, Durin, muốn rèn vũ khí cho Đoàn để đổi lấy lửa của Mối Hoả. Mirelle băng bó cho cả lính hai phe.'),
             ('Bãi Đá Đen', 'Thằn lằn lửa chui lên từ khe đá. Lior bắt gặp Durin mở cổng phụ cho Đoàn trong đêm.'),
             ('Sông Dung Nham', 'Golem dung nham cổ do người lùn rèn từ thời Giao Ước để canh Mối. Trên lưng nó khắc tên những người thợ đã hiến sức, có cả tổ tiên của Hilde.'),
             ('Hang Dơi Lửa', 'Nyra tìm thuốc trong túi Lior và thấy tấm bản đồ cha vẽ: dấu con hươu, đường mòn qua đầm cũ. Nếu Lior đã giấu sự thật ở chương 2, đêm đó Nyra bỏ đi, chỉ để lại lọ thuốc giải cuối cùng.'),
             ('Lò Rèn Bỏ Hoang', 'Tinh linh lửa giữ một lò rèn bỏ hoang. Trên đe còn nằm một thanh kiếm sấm sét thật, đúng hình thanh kiếm gỗ Aldric khắc hồi bé. Lior có thể mang nó theo.'),
             ('Miệng Núi', 'Đội tiên phong của Aldric bị dung nham vây. Valen ra lệnh rút, để họ làm mồi. Lior có thể quay lại cứu họ. Aldric chiến đấu cạnh Lior và lần đầu nghe tận tai lệnh bỏ rơi.'),
             ('Lõi Núi Lửa', 'Hoả thần là linh hồn lò rèn đầu tiên của người lùn, hoá điên vì Mối bị hút. Sau trận, Lior vào Long Huyệt gặp Viêm Đế.'),
         ],
         bosses=[
             ('Golem dung nham cổ', 'Người canh do chính người lùn làm ra. Hilde xin giữ lại lõi của nó.'),
             ('Salamander', 'Chặn đường tới đội của Aldric. Đánh nhanh thì cứu kịp cả đội.'),
             ('Hoả thần', 'Boss chúa: thần lửa của lò rèn đầu tiên.'),
             ('Hoả Long Viêm Đế', 'Rồng thứ ba. Hỏi: "Lửa có hỏi ai được ấm không?" Trao Long Châu. Mirelle kể về em trai Caelum và cho Lior xem vết sẹo bỏng.'),
         ],
         choice=('Đứng về phía ai trong hội đồng?', [
             ('Hilde · trung lập', 'Pháo đài giữ được nghề rèn, không thành xưởng vũ khí', 'Đóng cổng bỏ dân tị nạn bên ngoài. Durin bị tống giam, người lùn chia rẽ'),
             ('Durin · rèn cho Đoàn', 'Pháo đài không bị phá, dân tị nạn được vào', 'Vũ khí Đe Đỏ đổ về chiến trường. Hilde thoái vị'),
         ]),
         ending='Bram nhận một mẩu giấy từ thuỷ thủ qua đường: "Hải Âu Bạc đã chìm ở San Hô. Người ta vẫn thấy đèn trên boong mỗi đêm."'),
    dict(n=7, region='Quần đảo San Hô', title='Con tàu của cha', mood='Mất mát · tha thứ', dragon='Thuỷ Long Thương Hải',
         core='Bram kể hết sự thật. Cha ông buôn lậu đá ấn cho cả Đoàn lẫn phe nổi dậy, và đã bán vị trí làng người cá. Trên con tàu ma, hai cha con gặp nhau lần cuối. Bram không trở về.',
         maps=[
             ('Cảng chài San Hô', 'Bên bếp lửa làng chài, Bram kể lần đầu không giấu điều gì: cha ông là thuyền trưởng Corvin, còn đồng xu là của mẹ, người đã giữ hình dạng thật của mối nối.'),
             ('Bãi Cát Trắng', 'Cua chiếm bãi. Trẻ con làng chài nhặt đá ấn vỡ trôi dạt vào bờ để bán cho thương lái. Một đứa nhặt được mảnh có khắc tên Corvin.'),
             ('Rạn San Hô', 'Sứa phát sáng quanh một mảnh Mối Thuỷ vỡ. Cua chúa ôm mảnh đó như ôm con.'),
             ('Đảo Cướp Biển', 'Cướp biển là thuỷ thủ cũ của Corvin. Họ kể chuyến hàng cuối: Corvin bán vị trí làng người cá cho Đoàn đổi lấy tự do cho cả thuyền.'),
             ('Đầm Người Cá', 'Người cá căm hận đất liền. Công chúa Maris giữ một tù binh là thuỷ thủ của Hải Âu Bạc, sống sót nhờ ăn tảo suốt mười năm.'),
             ('Bãi Tàu Đắm', 'Đèn trên boong Hải Âu Bạc vẫn sáng. Thuyền trưởng ma Corvin đứng ở mũi tàu chờ con trai. Ông xin tha thứ. Bram không đáp.'),
             ('Vực Kraken', 'Kraken kéo xác tàu xuống vực. Bram ở lại giữ thân tàu cho Lior và Nyra kịp thoát.'),
         ],
         bosses=[
             ('Cua chúa', 'Ôm mảnh Mối như ôm con. Hạ nó lấy mảnh, hoặc để mảnh lại cho rạn san hô.'),
             ('Thuyền trưởng ma', 'Corvin không đánh để thắng. Mỗi đòn đánh là một câu xin lỗi. Thua trận, ông tan ra khi Bram cuối cùng nói: "Con nghe rồi."'),
             ('Kraken', 'Boss chúa. Trận đánh dưới con tàu đang chìm.'),
             ('Thuỷ Long Thương Hải', 'Rồng thứ tư. Nói: "Biển nhận mọi thứ chảy vào, kể cả người thương." Trao Long Châu.'),
         ],
         choice=('Các mảnh đá ấn nhặt được', [
             ('Trả cho người cá', 'Maris đưa tộc người cá trở lại hội đồng các vùng, có tiếng nói', 'Không đủ đá đóng tàu nhanh. Đến Rừng Nấm muộn, đội của Aldric mất thêm ba người'),
             ('Đóng tàu tốc hành', 'Kịp cứu đội của Aldric', 'Người cá đóng cửa với đất liền. Liên quân ở chương 10 thiếu một tộc'),
         ]),
         ending='Lời cuối của Bram: "Đồng xu là của mẹ ta. Giờ là của cháu. Đừng đưa nó cho vua nào cả." Tin dữ nối tiếp: Aldric bị Vua người nấm bắt làm con tin. Valen không đến cứu.'),
    dict(n=8, region='Rừng Nấm Ngầm', title='Dưới đất không có cờ', mood='Giải cứu · thật lòng', dragon='Địa Long Thạch Cốt',
         core='Đi cứu Aldric dưới lòng đất. Lần đầu tiên từ chương 1, hai người bạn nói thật với nhau. Lior biết Aldric muốn gì. Không ai biết đó là mầm của bi kịch.',
         maps=[
             ('Làng người nấm Ánh Tím', 'Tộc người nấm chỉ tin người đã giúp họ. Trưởng lão Sporrin bắt Lior làm ba việc trước khi chỉ đường xuống điện.'),
             ('Rừng Nấm Khổng Lồ', 'Người nấm bị nhiễm sợi đỏ, mặt nấm chuyển màu máu. Nyra (nếu còn đi cùng) chế thuốc giải từ chính bào tử của chúng.'),
             ('Hang Nhện', 'Nhện chúa giăng tơ quanh đội của Aldric. Đội bị Đoàn bỏ lại, chỉ còn bốn người. Aldric bị thương ở chân vẫn đứng chắn trước lính của mình.'),
             ('Mạch Tinh Thể', 'Đoàn khai thác tinh thể Aether, hút cạn cả rừng. Aldric đọc được lệnh của Valen: "Đội này là mồi. Không cần đón."'),
             ('Hang Bọ Đèn', 'Dưới ánh bọ đèn, Aldric nói câu thật nhất của cậu: "Tớ muốn đủ mạnh để không ai phải bị hiến nữa. Kể cả nếu phải tự hiến mình." Lior không biết trả lời sao.'),
             ('Điện Nấm', 'Vua người nấm Muscar đã mặc cả với Đoàn: bán tinh thể đổi lấy việc làng không bị càn. Ông giữ Aldric để đổi. Ông không phải kẻ ác, ông chỉ sợ.'),
             ('Lòng Đất Sâu', 'Rồng đất cuộn mình quanh Mối Thổ. Sau trận, Thạch Cốt nói ra cái tên mà cả lục địa đã quên: Ostrin.'),
         ],
         bosses=[
             ('Nhện chúa', 'Giải cứu đội Aldric giữa lưới tơ.'),
             ('Vua người nấm', 'Thua trận, Muscar thả Aldric và xin Lior đừng kể cho Đoàn biết làng ở đâu.'),
             ('Rồng đất', 'Boss chúa: trồi lên dưới chân, giáp đá phải phá.'),
             ('Địa Long Thạch Cốt', 'Rồng thứ năm. Nói: "Đất nhớ mọi bước chân." Trao Long Châu và cái tên Ostrin, Kẻ Buộc Nút.'),
         ],
         choice=('Aldric muốn quay về Đoàn "để sửa nó từ bên trong"', [
             ('Để cậu đi, tin cậu', 'Tình bạn giữ nguyên. Aldric ôm Lior trước khi đi', 'Cậu đi một mình vào nơi đã bỏ rơi cậu'),
             ('Giữ cậu lại bằng mọi giá', 'Lior đã cố', 'Cậu vẫn đi lúc nửa đêm, và nhớ rằng Lior không tin cậu'),
         ]),
         ending='Mirelle biến mất khỏi trạm. Bà để lại vòng tay trị liệu và một dòng: "Ta đi tìm Caelum. Lần này ta không để sau."'),
    dict(n=9, region='Phế tích Aether', title='Hai chị em, một vết bỏng', mood='Sự thật · gương soi', dragon='Quang Long Thiên Huy',
         core='Thành cổ của các pháp sư giữ cuốn nhật ký của Ostrin. Lior đọc và thấy chính mình trong đó. Mirelle tìm thấy em trai, nhưng em trai bà đã định làm nút thay Ostrin.',
         maps=[
             ('Toà thành Aether cổ', 'Ba phe tranh di sản: Học giả Thư viện muốn công bố mọi thứ, Đoàn muốn khoá lại, Hội Thợ Máy muốn bán. Người giữ cổng hỏi Lior: "Ngươi theo phe nào?"'),
             ('Phố Đổ Nát', 'Hiệp sĩ ma của Đoàn đầu tiên đánh lại trận chiến ba trăm năm trước, mỗi đêm một lần, không bao giờ thắng.'),
             ('Xưởng Máy Cổ', 'Vệ binh máy canh một bảng đo sức hút của từng vùng. Dòng Thistlewood ghi "còn 3%". Đó là lý do ong của mẹ chết.'),
             ('Thư Viện Bay', 'Sách bay quanh trang bị xé của Học viện: nhật ký Ostrin. "Tôi đến từ một nơi khác. Ở đó tôi đã để mọi thứ đến muộn. Ở đây tôi sẽ không chờ ai." Lior phải ngồi xuống.'),
             ('Tháp Pháp Sư', 'Pháp sư mất trí là học trò của Caelum. Ở đỉnh tháp, Mirelle nằm bị thương. Bà vẫn đi tiếp.'),
             ('Xưởng Rối', 'Rối gỗ ma thuật diễn lại cảnh lập Giao Ước. Hiệp sĩ đầu lâu là chỉ huy đầu tiên của Đoàn, bị Ostrin kết tội vì dám nói không. Hắn kể Valen cũng là trẻ mồ côi của một vùng bị hút cạn.'),
             ('Điện Aether', 'Caelum, Đại pháp sư sa đoạ, muốn thay Ostrin làm nút để cứu Thistlewood, quê của chị mình. Cái giá là trở thành một Ostrin khác.'),
         ],
         bosses=[
             ('Cỗ máy canh giữ', 'Cỗ máy đo sức hút do Ostrin chế. Phá nó thì bảng số tắt, nhưng ai cũng đã kịp đọc.'),
             ('Hiệp sĩ đầu lâu', 'Người đầu tiên nói không với Ostrin. Hạ hắn để hắn được nghỉ.'),
             ('Đại pháp sư sa đoạ', 'Boss chúa: Caelum. Mirelle đứng giữa trận đánh.'),
             ('Quang Long Thiên Huy', 'Rồng thứ sáu. Nói: "Ánh sáng cho ngươi thấy. Nó không cho ngươi quyền." Trao Long Châu.'),
         ],
         choice=('Mirelle và Caelum (Lior chỉ được khuyên, Mirelle quyết)', [
             ('Khuyên bà chữa cho em', 'Caelum sống, mất hẳn khả năng thấy sợi, về Thistlewood cùng chị', 'Mirelle cạn sức trị liệu suốt chương 10'),
             ('Khuyên bà buông em đi', 'Mirelle giữ được sức cho trận cuối', 'Caelum chết thanh thản. Mirelle không bao giờ chữa bằng phép nữa, chỉ bằng thuốc'),
         ]),
         ending='Valen về báo thất bại và bị Ma vương giết ngay trên bậc ngai. Aldric nhặt thanh kiếm của Valen lên: "Nếu không ai đủ mạnh, tớ sẽ là người đó." Cậu bước vào Vực Hư Không trước Lior một ngày.'),
    dict(n=10, region='Vực Hư Không', title='Người buộc nút', mood='Đỉnh điểm · lựa chọn cuối', dragon='Hắc Long Vô Tận',
         core='Mọi lựa chọn từ chương 1 dồn về đây: ai có mặt trong liên quân, Nyra còn bên cạnh không, Aldric còn cứu được không. Ở cuối vực, Ostrin mời Lior làm người kế vị.',
         maps=[
             ('Thành trì Hư Không', 'Liên quân tụ về theo lựa chọn của Lior: Zahra hoặc Amira, Hilde hoặc Durin, người cá của Maris, người nấm của Muscar, làng Lau Xám. Garrick có mặt, mang theo cây cung cũ. "Con gọi, cha đến."'),
             ('Đảo Trôi Tím', 'Quỷ hư không nhảy giữa những hòn đảo trôi. Mỗi đảo là một mảnh đất bị hút cạn: một góc đầm Lau Xám, một bức tường Sahrin, một mái nhà quen ở Thistlewood.'),
             ('Khe Nứt', 'Mắt bay canh khe nứt. Ở đáy khe, Hiệp sĩ hư không chờ Lior. Dưới lớp giáp đen là Aldric.'),
             ('Rừng Bóng', 'Bóng người dựng lại ký ức của Minh: văn phòng ca đêm, tiếng mưa, chiếc điện thoại chưa bao giờ bấm gọi. Không ai nói gì, chỉ có ký ức.'),
             ('Nghĩa Trang Hư Không', 'Ác linh là tên những người đã bị hút sức suốt ba trăm năm. Lior đọc thấy tên bà ngoại của mẹ, và tên Bram vừa được khắc thêm.'),
             ('Hang Ma Sói', 'Mẹ quỷ, bạn đời của Quỷ vương rừng sâu, đòi nợ máu. Bà kể sự thật: Quỷ vương từng là người canh vết rạn ở Mossvale.'),
             ('Ngai Ma Vương', 'Ostrin ngồi giữa bảy sợi chỉ khổng lồ. Ông nói giọng của một người rất mệt: "Cậu sẽ không bao giờ phải để sau nữa. Cậu sẽ có mặt ở mọi nơi, mãi mãi."'),
         ],
         bosses=[
             ('Hiệp sĩ hư không', 'Aldric. Nếu đủ gắn bó (chương 1 tôn trọng việc cậu đi, chương 4 không ép cậu thua, chương 6 cứu đội cậu, chương 8 tin cậu) và Lior mang theo thanh kiếm gỗ hoặc kiếm sấm sét: cậu tỉnh lại ở đòn cuối. Nếu không: cậu chết trong tay Lior, đọc nốt lời ngoéo tay năm tám tuổi.'),
             ('Mẹ quỷ', 'Tha thì bà về canh vết rạn ở Mossvale. Giết thì vết rạn không ai canh.'),
             ('Ma vương', 'Boss chúa, trùm cuối: Ostrin, Kẻ Buộc Nút.'),
             ('Hắc Long Vô Tận', 'Rồng thứ bảy. Nói: "Vô tận là khi không ai được rút lui." Đủ bảy Long Châu, Thần Long, hình hài sống của Giao Ước, thức dậy.'),
         ],
         choice=('Lựa chọn cuối trước Thần Long', [
             ('Tháo nút thành nhiều giao ước nhỏ', 'Mỗi vùng giữ Long Châu của mình, có quyền rút lui và xem lại. Kết thúc chính', 'Chậm, có nơi thất bại, có mùa đói. Không ai được hứa an toàn'),
             ('Tự buộc mình làm nút', 'Thế giới an toàn ngay lập tức', 'Lior thành người kế vị Ostrin. Vạch khắc trên khung cửa nhà dừng lại mãi mãi'),
             ('Để Ostrin giữ tiếp', 'Không đổi gì, không ai chết thêm hôm nay', 'Vùng rìa tiếp tục bị hút. Thistlewood "còn 3%" giảm về 0'),
         ]),
         ending='Phần kết: Lior nhận một lá thư của mẹ. Không có phép, chỉ có giấy và mùi sáp ong. Người chơi đọc ngay hoặc cất đi để đọc ở nơi an toàn; truyện không chấm điểm lựa chọn ấy. Trên khung cửa nhà có một vạch khắc mới. Bài hát viết dở từ kiếp trước được thổi trọn trên cây sáo sậy.'),
]

# Những cú lật chính (chương lộ ra).
TWISTS = [
    (1, 'Thistlewood nằm trong danh sách "người hiến sức" của Giao Ước: bà ngoại của mẹ cũng có tên.'),
    (2, 'Garrick từng dẫn đường cho Đoàn đắp con đập nhấn chìm làng của Nyra.'),
    (3, 'Bram là kẻ đào ngũ của Sahrin. Thủ lĩnh phe nổi dậy là em gái ông.'),
    (4, 'Aldric là hiệp sĩ của Đoàn. Hai người bạn rút kiếm với nhau.'),
    (6, 'Mirelle có một em trai thấy sợi Aether. Vết sẹo trên tay bà là do cậu.'),
    (7, 'Bram chết. Cha ông là thuyền trưởng buôn lậu đá ấn.'),
    (8, 'Đoàn cố tình dùng đội của Aldric làm mồi. Rồng đất nói ra cái tên Ostrin.'),
    (9, 'Ostrin cũng từ thế giới khác tới. Quê nhà chỉ "còn 3%".'),
    (10, 'Hiệp sĩ hư không là Aldric. Quỷ vương từng là người canh vết rạn. Thần Long chính là Giao Ước.'),
]

# Cờ lựa chọn ghi lại để dùng về sau (không có thanh thiện cảm chung — theo story-arc.md).
FLAGS = [
    ('aldric_bond', 'Gắn bó với Aldric', 'C1 tôn trọng việc cậu đi · C4 không ép cậu thua · C6 cứu đội cậu · C8 tin cậu', 'C10: cứu được Aldric ở đòn cuối (cần thêm thanh kiếm gỗ hoặc kiếm sấm sét trong túi)'),
    ('garrick_truth', 'Cha thú nhận ở đầm', 'C2', 'C6: Nyra ở lại hay bỏ đi · C10: làng Lau Xám có vào liên quân không'),
    ('nyra_trust', 'Nyra tin Lior', 'C2 dời trứng Mẹ Ếch · C2 sự thật về cha · C5 cuộc cãi nhau', 'C8 thuốc giải người nấm · C10 Nyra đứng cạnh Lior'),
    ('sahrin_side', 'Bản Giao Ước gốc', 'C3: Amira / Zahra', 'C10: ai dẫn quân Sahrin'),
    ('forge_side', 'Hội đồng Đe Đỏ', 'C6: Hilde / Durin', 'C10: vũ khí liên quân, người lùn có tới không'),
    ('merfolk', 'Đá ấn cho người cá', 'C7', 'C8 đến kịp hay muộn · C10 người cá có tới không'),
    ('went_home', 'Về nhà khi mẹ ốm', 'C5', 'Thoại của mẹ, vạch khắc trên khung cửa, Kael ở Tuyết Phong'),
    ('caelum', 'Số phận Caelum', 'C9', 'C10 sức trị liệu của Mirelle; phần kết ở Thistlewood'),
]

REVIEW = [
    'Thay mạch Chương 2–7 cũ (7 lục địa Varnhold, Lumeria, Nocthar…) bằng 10 vùng của kế hoạch thế giới? Giữ nền: Giao Ước Bảy Mối, đồng xu của Bram, chủ đề "để sau → đi ngay".',
    'Bram chết ở chương 7 — giữ, hay cho ông sống sót (mất một chân, về Thistlewood)?',
    'Aldric thành Hiệp sĩ hư không ở chương 10 (boss khu Khe Nứt) — có hai kết: cứu được / chết. Đồng ý?',
    'Ma vương Ostrin cũng là người từ thế giới khác tới, tấm gương ngược của Lior. Đồng ý, hay để Ma vương là người bản địa?',
    'Nyra: đồng hành, có thể thân thiết hơn tuỳ người chơi, không ép yêu đương. Thêm / bớt đồng hành nào?',
    'Mẹ ốm ở chương 5 nhưng không chết. Muốn nặng hơn (mất thật) hay giữ nhẹ như này?',
    'Bảy rồng là người giữ bảy Mối, Thần Long chính là Giao Ước; điều ước Thần Long trong game (thú cưng, thú cưỡi, skin) đi sau lựa chọn cuối.',
]

# ---------------------------------------------------------------- kiểm tên với kế hoạch thế giới
WORLD = open(os.path.join(TOOLS, 'the-gioi-aether.py'), encoding='utf8').read()
missing = []
for ch in CHAPTERS:
    if f"name='{ch['region']}'" not in WORLD:
        missing.append(f"vùng {ch['region']}")
    for m, _ in ch['maps']:
        if f"('{m}'," not in WORLD:
            missing.append(f"map {m} (vùng {ch['n']})")
    for b, _ in ch['bosses']:
        dragon = re.match(r'(\S+ Long) (.+)$', b)  # rồng: ('Phong Long', 'Tuyệt Vân', …) ở bảng DRAGONS
        if dragon and f"('{dragon[1]}', '{dragon[2]}'," in WORLD:
            continue
        if f"'{b} · " not in WORLD and f"('{b}'," not in WORLD:
            missing.append(f"boss {b} (vùng {ch['n']})")
assert len(CHAPTERS) == 10 and all(len(ch['maps']) == 7 for ch in CHAPTERS), 'mỗi vùng đủ 7 map'
if missing:
    raise SystemExit('Tên lệch với the-gioi-aether.py: ' + '; '.join(missing))


def esc(s):
    return html.escape(str(s), quote=True)


def quote_marks(s):
    """Câu thoại trong ngoặc kép → in nghiêng nhẹ."""
    return re.sub(r'"([^"]+)"', lambda m: f'<q>{m.group(1)}</q>', esc(s).replace('&quot;', '"'))


def choice_table(c):
    title, rows = c
    body = ''.join(f'<tr><th scope="row">{esc(a)}</th><td>{quote_marks(g)}</td><td>{quote_marks(cost)}</td></tr>' for a, g, cost in rows)
    return f'''<div class="choice"><h4>Lựa chọn: {esc(title)}</h4><div class="table-wrap"><table>
      <thead><tr><th>Chọn</th><th>Được</th><th>Mất</th></tr></thead><tbody>{body}</tbody></table></div></div>'''


def chapter_html(ch):
    maps = ''.join(f'<li><b>{esc(m)}</b><p>{quote_marks(t)}</p></li>' for m, t in ch['maps'])
    bosses = ''.join(f'<li><span class="boss">{esc(b)}</span> {quote_marks(t)}</li>' for b, t in ch['bosses'])
    dragon = f'<span class="tag dragon">Rồng: {esc(ch["dragon"])}</span>' if ch.get('dragon') else ''
    choices = choice_table(ch['choice']) + (choice_table(ch['choice2']) if ch.get('choice2') else '')
    return f'''
<section class="chapter" id="chuong-{ch["n"]}">
  <header>
    <span class="eyebrow">Chương {ch["n"]} · Vùng {ch["n"]} · {esc(ch["region"])}</span>
    <h3>{esc(ch["title"])}</h3>
    <div class="tags"><span class="tag">{esc(ch["mood"])}</span>{dragon}</div>
  </header>
  <p class="core">{quote_marks(ch["core"])}</p>
  <div class="split">
    <div>
      <h4>Theo từng map (thứ tự đi)</h4>
      <ol class="maps">{maps}</ol>
    </div>
    <div class="side">
      <h4>Boss và chuyện của boss</h4>
      <ul class="bosses">{bosses}</ul>
      {choices}
    </div>
  </div>
  <div class="ending"><span>Kết chương</span><p>{quote_marks(ch["ending"])}</p></div>
</section>'''


toc = ''.join(f'<a href="#chuong-{c["n"]}"><span class="num">{c["n"]}</span>{esc(c["title"])}</a>' for c in CHAPTERS)
theme_html = ''.join(f'<div><dt>{esc(a)}</dt><dd>{quote_marks(b)}</dd></div>' for a, b in THEME)
cast_html = ''.join(f'<article class="person"><h4>{esc(n)}</h4><span class="role">{esc(r)}</span><p>{quote_marks(s)}</p><p class="fate">{esc(f)}</p></article>' for n, r, s, f in CAST)
twist_html = ''.join(f'<li><a href="#chuong-{n}">Chương {n}</a><span>{quote_marks(t)}</span></li>' for n, t in TWISTS)
flags_html = ''.join(f'<tr><td><code>{esc(k)}</code><div class="role">{esc(n)}</div></td><td>{esc(s)}</td><td>{esc(u)}</td></tr>' for k, n, s, u in FLAGS)
review_html = ''.join(f'<li>{quote_marks(q)}</li>' for q in REVIEW)
chapters_html = ''.join(chapter_html(c) for c in CHAPTERS)

page = f'''<title>Biên Niên Bảy Mối</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,600;0,700;0,800;1,500&family=Nunito:wght@500;600;700;800&display=swap">
<style>
/* Bố cục: sổ cốt truyện một cột (mục lục dính trái trên màn rộng); giấy da + mực đỏ son cho cú lật, cùng bộ màu với trang Thế giới Aether. */
:root {{
  --paper: #f5e3c0; --paper-hi: #fcf2dc; --paper-sunk: #e9cf9f; --line: #c9a578;
  --ink: #34200f; --ink-soft: #6b4a2b; --wood: #4a2e1c; --gold: #a8740e; --blood: #9a2b1f; --sea: #1f5a7a; --leaf: #2f6b34;
  --display: 'Alegreya', Georgia, serif; --body: 'Nunito', system-ui, sans-serif;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --paper: #1f150d; --paper-hi: #2a1d13; --paper-sunk: #170f09; --line: #5a3f27;
  --ink: #f0dfb8; --ink-soft: #d2b88a; --wood: #f0dfb8; --gold: #ffcf66; --blood: #ff9d8c; --sea: #9fd3ff; --leaf: #8fd39a; color-scheme: dark; }} }}
:root[data-theme="dark"] {{
  --paper: #1f150d; --paper-hi: #2a1d13; --paper-sunk: #170f09; --line: #5a3f27;
  --ink: #f0dfb8; --ink-soft: #d2b88a; --wood: #f0dfb8; --gold: #ffcf66; --blood: #ff9d8c; --sea: #9fd3ff; --leaf: #8fd39a; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ background: var(--paper); color: var(--ink); font-family: var(--body); font-size: 15.5px; line-height: 1.65; }}
.wrap {{ max-width: 1200px; margin: 0 auto; padding-inline: 16px; padding-block: 28px 72px; display: grid; grid-template-columns: 210px minmax(0, 1fr); gap: 36px; }}
@media (max-width: 880px) {{ .wrap {{ grid-template-columns: minmax(0, 1fr); }} nav.toc {{ position: static !important; }} }}
nav.toc {{ position: sticky; top: calc(env(safe-area-inset-top, 0px) + 16px); align-self: start; display: flex; flex-direction: column; gap: 2px; font-size: 14px; }}
nav.toc .label {{ font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-soft); font-weight: 800; margin: 10px 0 4px; }}
nav.toc a {{ color: var(--ink); text-decoration: none; padding: 3px 8px; border-radius: 6px; display: flex; gap: 8px; }}
nav.toc a:hover, nav.toc a:focus-visible {{ background: var(--paper-sunk); outline: none; }}
nav.toc .num {{ color: var(--blood); font-weight: 800; min-width: 1.4em; font-variant-numeric: tabular-nums; }}
main {{ min-width: 0; display: flex; flex-direction: column; gap: 48px; }}
h1, h2, h3, h4 {{ font-family: var(--display); text-wrap: balance; margin: 0; line-height: 1.2; }}
h1 {{ font-size: clamp(32px, 5.4vw, 52px); font-weight: 800; }}
h2 {{ font-size: 27px; font-weight: 800; border-bottom: 2px solid var(--line); padding-bottom: 6px; margin-bottom: 16px; }}
h3 {{ font-size: clamp(24px, 3.4vw, 32px); font-weight: 800; }}
h4 {{ font-size: 18px; font-weight: 700; margin-bottom: 8px; }}
p {{ margin: 0; }}
q {{ font-family: var(--display); font-style: italic; font-weight: 500; quotes: "“" "”"; }}
.lead {{ font-family: var(--display); font-size: clamp(18px, 2.3vw, 22px); line-height: 1.5; max-width: 62ch; margin-top: 12px; }}
.status {{ display: inline-block; margin-top: 16px; font-size: 13px; font-weight: 800; color: var(--blood); background: var(--paper-hi); border: 1px solid var(--line); padding: 3px 12px; border-radius: 999px; }}
dl.theme {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px 24px; margin: 22px 0 0; }}
dl.theme dt {{ font-size: 12px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: var(--gold); }}
dl.theme dd {{ margin: 2px 0 0; }}
.cast {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }}
.person {{ background: var(--paper-hi); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }}
.person .role {{ font-size: 12px; font-weight: 800; color: var(--ink-soft); letter-spacing: .04em; }}
.person .fate {{ margin-top: auto; padding-top: 6px; border-top: 1px dashed var(--line); font-size: 13px; font-weight: 700; color: var(--blood); }}
.chapter {{ display: flex; flex-direction: column; gap: 16px; scroll-margin-top: 16px; }}
.chapter header {{ display: flex; flex-direction: column; gap: 6px; }}
.eyebrow {{ font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--gold); }}
.tags {{ display: flex; flex-wrap: wrap; gap: 6px; }}
.tag {{ font-size: 12px; font-weight: 800; padding: 1px 10px; border-radius: 999px; background: var(--paper-sunk); color: var(--ink-soft); }}
.tag.dragon {{ color: var(--sea); }}
.core {{ font-size: 16.5px; max-width: 72ch; }}
.split {{ display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 28px; }}
@media (max-width: 1040px) {{ .split {{ grid-template-columns: minmax(0, 1fr); }} }}
ol.maps {{ margin: 0; padding-left: 26px; display: flex; flex-direction: column; gap: 10px; }}
ol.maps li::marker {{ font-family: var(--display); font-weight: 800; color: var(--gold); }}
ol.maps b {{ font-family: var(--display); font-size: 16.5px; }}
.side {{ display: flex; flex-direction: column; gap: 18px; min-width: 0; }}
ul.bosses {{ list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }}
.boss {{ font-weight: 800; color: var(--blood); }}
.choice h4 {{ font-size: 16px; }}
.table-wrap {{ overflow-x: auto; }}
table {{ border-collapse: collapse; width: 100%; font-size: 14px; }}
th, td {{ text-align: left; vertical-align: top; padding: 7px 9px; border-bottom: 1px solid var(--line); }}
thead th {{ font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); }}
tbody th {{ font-weight: 800; min-width: 7em; }}
.ending {{ background: var(--paper-hi); border-left: 4px solid var(--blood); border-radius: 0 10px 10px 0; padding: 12px 16px; display: flex; flex-direction: column; gap: 4px; }}
.ending span {{ font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--blood); }}
.ending p {{ font-family: var(--display); font-size: 17.5px; line-height: 1.5; }}
ol.twists {{ list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }}
ol.twists li {{ display: grid; grid-template-columns: 6.5em minmax(0, 1fr); gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--line); }}
ol.twists a {{ color: var(--blood); font-weight: 800; text-decoration: none; font-variant-numeric: tabular-nums; }}
.role {{ color: var(--ink-soft); font-size: 12px; }}
code {{ font-size: 13px; }}
ol.review {{ padding-left: 22px; margin: 0; display: flex; flex-direction: column; gap: 8px; }}
.chapters {{ display: flex; flex-direction: column; gap: 56px; }}
</style>

<div class="wrap">
  <nav class="toc" aria-label="Mục lục">
    <span class="label">Tổng quan</span>
    <a href="#tom-tat">Cả truyện</a>
    <a href="#nhan-vat">Nhân vật và bí mật</a>
    <span class="label">10 chương · 10 vùng</span>
    {toc}
    <span class="label">Thêm</span>
    <a href="#cu-lat">Những cú lật</a>
    <a href="#co">Cờ lựa chọn</a>
    <a href="#duyet">Cần duyệt</a>
  </nav>
  <main>
    <section id="tom-tat">
      <h1>Biên Niên Bảy Mối</h1>
      <p class="lead">{quote_marks(LOGLINE)}</p>
      <span class="status">Bản nháp chờ chủ dự án duyệt · 08/10/2026</span>
      <dl class="theme">{theme_html}</dl>
    </section>

    <section id="nhan-vat">
      <h2>Nhân vật và điều họ giấu</h2>
      <div class="cast">{cast_html}</div>
    </section>

    <section>
      <h2>10 chương theo 10 vùng</h2>
      <div class="chapters">{chapters_html}</div>
    </section>

    <section id="cu-lat">
      <h2>Những cú lật</h2>
      <ol class="twists">{twist_html}</ol>
    </section>

    <section id="co">
      <h2>Cờ lựa chọn</h2>
      <p style="max-width:72ch">Không có thanh thiện cảm chung. Game ghi từng quyết định thành cờ riêng; đoạn sau đọc cờ để đổi thoại, ai có mặt và kết cục.</p>
      <div class="table-wrap" style="margin-top:12px"><table>
        <thead><tr><th>Cờ</th><th>Đặt ở</th><th>Đổi điều gì về sau</th></tr></thead>
        <tbody>{flags_html}</tbody>
      </table></div>
    </section>

    <section id="duyet">
      <h2>Cần duyệt</h2>
      <ol class="review">{review_html}</ol>
    </section>
  </main>
</div>
'''
open(OUT, 'w', encoding='utf8', newline='').write(page)

# ---------------------------------------------------------------- bản Markdown (cho agent làm tiếp)
md = ['# Biên Niên Bảy Mối — cốt truyện 10 vùng × 7 map (BẢN NHÁP chờ duyệt)\n',
      '> FILE SINH TỰ ĐỘNG từ `docs/tools/cot-truyen.py` (cùng trang `docs/cot-truyen-aether.html`) — sửa dữ liệu ở đó rồi chạy lại.',
      '> Soạn 08/10/2026 theo yêu cầu chủ dự án: "cốt truyện thật nhiều drama, hay, vào theo các map". Tên vùng / map / boss khớp',
      '> `docs/the-gioi-aether.md` (script tự kiểm). Nền giữ từ `docs/story.md` + `docs/story-arc.md`; khi được duyệt, mạch này thay',
      '> phần Chương 2–7 (7 lục địa) của story-arc.\n',
      LOGLINE + '\n']
for a, b in THEME:
    md.append(f'- **{a}:** {b}')
md.append('\n## Nhân vật và điều họ giấu\n')
md.append('| Nhân vật | Vai | Điều họ giấu / vết nứt | Số phận |\n|---|---|---|---|')
for n, r, s, f in CAST:
    md.append(f'| {n} | {r} | {s} | {f} |')
for ch in CHAPTERS:
    md.append(f"\n## Chương {ch['n']} — {ch['title']} (vùng {ch['n']}: {ch['region']})\n")
    md.append(f"*{ch['mood']}*" + (f" · rồng: **{ch['dragon']}**" if ch.get('dragon') else '') + '\n')
    md.append(ch['core'] + '\n')
    md.append('**Theo từng map:**\n')
    for i, (m, t) in enumerate(ch['maps'], 1):
        md.append(f'{i}. **{m}** — {t}')
    md.append('\n**Boss:**\n')
    for b, t in ch['bosses']:
        md.append(f'- **{b}** — {t}')
    for c in (ch['choice'], ch.get('choice2')):
        if not c:
            continue
        md.append(f'\n**Lựa chọn: {c[0]}**\n')
        md.append('| Chọn | Được | Mất |\n|---|---|---|')
        for a, g, cost in c[1]:
            md.append(f'| {a} | {g} | {cost} |')
    md.append(f"\n**Kết chương:** {ch['ending']}")
md.append('\n## Những cú lật\n')
for n, t in TWISTS:
    md.append(f'- Chương {n}: {t}')
md.append('\n## Cờ lựa chọn (không dùng thanh thiện cảm chung)\n')
md.append('| Cờ | Ý nghĩa | Đặt ở | Đổi điều gì |\n|---|---|---|---|')
for k, n, s, u in FLAGS:
    md.append(f'| `{k}` | {n} | {s} | {u} |')
md.append('\n## Cần duyệt\n')
for i, q in enumerate(REVIEW, 1):
    md.append(f'{i}. {q}')
md.append('')
open(OUT_MD, 'w', encoding='utf8', newline='').write('\n'.join(md))
print('ok', len(CHAPTERS), 'chương', sum(len(c['maps']) for c in CHAPTERS), 'map')
