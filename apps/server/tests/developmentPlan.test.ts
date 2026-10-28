// Quyền truy cập và cách tính tiến độ: HTTP thật, SQLite riêng, không đụng DB thật.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/db.ts';
import { createApi } from '../src/http.ts';
import { parsePlan, planProgress, readDevelopmentPlan, type PlanTask } from '../src/developmentPlan.ts';

const snapshot=readDevelopmentPlan();
assert.equal(snapshot.totals.maps,174);
assert(snapshot.tasks.some(t=>t.id==='web-spa'));
assert(snapshot.tasks.every(t=>t.progress>=0&&t.progress<=100));
assert.equal(snapshot.progress,planProgress(snapshot.tasks));
const design=(snapshot as unknown as {worldDesign:{factions:unknown[];chapters:unknown[];topology:{mapCount:number;errors:unknown[]}}}).worldDesign;
assert.equal(design.factions.length,20);assert.equal(design.chapters.length,4);assert.equal(design.topology.mapCount,174);assert.deepEqual(design.topology.errors,[]);
const fixture=(weight:number,done:boolean):PlanTask=>({id:'t',group:'g',name:'n',detail:'d',weight,phase:1,region:null,depends:[],steps:[{label:'m',weight:100,done,evidence:done?'ảnh nghiệm thu':''}]});
assert.equal(planProgress([fixture(1,true),fixture(3,false)]),25);
assert.equal(planProgress([]),0);
assert.equal(planProgress([fixture(2,true)]),100);
const modified=(fn:(p:ReturnType<typeof parsePlan>)=>void)=>{const p=parsePlan(snapshot.markdown);fn(p);return '<!-- havenlord-plan:start -->\n```json\n'+JSON.stringify(p)+'\n```\n<!-- havenlord-plan:end -->';};
assert.throws(()=>parsePlan(modified(p=>{p.tasks[0]!.steps[0]!.evidence='';})),/Mốc/);
assert.throws(()=>parsePlan(modified(p=>{p.tasks[0]!.weight=-1;})),/Đầu việc/);
assert.throws(()=>parsePlan(modified(p=>{p.tasks[0]!.steps[0]!.weight=90;})),/Mốc/);
assert.throws(()=>parsePlan(modified(p=>{p.tasks[0]!.depends=['khong-ton-tai'];})),/Phụ thuộc/);
assert.throws(()=>parsePlan(modified(p=>{p.tasks[1]!.id=p.tasks[0]!.id;})),/Đầu việc/);

const dir=mkdtempSync(join(tmpdir(),'havenlord-plan-'));
const store=new Store(join(dir,'test.db'));
const acc=store.createAccount('admin_plan','unused')!;
store.setAdmin('admin_plan',true);
store.createSession('admin-plan-token',acc,3600_000);
store.createSession('player-plan-token',store.createAccount('player_plan','unused')!,3600_000);
const api=createApi(store);
const server=createServer((req,res)=>void api(req,res));
await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+(server.address() as {port:number}).port;
try{
 for(const mount of ['','/game']){
  for(const [token,status] of [['',401],['invalid',401],['player-plan-token',403],['admin-plan-token',200]] as const){
   const r=await fetch(base+mount+'/api/admin/plan',{headers:token?{Authorization:'Bearer '+token}:{}});
   assert.equal(r.status,status);
   const text=await r.text();
   if(status!==200)assert(!text.includes('Thiên Thành Khởi Nguyên'));
   else { const p=JSON.parse(text); assert.equal(p.tasks.length,snapshot.tasks.length); assert.equal(p.progress,snapshot.progress); }
  }
 }
 assert.equal((await fetch(base+'/site/ke-hoach-nang-cap-the-gioi.md')).status,404);
 for(const path of ['/game/','/game/admin','/game/the-gioi','/game/tin-tuc','/game/dien-dan','/game/tai-game','/game/gop-y','/game/site/roster.json','/game/site/home.js'])assert.equal((await fetch(base+path)).status,200,path);
 assert.equal((await fetch(base+'/game/site/plan.js')).status,404);
 assert.equal((await fetch(base+'/game/site/world-design.js')).status,404);
 console.log('PASS: tiến độ có trọng số, dữ liệu sai bị chặn, API 401/403/200 ở cả mount, tài liệu riêng admin, các trang web trả 200.');
}finally{await new Promise<void>(r=>server.close(()=>r()));store.close();rmSync(dir,{recursive:true,force:true});}
