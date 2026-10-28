// Chỉ đọc link thật; kiểm asset và nội dung, không tạo/sửa dữ liệu người chơi.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base='https://admin.tail024813.ts.net/game/';
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const manifest=await (await fetch(base+'site/react-manifest.json')).json();
for(const f of manifest.files){const r=await fetch(base+f.url);assert.equal(r.status,200);assert.equal(hash(new Uint8Array(await r.arrayBuffer())),hash(readFileSync('apps/server/'+f.url)),f.url);}
const roster=await (await fetch(base+'site/roster.json')).json();assert.equal(roster.characters.length,30);assert.equal(roster.roles.length,5);
for(const r of roster.roles)for(const gender of ['male','female'])assert.equal(roster.characters.filter((c:{role:string;gender:string})=>c.role===r.id&&c.gender===gender).length,3);
const paths:string[]=roster.characters.flatMap((c:{images:Record<string,string>})=>Object.values(c.images));assert.equal(paths.length,240);
let next=0;await Promise.all(Array.from({length:8},async()=>{while(next<paths.length){const path=paths[next++]!;const r=await fetch(base+path);assert.equal(r.status,200,path);assert.equal(hash(new Uint8Array(await r.arrayBuffer())),hash(readFileSync('apps/server/'+path)),path);}}));
for(const page of ['','admin','the-gioi','tin-tuc','tai-game','dien-dan','gop-y']){const r=await fetch(base+page);assert.equal(r.status,200,page);const text=await r.text();if(['','the-gioi'].includes(page))assert(!/hero-[mf]\.png|continent\.png|Bảy Mối|Lior|Nữ hoàng Amira/.test(text),page);if(page==='admin'){assert(text.includes('type="module"'));assert(!text.includes('site/plan.js'));}}
for(const old of ['plan.js','world-design.js'])assert.equal((await fetch(base+'site/'+old)).status,404);
const news=await (await fetch(base+'api/news?limit=200')).json();assert.equal(news.length,1);assert.equal(news[0].title,'Aether mới: 30 tạo hình, 5 class và thế giới tiếp theo');
const report={checkedAt:new Date().toISOString(),base,reactFiles:manifest.files.length,characters:30,roles:5,imagesVerified:paths.length,news:news.length,legacyScripts:404,playerDataChanged:false};
writeFileSync('.havenlord-stage/admin-react/live-assets-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
