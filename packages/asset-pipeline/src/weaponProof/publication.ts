// Trang chính chỉ dùng ảnh đối chiếu đã khóa; bản sinh mới không tự được xuất lên.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
type PinnedFile={path:string;sha256:string};
export function assertReferenceManifest(manifest:{publication?:{mode?:string};motionFamily?:unknown;attackRevision?:unknown;frames:{id:string}[]}){
 const expected=['S','SW','W','NW','N','NE','E','SE'].map(d=>'idle-'+d),ids=manifest.frames.map(f=>f.id);
 if(manifest.publication?.mode!=='reference-only'||manifest.motionFamily||manifest.attackRevision||ids.length!==8||expected.some(id=>!ids.includes(id)))throw Error('Trang chính chỉ được xuất tám ảnh đứng gốc để đối chiếu; bản nháp/chuyển động chưa đạt không được tự xuất.');
}
export function assertPinnedBytes(file:PinnedFile,bytes:Uint8Array){if(createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('Ảnh đối chiếu đã đổi, dừng xuất trang: '+file.path);}
export function publishedReference(source:string,stage:string){
 const snapshot=JSON.parse(readFileSync(join(source,'approved-v2-reference.json'),'utf8'));
 assertReferenceManifest(snapshot.manifest);
 const required=snapshot.manifest.frames.flatMap((f:{id:string})=>['body/','hands/','reference/','weapon/steel/','weapon/iron/','weapon/tu-yen/','weapon-back/tu-yen/'].map(p=>p+f.id+'.png'));
 if(snapshot.files.length!==required.length||required.some((path:string)=>!snapshot.files.some((f:PinnedFile)=>f.path===path)))throw Error('Thiếu dấu kiểm ảnh đối chiếu; dừng xuất trang.');
 for(const f of snapshot.files as PinnedFile[])assertPinnedBytes(f,readFileSync(join(stage,f.path)));
 return snapshot.manifest;
}
