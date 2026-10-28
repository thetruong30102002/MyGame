// Lưu ảnh sinh và prompt thực vào workspace, giữ nguyên nguồn trong CODEX_HOME.
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {readPng} from '../image/rgba.js';
const root=resolve(import.meta.dirname,'../../../..'),folder=join(root,'packages/asset-pipeline/sources/player-heads-v1'),batch=JSON.parse(readFileSync(resolve(root,process.argv[2]!),'utf8'));
for(const b of batch){if(!/^(human|elf|demon|beastfolk|dragonkin)-[mf]0[123]$/.test(b.id))throw Error('ID ngoài catalog');const dir=join(folder,'heads',b.id);mkdirSync(dir,{recursive:true});const dest=join(dir,'source.png');copyFileSync(b.path,dest);const im=readPng(dest);writeFileSync(join(dir,'generation.json'),JSON.stringify({mode:'built-in-imagegen',id:b.id,prompt:b.prompt,references:b.references,sourceSize:[im.width,im.height],sha256:createHash('sha256').update(readFileSync(dest)).digest('hex'),artApproved:false,productionEnabled:false},null,2));console.log(b.id+' '+im.width+'x'+im.height);}
