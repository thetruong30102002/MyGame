/** Chỉ dành AutoTest cổng 3201: mô phỏng cây lớn offline trên test.db, không thêm lệnh gian lận vào máy chủ game. */
import assert from 'node:assert/strict';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
const dir=resolve(process.argv[2]||'.havenlord-stage/farm-autotest');const request=join(dir,'farm-growth-request.json');
const deadline=Date.now()+15*60000;while(!existsSync(request)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,1000));
assert(existsSync(request),'Không có yêu cầu fixture AutoTest');
const {character}=JSON.parse(readFileSync(request,'utf8')) as {character:string};
const path=resolve('apps/server/data/test.db');assert(path.endsWith('apps\\server\\data\\test.db'),'Chỉ được mở test.db');
const db=new DatabaseSync(path);
try{
 const row=db.prepare('SELECT a.username,c.account_id,f.state FROM characters c JOIN accounts a ON a.id=c.account_id JOIN farm_accounts f ON f.account_id=c.account_id WHERE c.id=?').get(character) as {username:string;account_id:number;state:string}|undefined;
 assert(row&&row.username.startsWith('ut'),'Chỉ nhân vật AutoTest ngẫu nhiên mới được dùng fixture');
 const state=JSON.parse(row.state);assert(state.plots[0].crop==='wheat'&&state.plots[0].watered);
 state.plots[0].lastAt=Date.now()-600000;
 db.prepare('UPDATE farm_accounts SET state=? WHERE account_id=?').run(JSON.stringify(state),row.account_id);
 // Xu thử để AutoTest mua nhà Gia viên (Lùn núi lửa 155.000 + Biệt thự Haven 350.000).
 db.prepare("UPDATE characters SET progress=json_set(progress,'$.coins',coalesce(json_extract(progress,'$.coins'),0)+600000) WHERE id=?").run(character);
 writeFileSync(join(dir,'farm-growth-ready.txt'),'Đã mô phỏng 10 phút offline trong test.db, đúng nhân vật AutoTest.');
 console.log('✔ Fixture cây offline đã đặt trên test.db của nhân vật AutoTest');
}finally{db.close();}
