import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { REGIONS } from '../src/regions.ts';
import { ARCHIVE_CHAPTERS,ARCHIVE_EVIDENCE,FACTIONS,FACTION_RELATIONS,POLITICAL_REGIONS,SKY_CASTLE_DESIGN,WORLD_DESIGN,WORLD_LAYOUT,archiveAccess,archiveChapterGate,visibleArchive } from '../src/worldDesign.ts';
import { auditWorldConnections,type WorldLinkMap } from '../src/worldConnections.ts';
const root=join(import.meta.dirname,'../../../');
const maps:WorldLinkMap[]=[];
for(const r of REGIONS){const folder=join(root,'assets/maps',r.id);const index=JSON.parse(readFileSync(join(folder,'world.json'),'utf8'));for(const id of Object.keys(index.maps)){const m=JSON.parse(readFileSync(join(folder,id+'.json'),'utf8'));maps.push({...m,key:r.id+'/'+id});}}
test('mỗi vùng có một hồ sơ chính trị, ghế thật và phe tồn tại',()=>{
	assert.equal(POLITICAL_REGIONS.length,REGIONS.length);
	assert.equal(new Set(POLITICAL_REGIONS.map(r=>r.region)).size,REGIONS.length);
	assert.equal(new Set(FACTIONS.map(f=>f.id)).size,FACTIONS.length);
	for(const p of POLITICAL_REGIONS){assert(REGIONS.some(r=>r.id===p.region));assert(maps.some(m=>m.key===p.seatMap),p.seatMap);assert(p.factions.length);for(const f of p.factions)assert(FACTIONS.some(x=>x.id===f&&x.regions.includes(p.region)),f);}
	for(const f of FACTIONS)for(const id of f.regions)assert(REGIONS.some(r=>r.id===id));
});
test('quan hệ không tự lặp, không trỏ phe thiếu; giữ nữ hoàng và phân biệt boss băng',()=>{
	const pairs=new Set<string>();for(const e of FACTION_RELATIONS){assert.notEqual(e.a,e.b);assert(FACTIONS.some(f=>f.id===e.a));assert(FACTIONS.some(f=>f.id===e.b));const pair=[e.a,e.b].sort().join(':');assert(!pairs.has(pair));pairs.add(pair);}
	assert.equal(POLITICAL_REGIONS.find(p=>p.region==='desert')!.authority,'Vua hoặc nữ hoàng ốc đảo; danh tính chưa chốt');
	assert.match(POLITICAL_REGIONS.find(p=>p.region==='tundra')!.continuity,/Thiết kế mới/);
});
test('sơ đồ mới đủ 13 vùng và Thiên Thành, tọa độ trong khung, không thay tranh cũ',()=>{
	assert.equal(WORLD_LAYOUT.length,14);assert.equal(new Set(WORLD_LAYOUT.map(p=>p.id)).size,14);
	for(const r of REGIONS)assert(WORLD_LAYOUT.some(p=>p.id===r.id&&p.status==='existing-region'));
	for(const p of WORLD_LAYOUT)assert(p.x>=8&&p.x<=92&&p.y>=8&&p.y<=92);
	assert.equal(WORLD_LAYOUT.find(p=>p.id==='sky_castle')!.status,'planned');assert.equal(SKY_CASTLE_DESIGN.playable,false);assert.equal(SKY_CASTLE_DESIGN.deity.count,1);
});
test('tất cả nguồn chứng cứ trỏ map thật và bốn chương có chuỗi điều kiện hợp lệ',()=>{
	const ids=ARCHIVE_EVIDENCE.map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
	for(const e of ARCHIVE_EVIDENCE)assert(maps.some(m=>m.key===e.map),e.map);
	for(const c of ARCHIVE_CHAPTERS){for(const e of c.requires)assert(ids.includes(e));if(c.previous)assert(ARCHIVE_CHAPTERS.some(p=>p.id===c.previous&&p.order<c.order));assert(c.keeper.length>=2);}
});
test('không lộ chương bị khóa, không mở bằng cấp NaN hoặc cờ đọc giả',()=>{
	const all=ARCHIVE_EVIDENCE.map(e=>e.id);
	assert(archiveAccess({level:NaN,evidence:all,read:[]}));
	assert.deepEqual(visibleArchive({level:59,evidence:all,read:[]}),[]);
	assert.deepEqual(visibleArchive({level:60,evidence:[],read:['origin','pact','burden']}),[]);
	const first={level:60,evidence:[...SKY_CASTLE_DESIGN.access.evidence],read:[]};assert.deepEqual(visibleArchive(first).map(c=>c.id),['origin']);
	assert(archiveChapterGate('memory',{level:100,evidence:all,read:['burden']}));
	assert.equal(archiveChapterGate('memory',{level:100,evidence:all,read:['origin','pact','burden']}),null);
	assert(archiveChapterGate('invalid',{level:100,evidence:all,read:[]}));
});
test('174 map thật liên thông và cổng hai chiều có đúng điểm đến',()=>{
	const audit=auditWorldConnections(maps);assert.equal(audit.mapCount,174);assert.deepEqual(audit.errors,[]);assert.deepEqual(audit.unreachable,[]);assert.equal(audit.connections.length,12);assert.equal(audit.crossRegionLinks,24);
});
test('audit bắt đích sai, điểm đến thiếu và lối chỉ có một chiều',()=>{
	const m:WorldLinkMap[]=[{key:'a/start',spots:[],exits:[{id:'bad',to:'x/missing'},{id:'missing-spot',to:'b/hub',toSpot:'absent'}]},{key:'b/hub',spots:[],exits:[]}];
	const a=auditWorldConnections(m,'a/start');assert.equal(a.errors.length,3);
});
test('bản xuất Unity và bản trên admin khớp nguồn thiết kế',()=>{
	const unity=JSON.parse(readFileSync(join(root,'UnityGame/Assets/HavenLord/Data/Sim/worldDesign.json'),'utf8'));
	assert.deepEqual(unity.WORLD_DESIGN,WORLD_DESIGN);
	const markdown=readFileSync(join(root,'docs/ke-hoach-nang-cap-the-gioi.md'),'utf8');
	const plan=JSON.parse(markdown.split('```json')[1]!.split('```')[0]!);
	const {topology,...design}=plan.worldDesign;
	assert.deepEqual(design,WORLD_DESIGN);assert.deepEqual(topology,auditWorldConnections(maps));
});
