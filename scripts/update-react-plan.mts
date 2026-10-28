import {readFileSync,writeFileSync} from 'node:fs';
import {parsePlan,planProgress} from '../apps/server/src/developmentPlan.ts';
const path='docs/ke-hoach-nang-cap-the-gioi.md';let text=readFileSync(path,'utf8'),p=parsePlan(text);
const group='Web và công bố';
for(const task of [
 {id:'admin-react',name:'Chuyển toàn bộ admin sang React',detail:'Đăng nhập, kế hoạch, xem 30 nhân vật, tài nguyên, góp ý, tin tức/lưu trữ, diễn đàn và nhật ký. Giữ trạng thái khi chuyển tab; kiểm API có quyền và thao tác trên SQLite thử.'},
 {id:'content-reboot',name:'Thay nội dung web theo hướng nhân vật và thế giới mới',detail:'Bỏ tuyến nhân vật chính cũ, bản đồ tổng cũ và giới thiệu class/nguyên tố cũ khỏi web. Đưa 30 tạo hình native/8 hướng và 5 class lên; lưu bản truyện và tin cũ để tra cứu. Nhân vật cũ dành cho NPC sau này.'}
])if(!p.tasks.some(t=>t.id===task.id))p.tasks.push({...task,group,weight:2,phase:1,region:null,depends:[],requiresNewArt:false,steps:[{label:'Nguồn và triển khai',weight:60,done:true,evidence:'React TSX trong apps/server/site-src/admin; bundle nội bộ có hash. Dữ liệu hướng mới docs/dinh-huong-aether.md và 240 ảnh native có hash đối chiếu.'},{label:'Kiểm thử và cập nhật link thật',weight:40,done:false,evidence:''}]});
text=text.replace('Sahrin là thành của Nữ hoàng Amira (theo mạch truyện đã có);','Thành ốc đảo dự kiến có quân chủ, danh tính chưa chốt;');
if(!text.includes('## Hướng mới ngày 26/10/2026'))text=text.replace('## Yêu cầu đã chốt','## Hướng mới ngày 26/10/2026\n\nNguồn nội dung hiện hành: [Định hướng Aether](dinh-huong-aether.md). Truyện cũ đã lưu trữ; nhân vật đời cũ sau này thành NPC. Người chơi chọn bộ 30 nhân vật / 5 class. 8 nguyên tố phát hiện cấp 10 với tỷ lệ đều; khuôn viên, chợ, hồ câu và mê cung là hướng phát triển đã chốt. Chỉ các nội dung đã hoàn thiện mới được công bố là đã phát hành.\n\n## Yêu cầu đã chốt');
text=text.replace(/(<!-- aether-plan:start -->\s*```json\s*)[\s\S]*?(\s*```\s*<!-- aether-plan:end -->)/,(_,a,b)=>a+JSON.stringify(p,null,2)+b);
parsePlan(text);writeFileSync(path,text);console.log(JSON.stringify({tasks:p.tasks.length,progress:planProgress(p.tasks)}));
