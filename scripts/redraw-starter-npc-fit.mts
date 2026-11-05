import{readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync}from'node:fs';import{join}from'node:path';import{createHash}from'node:crypto';
import{loadEnv}from'../packages/asset-pipeline/src/env.js';import{PixelLabMcp}from'../packages/asset-pipeline/src/pixellab/mcp.js';import{waitImages}from'../packages/asset-pipeline/src/pixellab/jobs.js';import{writePng}from'../packages/asset-pipeline/src/image/rgba.js';
const out='packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/roster-npc-fit-v2';mkdirSync(out,{recursive:true});
const ref=(sex:string)=>`packages/asset-pipeline/sources/pixellab/npc_silver_youth${sex==='female'?'_f':''}/Idle/rotations/south.png`;
const roles=[
 ['sword','Kiếm sĩ','short fitted midnight-blue duelist coat, pale cross-body sash, narrow steel bracers, tidy leather belt, split coat tails, fitted trousers and boots'],
 ['shield','Khiên thủ','fitted charcoal tabard with muted bronze edging, flat dark steel chest panel, snug leather gauntlets, sturdy boots and small shin guards']
];
const m=new PixelLabMcp(loadEnv(process.cwd()).PIXELLAB_TOKENS!.split(',')[0]!.trim()),before=await m.call('get_balance'),jobs:any[]=[],entries:any[]=[];
for(const[role,label,design]of roles)for(const sex of ['male','female']){
 const id=role+'-'+sex,dir=join(out,id),file=join(dir,'S.png');mkdirSync(dir,{recursive:true});
 const description=`Edit outfit only: ${design}. Long sleeves and trousers. Keep original NPC height, body width, slim proportions, shoulders, head, hair, face, stance and foot placement. Armor lies flush, no bulky shoulder pads. Match original crisp pixel art and contrast. No weapons or glow.`;
 if(description.length>500)throw Error(id+' prompt '+description.length+' > 500');
 const input=readFileSync(ref(sex)),args={description,image_base64:input.toString('base64'),width:80,height:80,no_background:true,seed:73300+entries.length};
 writeFileSync(join(dir,'request.json'),JSON.stringify({...args,image_base64:'<'+ref(sex)+'>',referenceSha256:createHash('sha256').update(input).digest('hex'),previewOnly:true,artApproved:false},null,2));
 let jobId:string;if(existsSync(join(dir,'receipt.json')))jobId=JSON.parse(readFileSync(join(dir,'receipt.json'),'utf8')).jobId;
 else{const receipt=await m.call('edit_image_pixen',args),idMatch=receipt.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];if(!idMatch)throw Error(receipt);jobId=idMatch;writeFileSync(join(dir,'receipt.json'),JSON.stringify({jobId,receipt},null,2));console.log('QUEUED '+id+' '+jobId);}
 entries.push({id,label,sex,file:id+'/S.png',source:ref(sex),method:'PixelLab edit_image_pixen',artApproved:false,jobId});if(!existsSync(join(dir,'complete.json')))jobs.push({id,dir,file,jobId});
}
writeFileSync(join(out,'manifest.json'),JSON.stringify({entries,balanceBefore:before,scope:'4 front standing outfit designs only, no animation or game build',heads:'NPC identity retained solely in full reference image. No runtime avatar overpainting. Remove old head before exporting any body layer.',weapons:'Separate later; not baked into outfit.',attack:'paused by user',artApproved:false},null,2));
await Promise.all(jobs.map(async j=>{const[im]=await waitImages(m,j.jobId,1,{w:80,h:80});writePng(j.file,im!);writeFileSync(join(j.dir,'complete.json'),JSON.stringify({jobId:j.jobId,frames:1},null,2));console.log('COMPLETE '+j.id);}));
writeFileSync(join(out,'complete.json'),JSON.stringify({entries:entries.length,newEditJobs:jobs.length,balanceAfter:await m.call('get_balance'),artApproved:false},null,2));console.log('READY four standing designs, no web or game build.');
