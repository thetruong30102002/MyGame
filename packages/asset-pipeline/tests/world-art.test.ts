// Kiểm các lỗi từng gặp: nhà/cửa sai cỡ, ảnh mềm và mất nhà cũ khi đổi mẫu.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createImage } from '../src/image/rgba.js';
import { buildTown } from '../src/maps/human/town.js';
import { loadWorldArt, THISTLEWOOD_INN as INN, WORLD_ART_RULER, worldArtIssues, type WorldArtProof } from '../src/props/worldArt.js';
import { buildSolids, isBlocked } from '../../sim/src/collision.js';
import type { PropMeta } from '../src/props/buildProps.js';

const root=join(import.meta.dirname,'../../../');
const meta=JSON.parse(readFileSync(join(root,'assets/maps/human/props.meta.json'),'utf8')) as Record<string,PropMeta>;
// Hình chữ nhật trong bộ nhớ chỉ là fixture toán học, không xuất thành hình game.
function fixture(){
	const image=createImage(340,444);
	for(let y=2;y<442;y++)for(let x=2;x<338;x++)image.data.set([30,60,40,255],(y*340+x)*4);
	const proof:WorldArtProof={version:1,image:'image.png',sha256:'test-only',nativePixelScale:1,artReviewed:true,reviewEvidence:'fixture',ruler:WORLD_ART_RULER,door:{...INN.door},footprint:{...INN.footprint}};
	return {image,proof};
}
test('mẫu đúng native, cửa, chân neo và alpha qua kiểm tra',()=>{
	const {image,proof}=fixture();assert.deepEqual(worldArtIssues(image,proof),[]);
});
test('chặn cửa thấp, sai chân neo, thước, ảnh mềm và chưa duyệt',()=>{
	const {image,proof}=fixture();
	proof.door.h=50;proof.footprint.y=-160;proof.artReviewed=false;
	image.data[(3*340+3)*4+3]=100;
	const errors=worldArtIssues(image,proof).join(';');
	assert.match(errors,/Cửa/);assert.match(errors,/Footprint/);assert.match(errors,/alpha/);assert.match(errors,/duyệt/);
	assert.match(worldArtIssues(image,{...proof,ruler:{...WORLD_ART_RULER,bodyHeight:100} as never}).join(';'),/thước/);
});
test('chặn ảnh phóng cũ, sai khổ và bảng màu quá nhiễu',()=>{
	const {image,proof}=fixture();
	for(let x=2;x<110;x++)image.data.set([x,80,50,255],(4*340+x)*4);
	assert.match(worldArtIssues(image,proof).join(';'),/màu/);
	assert.match(worldArtIssues(image,{...proof,nativePixelScale:2} as never).join(';'),/1×/);
	assert.match(worldArtIssues(createImage(64,64),proof).join(';'),/rỗng/);
});
test('thiếu bản vẽ trả trạng thái chờ; không tải bù ảnh ngoài hoặc đọc đường dẫn tùy ý',()=>{
	assert.equal(loadWorldArt(join(root,'.havenlord-stage/nonexistent-world-art'),INN.sourceId),null);
	assert.throws(()=>loadWorldArt(root,'../../outside'),/chuẩn mỹ thuật/);
});
test('mẫu mới không có: nhà trọ giữ nguyên vị trí sản xuất',()=>{
	const town=buildTown(meta,[]);
	assert.deepEqual(town.props.find(p=>p.id==='house_inn'),{id:'house_inn',x:INN.placement.x,y:INN.placement.y});
	assert(!town.props.some(p=>p.id===INN.id));
});
test('mẫu mới có: giữ đủ bảy nhà cũ, không đổi các điểm truyện / cổng / hồi sinh',()=>{
	const old=buildTown(meta,[]);
	const newMeta={...meta,[INN.id]:{kind:'building',w:336,h:440,blocks:true,footprint:INN.footprint}};
	const town=buildTown(newMeta,[]);
	for(const id of ['house','church','house_forge','house_store','house_inn','house_stone','house_farm'])assert.equal(town.props.filter(p=>p.id===id).length,1,id);
	assert.deepEqual(town.props.find(p=>p.id===INN.id),{id:INN.id,...INN.placement});
	assert.deepEqual(town.props.find(p=>p.id==='house_inn'),{id:'house_inn',...INN.auxiliaryInn});
	assert.deepEqual(town.spots,old.spots);assert.deepEqual(town.spawn,old.spawn);assert.deepEqual(town.exits,old.exits);
	assert.deepEqual(town.terrain,old.terrain);
	// Hành lang từ quảng trường tới trước nhà mẫu và ba cổng vẫn nối thật qua collision.
	const solids=buildSolids(town,newMeta),size=12,cols=town.width*4,rows=town.height*4;
	const start=[Math.floor(town.spawn.x/size),Math.floor(town.spawn.y/size)];
	const queue=[start],seen=new Set([start.join(',')]);
	for(let i=0;i<queue.length;i++){
		const [x,y]=queue[i]!;
		for(const [a,b]of [[x!-1,y!],[x!+1,y!],[x!,y!-1],[x!,y!+1]]){
			const key=a+','+b;
			if(a!<0||b!<0||a!>=cols||b!>=rows||seen.has(key)||isBlocked(town,solids,a!*size+6,b!*size+6,11,5))continue;
			seen.add(key);queue.push([a!,b!]);
		}
	}
	for(const p of [{x:INN.placement.x,y:INN.placement.y+36},...town.spots.filter(p=>['east_gate','north_road','south_road'].includes(p.id))])assert(seen.has([Math.floor(p.x/size),Math.floor(p.y/size)].join(',')),JSON.stringify(p));
});
