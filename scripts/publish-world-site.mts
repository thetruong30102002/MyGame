// Công bố một bản tin web theo yêu cầu; backup SQLite nhất quán trước khi ghi. Không reset dữ liệu người chơi.
import { DatabaseSync, backup } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dbPath } from '../apps/server/src/dbPath';
const dir=resolve('.havenlord-stage/world-renewal');
mkdirSync(dir,{recursive:true});
const path=dbPath();
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const target=resolve(dir,'havenlord-before-web-'+stamp+'.db');
const source=new DatabaseSync(path,{readOnly:true});
const before={accounts:source.prepare('SELECT count(*) AS n FROM accounts').get()!.n,characters:source.prepare('SELECT count(*) AS n FROM characters').get()!.n};
await backup(source,target);source.close();
const check=new DatabaseSync(target,{readOnly:true});
const integrity=check.prepare('PRAGMA integrity_check').get();check.close();
if(Object.values(integrity!)[0]!=='ok')throw Error('Backup không qua integrity_check');
const metadata={backup:target,sha256:createHash('sha256').update(readFileSync(target)).digest('hex'),integrity:'ok',before,reset:false};
writeFileSync(resolve(dir,'web-release-backup.json'),JSON.stringify(metadata,null,2));
const db=new DatabaseSync(path);db.exec('PRAGMA busy_timeout=5000');
const title='Cổng game mới & những bước tiếp theo của Aether';
const body=[
 'Trang chủ, cẩm nang thế giới và các trang cộng đồng khoác giao diện rừng đêm và vàng cổ, dễ đọc trên máy tính lẫn điện thoại. Các link tải và hướng dẫn cập nhật vẫn ở mục Tải game.',
 'Đợt phát triển tiếp theo tập trung vào trung tâm vùng đông đúc hơn, kiến trúc đặc trưng và cảnh quan riêng cho Rừng Nấm, Phế tích cùng các miền nguyên tố. Đây là kế hoạch đang thiết kế, chưa phải nội dung mới có trong bản game đang tải.',
 'Ảnh trước/sau, chuyển động quái và boss cùng thông tin phiên bản sẽ được giới thiệu từng phần khi hoàn thiện. Lần cập nhật này là phần web; tài khoản và dữ liệu người chơi được giữ nguyên.'
];
let item=db.prepare('SELECT id FROM news WHERE title=?').get(title);
if(!item){const result=db.prepare('INSERT INTO news(tag,title,body,author,at) VALUES (?,?,?,?,?)').run('Thông báo',title,JSON.stringify(body),'Ban phát triển',Date.now());item={id:Number(result.lastInsertRowid)};}
db.close();
writeFileSync(resolve(dir,'web-release-news.json'),JSON.stringify({id:item.id,title,publishedAt:new Date().toISOString()},null,2));
console.log(JSON.stringify({backup:target,integrity:'ok',before,newsId:item.id,reset:false}));
