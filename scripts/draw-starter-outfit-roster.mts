/** Bảng 10 bộ đứng để duyệt: 7 edit PixelLab, 2 NPC giữ nguyên, 1 Kiếm sĩ đã có. Không web/game build. */
import{readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';
import{loadEnv}from'../packages/asset-pipeline/src/env.js';import{PixelLabMcp}from'../packages/asset-pipeline/src/pixellab/mcp.js';import{waitImages}from'../packages/asset-pipeline/src/pixellab/jobs.js';import{writePng}from'../packages/asset-pipeline/src/image/rgba.js';
const out='packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/roster-standing-v1';mkdirSync(out,{recursive:true});
const ref=(sex:string)=>`packages/asset-pipeline/sources/pixellab/npc_silver_youth${sex==='female'?'_f':''}/Idle/rotations/south.png`;
const roles=[
 ['sword','Kiếm sĩ','slate-blue fitted tunic, small steel chest plate and shoulder guards, brown leather belt and straps, split short tassets, charcoal trousers, bracers and boots'],
 ['staff','Pháp sư','NPC source unchanged'],
 ['spear','Thương thủ','burgundy split warcoat to mid-thigh, modest steel collar and narrow shoulder guards, leather belt, long bracers, charcoal trousers, knee guards and boots'],
 ['bow','Cung thủ','moss-green short ranger mantle with hood folded behind neck, fitted brown leather vest, diagonal straps, belt pouches, dark olive trousers, long bracers and boots'],
 ['shield','Khiên thủ','sturdy matte iron breastplate, medium rounded shoulder guards, navy padded sleeves, short layered steel tassets, brown belt, charcoal trousers, gauntlets, greaves and boots']
];
const m=new PixelLabMcp(loadEnv(process.cwd()).PIXELLAB_TOKENS!.split(',')[0]!.trim()),before=await m.call('get_balance'),jobs:any[]=[],entries:any[]=[];
for(const[role,label,design]of roles)for(const sex of ['male','female']){
 const id=role+'-'+sex,dir=join(out,id),file=join(dir,'S.png');mkdirSync(dir,{recursive:true});
 if(role==='staff'){copyFileSync(ref(sex),file);entries.push({id,label,sex,file:id+'/S.png',source:ref(sex),method:'original NPC outfit, unchanged',approvedDesignByUser:true});continue;}
 if(id==='sword-male'){const source='packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/sword-male-pilot-covered/sword-male-S.png';copyFileSync(source,file);entries.push({id,label,sex,file:id+'/S.png',source,method:'existing PixelLab standing pilot',artApproved:false});continue;}
 const silhouette=sex==='female'?'Feminine athletic build, slightly fuller limbs and hips, modest fitted waist; not bulky.':'Athletic build, slightly fuller shoulders, arms and legs; not bulky.';
 const description=`Change ONLY outfit: ${design}. ${silhouette} Fully covered arms/legs, gloves; no skin gaps. Keep exact head, hair, face, height, feet, pose and crisp pixel clusters. Clear cloth seams, leather edges, steel highlights. No weapons, glow, crown.`;
 if(description.length>500)throw Error(id+' prompt '+description.length+' > 500');
 const input=readFileSync(ref(sex)),args={description,image_base64:input.toString('base64'),width:80,height:80,no_background:true,seed:73200+entries.length};
 writeFileSync(join(dir,'request.json'),JSON.stringify({...args,image_base64:'<'+ref(sex)+'>',referenceSha256:createHash('sha256').update(input).digest('hex'),previewOnly:true,artApproved:false},null,2));
 let jobId:string;if(existsSync(join(dir,'receipt.json')))jobId=JSON.parse(readFileSync(join(dir,'receipt.json'),'utf8')).jobId;
 else{const receipt=await m.call('edit_image_pixen',args),idMatch=receipt.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];if(!idMatch)throw Error(receipt);jobId=idMatch;writeFileSync(join(dir,'receipt.json'),JSON.stringify({jobId,receipt},null,2));console.log('QUEUED '+id+' '+jobId);}
 entries.push({id,label,sex,file:id+'/S.png',source:ref(sex),method:'PixelLab edit_image_pixen',artApproved:false,jobId});if(!existsSync(join(dir,'complete.json')))jobs.push({id,dir,file,jobId});
}
writeFileSync(join(out,'manifest.json'),JSON.stringify({entries,balanceBefore:before,scope:'10 front standing outfit designs only, no animation or game build',heads:'NPC identity retained solely in full reference image. No runtime avatar overpainting. Remove old head before exporting any body layer.',weapons:'Separate later; not baked into outfit.',attack:'paused by user',artApproved:false},null,2));
await Promise.all(jobs.map(async j=>{const[im]=await waitImages(m,j.jobId,1,{w:80,h:80});writePng(j.file,im!);writeFileSync(join(j.dir,'complete.json'),JSON.stringify({jobId:j.jobId,frames:1},null,2));console.log('COMPLETE '+j.id);}));
writeFileSync(join(out,'complete.json'),JSON.stringify({entries:entries.length,newEditJobs:jobs.length,balanceAfter:await m.call('get_balance'),artApproved:false},null,2));console.log('READY ten standing designs, no web or game build.');
