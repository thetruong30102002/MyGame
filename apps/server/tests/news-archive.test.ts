import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {Store} from '../src/db.ts';
import {createApi} from '../src/http.ts';
const dir=mkdtempSync(join(tmpdir(),'aether-archive-')),store=new Store(join(dir,'test.db'));
store.createSession('admin',store.createAccount('archive_admin','x')!,3600000);store.setAdmin('archive_admin',true);
store.createSession('player',store.createAccount('archive_player','x')!,3600000);
const id=store.addNews('Thông báo','Bản tin cũ',['Lưu để tra cứu'],'Admin');
const api=createApi(store),server=createServer((req,res)=>void api(req,res));await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+(server.address() as {port:number}).port;
const call=(path:string,token='',archived?:unknown)=>fetch(base+path,{method:archived===undefined?'GET':'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(archived===undefined?{}:{body:JSON.stringify({archived})})});
try{
 for(const mount of ['','/game']){
  assert.equal((await call(mount+'/api/admin/news')).status,401);
  assert.equal((await call(mount+'/api/admin/news','player')).status,403);
  assert.equal((await call(mount+'/api/admin/news/'+id+'/archive','player',true)).status,403);
  assert.equal((await call(mount+'/api/admin/news/'+id+'/archive','admin','true')).status,400);
  assert.equal((await call(mount+'/api/admin/news/'+id+'/archive','admin',true)).status,200);
  assert.equal((await (await call(mount+'/api/news')).json()).length,0);
  const all=await (await call(mount+'/api/admin/news','admin')).json();assert.equal(all[0].id,id);assert.equal(all[0].archived,true);
  assert.equal((await call(mount+'/api/admin/news/'+id+'/archive','admin',false)).status,200);
  assert.equal((await (await call(mount+'/api/news')).json())[0].id,id);
 }
 assert.equal(store.newsCount(),1);store.close();const reopened=new Store(join(dir,'test.db'));assert.equal(reopened.newsList(50)[0]!.id,id);reopened.close();
 console.log('PASS: lưu trữ/khôi phục, 401/403/400, cả hai mount, bản tin và DB giữ nguyên.');
}finally{await new Promise<void>(r=>server.close(()=>r()));rmSync(dir,{recursive:true,force:true});}
