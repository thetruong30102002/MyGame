import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {root,out,source} from '../src/weaponProof/reference.js';
import {createImage,readPng,getPixel,blit} from '../src/image/rgba.js';
const m=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8')),asset=JSON.parse(readFileSync(join(source,'tu-yen/asset.json'),'utf8'));
const approved=JSON.parse(readFileSync(join(source,'approval.json'),'utf8'));
// Mẫu mới không được ghi đè nghiệm thu V2 cũ; giữ các ảnh cũ để so/lùi lại.
if(m.motionFamily)for(const a of approved.bodyFrames){assert.equal(createHash('sha256').update(readPng(join(out,'body',a.id+'.png')).data).digest('hex'),a.bodySha256);assert.equal(createHash('sha256').update(readFileSync(join(out,'hands',a.id+'.png'))).digest('hex'),a.handsFileSha256);}
assert.equal(m.defaultWeapon,'tu-yen');assert.equal(asset.ownerId,'player_sword_f03');assert.equal(asset.scale,1);assert.equal(asset.hairSeparated,false);
assert.equal(createHash('sha256').update(readFileSync(join(root,asset.source))).digest('hex'),asset.sourceSha256);
const native=readPng(join(source,'tu-yen/native-sword.png'));let purple=0;
for(let i=0;i<native.data.length;i+=4){const[r,g,b,a]=native.data.subarray(i,i+4);if(!a)continue;assert(!(r!>150&&g!>95&&b!>65&&b!/g!>.48&&r!>g!*1.1),'Không được lấy da/ngón tay của Tử Yên vào asset kiếm');if(b!>g!*1.3&&r!>g!*1.2)purple++;}
assert(purple>2,'Thiếu điểm tím nhận diện hộ thủ Tử Yên');
for(const f of m.frames){const body=readPng(join(out,'body',f.id+'.png')),hands=readPng(join(out,'hands',f.id+'.png')),back=readPng(join(out,'weapon-back/tu-yen',f.id+'.png')),front=readPng(join(out,'weapon/tu-yen',f.id+'.png')),saved=readPng(join(out,'composite/tu-yen',f.id+'.png')),made=createImage(144,144);
 assert.equal(createHash('sha256').update(body.data).digest('hex'),f.bodySha256,f.id+': ghép kiếm làm đổi thân/tóc');
 const accepted=approved.bodyFrames.find((a:{id:string})=>a.id===f.id);if(m.motionFamily){assert.equal(m.motionFamily.userApproved,false);}else if(!f.id.startsWith('attack-')){assert(accepted,f.id+': thiếu frame V2 đã chốt');assert.equal(f.bodySha256,accepted.bodySha256,f.id+': đổi thân V2 đã chốt');assert.equal(createHash('sha256').update(readFileSync(join(out,'hands',f.id+'.png'))).digest('hex'),accepted.handsFileSha256,f.id+': đổi tay V2 đã chốt');}else{assert.equal(m.attackRevision?.status,'pending-visual-review');assert.equal(m.attackRevision?.userApproved,false);}
 for(const img of [back,body,front,hands])blit(made,img,0,0);assert.deepEqual(made.data,saved.data,f.id+': bản ghép không đúng các lớp');
 for(let y=0;y<144;y++)for(let x=0;x<144;x++){const h=getPixel(hands,x,y),c=getPixel(saved,x,y);if(h[3])assert.deepEqual(c,h,f.id+': chuôi đè ngón tay');if(x===0||x===143||y===0||y===143)assert.equal(c[3],0,f.id+': kiếm cắt mép');}
 if(!f.hidden&&Math.abs(f.axis[0])>.1){let sum=0,count=0;for(let y=0;y<144;y++)for(let x=0;x<144;x++){const c=getPixel(back,x,y),dx=x-f.grip[0],dy=y-f.grip[1],t=dx*f.axis[0]+dy*f.axis[1];if(c[3]&&t>=24){sum+=-dx*f.axis[1]+dy*f.axis[0];count++;}}assert(count>0,f.id+': mất mũi kiếm');assert(sum/count*f.axis[0]<0,f.id+': lưỡi cong xuống thay vì cong lên');}
}
const report={checkedAt:new Date().toISOString(),weapon:'Kiếm Tử Yên',donor:asset.ownerId,frames:m.frames.length,nativePurplePixels:purple,swapDoesNotRedrawBody:true,handsPreserved:true,candidateFamily:m.motionFamily?.id,candidateApproved:false,productionEnabled:false};writeFileSync(join(out,'tu-yen-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
