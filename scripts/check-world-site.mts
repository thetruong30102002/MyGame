// Kiểm lại link thật bằng phiên admin sẵn có (chỉ đọc, không in token hoặc tạo quyền mới).
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { writeFileSync } from 'node:fs';
import {readDevelopmentPlan} from '../apps/server/src/developmentPlan';
import {dbPath} from '../apps/server/src/dbPath';
const db=new DatabaseSync(dbPath(),{readOnly:true});
const counts={accounts:db.prepare('SELECT count(*) n FROM accounts').get()!.n,characters:db.prepare('SELECT count(*) n FROM characters').get()!.n};
const session=db.prepare('SELECT s.token FROM sessions s JOIN admins a ON a.account_id=s.account_id WHERE s.expires_at>? ORDER BY s.expires_at DESC LIMIT 1').get(Date.now());
db.close();
const base='https://admin.tail024813.ts.net/game';
const expectedPlans=process.argv.slice(2),localPlan=readDevelopmentPlan();
const unauth=await fetch(base+'/api/admin/plan');assert.equal(unauth.status,401);
let adminStatus:number|null=null, tasks:number|null=null, progress:number|null=null;
const verifiedPlans:{id:string;name:string;progress:number}[]=[];
if(expectedPlans.length&&!session)throw Error('Chưa có phiên admin hợp lệ để kiểm kế hoạch trên link thật');
if(session){const r=await fetch(base+'/api/admin/plan',{headers:{Authorization:'Bearer '+session.token}});assert.equal(r.status,200);const p=await r.json();adminStatus=r.status;tasks=p.tasks.length;progress=p.progress;assert(p.tasks.some((t:{id:string})=>t.id==='web-spa'));assert.equal(p.worldDesign.factions.length,20);assert.equal(p.worldDesign.chapters.length,4);assert.deepEqual(p.worldDesign.topology.errors,[]);}
const r=await fetch(base+'/api/news?limit=1');assert(r.ok);const news=await r.json();
if(expectedPlans.length&&session){const r=await fetch(base+'/api/admin/plan?view=dashboard',{headers:{Authorization:'Bearer '+session.token}});assert.equal(r.status,200);const p=await r.json();for(const id of expectedPlans){const task=p.tasks.find((t:{id:string})=>t.id===id);assert(task,'Thiếu kế hoạch trên admin thật: '+id);const local=localPlan.tasks.find(t=>t.id===id);assert(local,'Thiếu kế hoạch nguồn: '+id);for(const key of ['name','detail','steps','requiresNewArt','priority','progress'] as const)assert.deepEqual(task[key],local[key],id+': nội dung khác nguồn ở '+key);verifiedPlans.push({id,name:task.name,progress:task.progress});}}
assert.equal(news[0].title,'Haven mới: 30 tạo hình, 5 class và thế giới tiếp theo');
const report={checkedAt:new Date().toISOString(),base,unauth:unauth.status,adminStatus,tasks,progress,counts,newsId:news[0].id,verifiedPlans,reset:false};
writeFileSync('.havenlord-stage/world-renewal/live-check.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
