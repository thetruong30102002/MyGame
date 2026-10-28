// Backup online nhất quán trước migration; bản tin cũ lưu trữ và khôi phục được trong admin.
import {DatabaseSync,backup} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {dbPath} from '../apps/server/src/dbPath';
const dir=resolve('.havenlord-stage/admin-react');mkdirSync(dir,{recursive:true});
const path=dbPath(),target=resolve(dir,'havenlord-before-react-'+new Date().toISOString().replace(/[:.]/g,'-')+'.db');
const source=new DatabaseSync(path,{readOnly:true});
const counts=(db:DatabaseSync)=>({accounts:db.prepare('SELECT count(*) n FROM accounts').get()!.n,characters:db.prepare('SELECT count(*) n FROM characters').get()!.n});
const before=counts(source);await backup(source,target);source.close();
const copy=new DatabaseSync(target,{readOnly:true});if(Object.values(copy.prepare('PRAGMA integrity_check').get()!)[0]!=='ok')throw Error('Backup không hợp lệ');copy.close();
writeFileSync(resolve(dir,'release-backup.json'),JSON.stringify({backup:target,integrity:'ok',sha256:createHash('sha256').update(readFileSync(target)).digest('hex'),before,reset:false},null,2));
const {Store}=await import('../apps/server/src/db.ts');const store=new Store(path);
const current=[{tag:'Thông báo',title:'Aether mới: 30 tạo hình, 5 class và thế giới tiếp theo',date:'26/10/2026',body:[
 'Cẩm nang mới giới thiệu 30 tạo hình thuộc Kiếm sĩ, Pháp sư, Cung thủ, Thương sĩ và Vệ sĩ. Mỗi class có 3 nam và 3 nữ, tóc, trang phục và một vũ khí được vẽ liền. Có thể xem ảnh native ở 8 hướng trên mục Thế giới.',
 'Hướng mới dành bộ nhân vật đời cũ cho các vai NPC. Nội dung giới thiệu và tuyến truyện cũ đã được lưu trữ. Bộ chuyển động mới đang hoàn thiện; lần cập nhật web này chưa phát hành toàn bộ 30 nhân vật trong client.',
 'Thiên phú dự kiến phát hiện một trong 8 nguyên tố ở cấp 10, tỷ lệ đều 12,5%. Thế giới tiếp tục phát triển khuôn viên và nhà riêng, hồ câu bạn bè, chợ giao thương, mê cung, thành thị và Thiên Thành giữ tri thức khởi nguyên.',
 'Trang quản trị chuyển sang React, bổ sung thư viện nhân vật và lưu trữ bản tin. Các link tải/cập nhật client vẫn hoạt động; dữ liệu người chơi được giữ nguyên.'
 ]}];
const old=store.newsList(500,true);const archived:number[]=[];
for(const n of old)if(!current.some(c=>c.title===n.title)){store.archiveNews(n.id,true);archived.push(n.id);}
const ids=current.map(n=>{const found=old.find(o=>o.title===n.title);if(found){store.archiveNews(found.id,false);return found.id;}return store.addNews(n.tag,n.title,n.body,'Ban phát triển');});store.close();
writeFileSync(resolve('apps/server/site/news.json'),JSON.stringify(current,null,2));
const afterDb=new DatabaseSync(path,{readOnly:true}),after=counts(afterDb);afterDb.close();
if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Số tài khoản/nhân vật thay đổi ngoài phạm vi');
writeFileSync(resolve(dir,'publication.json'),JSON.stringify({at:new Date().toISOString(),newsIds:ids,archived,before,after,reset:false},null,2));
console.log(JSON.stringify({backup:target,integrity:'ok',newsIds:ids,archived:archived.length,before,after}));
