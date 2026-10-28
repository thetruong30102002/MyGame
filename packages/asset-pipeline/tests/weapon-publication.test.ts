// Không tự đưa lại R4 hoặc ảnh đã đổi lên trang chính khi dựng preview.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {publishedReference,assertReferenceManifest,assertPinnedBytes} from '../src/weaponProof/publication.js';
const root=resolve(import.meta.dirname,'../../..'),source=join(root,'packages/asset-pipeline/sources/player-weapon-proof-v2'),stage=join(root,'.aether-stage/weapon-proof-v2');
const m=publishedReference(source,stage),snapshot=JSON.parse(readFileSync(join(source,'approved-v2-reference.json'),'utf8'));
assert.equal(m.frames.length,8);assert(m.frames.every((f:{id:string})=>f.id.startsWith('idle-')));assert.equal(m.productionEnabled,false);
const withAttack=structuredClone(m);withAttack.frames.push({id:'attack-S-0'});assert.throws(()=>assertReferenceManifest(withAttack),/chưa đạt/);
const withR4=structuredClone(m);withR4.motionFamily={id:'family-r4'};assert.throws(()=>assertReferenceManifest(withR4),/chưa đạt/);
const file=snapshot.files[0],bytes=readFileSync(join(stage,file.path)),changed=Buffer.from(bytes);changed[changed.length-1]=changed[changed.length-1]!^1;assert.throws(()=>assertPinnedBytes(file,changed),/Ảnh đối chiếu đã đổi/);
console.log(JSON.stringify({publishedFrames:8,visibleActions:['idle'],rejectedR4Blocked:true,attackBlocked:true,changedImageBlocked:true,pinnedFiles:snapshot.files.length}));
