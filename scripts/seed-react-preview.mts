// Dữ liệu giao diện dùng riêng tại cổng 3201. Không nhận đường dẫn DB qua tham số.
import {Store} from '../apps/server/src/db.ts';
import {newProgress} from '../apps/server/src/http.ts';
const s=new Store('.aether-stage/world-renewal/site-preview.db'),a=s.account('preview_admin')!;
if(!s.character('00000000-0000-0000-0000-000000000aaa',a.id))s.createCharacter('00000000-0000-0000-0000-000000000aaa',a.id,'Nhân Vật Thử','male',newProgress());
if(!s.feedbackList(500).some(f=>f.text==='Góp ý thử React'))s.addFeedback(a.id,'preview_admin','Nhân Vật Thử','Góp ý thử React',null,'web');
if(!s.posts(50,null).some(p=>p.title==='Bài viết thử React')){const id=s.addPost(a.id,'Nhân Vật Thử','Bài viết thử React','Nội dung chỉ dùng để kiểm tra giao diện.');s.addComment(id,a.id,'Nhân Vật Thử','Bình luận thử giao diện.');}
s.close();console.log('Đã seed dữ liệu UI trên DB thử riêng.');
