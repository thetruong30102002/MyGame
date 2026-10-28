/** Rà cổng toàn thế giới bằng dữ liệu thật; không phụ thuộc ảnh hoặc Node. */
export interface WorldLinkMap {
	key:string; spots:readonly {id:string}[]; exits:readonly {id:string;to:string;toSpot?:string}[];
}
export interface RegionConnection {
	id:string;fromRegion:string;toRegion:string;fromMap:string;toMap:string;
	kind:'path'|'portal'|'sea-cave';status:'existing';
}
export const mapDestination=(key:string,to:string):string=>to.includes('/')?to:key.split('/')[0]+'/'+to;
export function auditWorldConnections(maps:readonly WorldLinkMap[],start='human/town'){
	const errors:string[]=[],byKey=new Map<string,WorldLinkMap>();
	for(const m of maps){if(byKey.has(m.key))errors.push('Trùng map: '+m.key);byKey.set(m.key,m);}
	const connections:RegionConnection[]=[],pairs=new Set<string>();
	let directedLinks=0,crossRegionLinks=0;
	for(const m of maps){
		const ids=new Set<string>();
		for(const e of m.exits){
			directedLinks++;
			if(ids.has(e.id))errors.push(m.key+': trùng ID cổng '+e.id);ids.add(e.id);
			const to=mapDestination(m.key,e.to),target=byKey.get(to);
			if(!target){errors.push(m.key+'/'+e.id+': không có map '+to);continue;}
			if(e.toSpot&&!target.spots.some(s=>s.id===e.toSpot))errors.push(m.key+'/'+e.id+': không có điểm đến '+to+'#'+e.toSpot);
			if(!target.exits.some(back=>mapDestination(to,back.to)===m.key))errors.push(m.key+'/'+e.id+': thiếu cổng quay lại từ '+to);
			const a=m.key.split('/')[0]!,b=to.split('/')[0]!;
			if(a===b)continue;
			crossRegionLinks++;
			const pair=[a,b].sort().join(':');if(pairs.has(pair))continue;pairs.add(pair);
			connections.push({id:pair,fromRegion:a,toRegion:b,fromMap:m.key,toMap:to,
				kind:['wood','light','dark'].some(id=>id===a||id===b)||[a,b].sort().join(':')==='ruins:void'?'portal':[a,b].sort().join(':')==='fungal:isles'?'sea-cave':'path',status:'existing'});
		}
	}
	const seen=new Set<string>(),queue:string[]=[];
	if(byKey.has(start)){queue.push(start);seen.add(start);}else errors.push('Không có map xuất phát '+start);
	for(let i=0;i<queue.length;i++)for(const exit of byKey.get(queue[i]!)!.exits){const to=mapDestination(queue[i]!,exit.to);if(byKey.has(to)&&!seen.has(to)){seen.add(to);queue.push(to);}}
	const unreachable=maps.map(m=>m.key).filter(key=>!seen.has(key));
	return {mapCount:maps.length,directedLinks,crossRegionLinks,connections,unreachable,errors};
}
