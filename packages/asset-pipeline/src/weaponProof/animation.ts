// Gói ảnh động APNG để rà frame nguồn; không vẽ/suy diễn thêm cơ thể.
import {writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {deflateSync} from 'node:zlib';
import {createImage,readPng,blit,scaleNearest,type RGBAImage} from '../image/rgba.js';
const out=resolve(import.meta.dirname,'../../../../.aether-stage/weapon-proof-v1');
function crc(data:Buffer){let c=0xffffffff;for(const b of data){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type:string,data:Buffer){const t=Buffer.from(type),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc(Buffer.concat([t,data])));return Buffer.concat([head,t,data,tail]);}
function encoded(img:RGBAImage){const bytes=Buffer.alloc((img.width*4+1)*img.height);for(let y=0;y<img.height;y++)Buffer.from(img.data.subarray(y*img.width*4,(y+1)*img.width*4)).copy(bytes,y*(img.width*4+1)+1);return deflateSync(bytes);}
function save(name:string,ids:string[],delays:number[]){const imgs=ids.map(id=>{const p=createImage(144*2,144);blit(p,readPng(join(out,'composite','steel',id+'.png')),0,0);blit(p,readPng(join(out,'composite','iron',id+'.png')),144,0);return scaleNearest(p,2);});const head=Buffer.alloc(13),act=Buffer.alloc(8);head.writeUInt32BE(imgs[0]!.width,0);head.writeUInt32BE(imgs[0]!.height,4);head[8]=8;head[9]=6;act.writeUInt32BE(imgs.length);const parts=[Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('acTL',act)];let seq=0;for(let i=0;i<imgs.length;i++){const img=imgs[i]!,fc=Buffer.alloc(26);fc.writeUInt32BE(seq++,0);fc.writeUInt32BE(img.width,4);fc.writeUInt32BE(img.height,8);fc.writeUInt16BE(delays[i]!,20);fc.writeUInt16BE(1000,22);parts.push(chunk('fcTL',fc));const z=encoded(img);if(i===0)parts.push(chunk('IDAT',z));else{const s=Buffer.alloc(4);s.writeUInt32BE(seq++);parts.push(chunk('fdAT',Buffer.concat([s,z])));}}parts.push(chunk('IEND',Buffer.alloc(0)));writeFileSync(join(out,name+'.png'),Buffer.concat(parts));}
save('turnaround-two-swords',['S','SW','W','NW','N','NE','E','SE'].map(d=>'idle-'+d),Array(8).fill(500));
save('walk-two-swords',Array.from({length:8},(_,i)=>'walk-E-'+i),Array(8).fill(125));
save('attack-two-swords',Array.from({length:13},(_,i)=>'attack-S-'+i),[130,110,110,130,70,70,70,70,70,70,80,130,180]);
console.log('Đã xuất APNG quay tám hướng, đi E và bổ S; chỉ là ảnh rà mẫu, chưa nghiệm thu.');
