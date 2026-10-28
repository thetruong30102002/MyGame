// Dùng ảnh native nguyên bản; không resize, tái vẽ hoặc bật roster chưa đủ chuyển động trong game.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve('assets/player-integrated/source-art/wholecast-v18');
const source=JSON.parse(readFileSync(join(root,'roster.json'),'utf8'));
const roles=[
 {id:'sword',name:'Kiếm sĩ',weapon:'Kiếm',description:'Áp sát, đỡ phản và kết liễu. Ba phái: Kiếm Thần, Thủy Thần, Bắc Thần.'},
 {id:'staff',name:'Pháp sư',weapon:'Trượng',description:'Điều khiển phép thuật theo thiên phú. Tám nguyên tố, mỗi nguyên tố một bộ kỹ năng riêng.'},
 {id:'bow',name:'Cung thủ',weapon:'Cung',description:'Giữ khoảng cách, chọn vị trí và dồn sát thương vào thời điểm quyết định.'},
 {id:'spear',name:'Thương sĩ',weapon:'Thương',description:'Kiểm soát tầm trung, đâm xuyên và mở đường cho tổ đội.'},
 {id:'shield',name:'Vệ sĩ',weapon:'Khiên',description:'Đứng tuyến đầu, bảo vệ đồng đội và phản công khi đối phương sơ hở.'},
];
const directions=['S','SW','W','NW','N','NE','E','SE'];
const proofs:unknown[]=[];
const characters=source.characters.map((c:{id:string;label:string;role:string;gender:string})=>{
 const out=resolve('apps/server/site/media/roster',c.id);mkdirSync(out,{recursive:true});
 for(const d of directions){const from=join(root,'native',c.id,'idle-'+d+'.png'),to=join(out,d+'.png');copyFileSync(from,to);const hash=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');if(hash(from)!==hash(to))throw Error('Ảnh sai '+to);proofs.push({id:c.id,direction:d,sha256:hash(to)});}
 return {id:c.id,name:c.label,role:c.role,gender:c.gender,images:Object.fromEntries(directions.map(d=>[d,'site/media/roster/'+c.id+'/'+d+'.png']))};
});
if(characters.length!==30||roles.some(r=>['male','female'].some(g=>characters.filter((c:typeof characters[number])=>c.role===r.id&&c.gender===g).length!==3)))throw Error('Roster không đủ 3 nam + 3 nữ mỗi class');
writeFileSync(resolve('apps/server/site/roster.json'),JSON.stringify({version:18,status:'art-preview',notice:'Bộ tạo hình mới: 30 nhân vật, 5 class. Chuyển động và tích hợp chọn nhân vật đang hoàn thiện; hình giới thiệu chưa phải thông báo phát hành toàn bộ roster.',directions,roles,characters},null,2));
mkdirSync(resolve('.aether-stage/admin-react'),{recursive:true});writeFileSync(resolve('.aether-stage/admin-react/roster-proof.json'),JSON.stringify(proofs,null,2));
console.log('Xuất 30 nhân vật / 240 ảnh 112×112 nguyên bản, hash khớp nguồn.');
