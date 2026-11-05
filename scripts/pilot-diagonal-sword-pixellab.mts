/** Một lượt PixelLab,15 frame, chỉ xem thử. Không thay nguồn/bản game hiện hành. */
import{readFileSync,writeFileSync,mkdirSync,existsSync}from'node:fs';import{join}from'node:path';
import{loadEnv}from'../packages/asset-pipeline/src/env.js';import{PixelLabMcp}from'../packages/asset-pipeline/src/pixellab/mcp.js';import{waitImages}from'../packages/asset-pipeline/src/pixellab/jobs.js';import{buildSlash}from'../packages/asset-pipeline/src/layered/slashSkeleton.js';import{writePng}from'../packages/asset-pipeline/src/image/rgba.js';
const base='packages/asset-pipeline/sources/layered-character/mau-1',out=join(base,'diagonal-sword-pilot-20261103');mkdirSync(out,{recursive:true});
const ref='Q0-outfit-bald-N/seed-5732.png',rest=JSON.parse(readFileSync(join(base,'skeleton/rest-Q0-outfit-bald-N-5732.json'),'utf8'));
// Bên phải là bên giải phẫu của nhân vật nguồn, không phải luật trái/phải runtime. Khi lật, toàn bộ pose + kiếm cùng lật.
const rows=[
 [80,72,-30,0,0,0,0,140],[81,59,15,0,0,0,0,140],[82,46,55,0,0,0,0,145],
 [80,35,70,0,0,0,0,145],[78,30,65,0,0,0,0,145],[78,30,65,0,0,0,0,145],
 [80,35,40,-1,0,-1,0,125],[77,46,-5,-2,1,-3,-1,95],[66,59,-65,-3,1,-4,-1,80],
 [55,66,-110,-3,1,-4,-1,80],[55,66,-110,-3,1,-4,-1,80],
 [59,67,-100,-2,1,-3,-1,90],[67,69,-75,-1,0,-2,0,110],[76,71,-45,0,0,-1,0,130],[80,72,-30,0,0,0,0,140]
];
const durations=[75,80,90,105,125,75,35,25,30,55,65,70,80,85,90];
const spec:any={direction:'north',pad:[0,0,0,0],handGapPx:0,knees:'depth',stance:'lunge',frames:rows.map((r,i)=>({grip:[r[0],r[1]],bladeDeg:r[2],lean:r[3],hip:[0,r[4]],step:0,back:0,stepY:r[5],backY:r[6],wristL:[46-(i>=6&&i<=11?1:0),72],depthR:r[7],depthL:145,behind:i>=7&&i<=11}))};
const frames=buildSlash(spec,rest.keypoints,[128,128]);
const description='A slim bald young man seen from the back, fitted plain brown leather vest, ivory linen long sleeves, brown belt, narrow dark brown trousers, short brown gloves and brown boots. Both hands are empty closed fists. Exact reference proportions, same short neck, thin dark outline and crisp native pixel clusters, same outfit and colours.';
const args={description,action:'one empty-handed diagonal arm sweep',direction:'north',view:'low top-down',no_background:true,seed:73113,first_frame_base64:readFileSync(join(base,'raw',ref)).toString('base64'),first_frame_keypoints:rest.keypoints.map((k:any)=>({...k,z_index:Math.round(k.z_index)})),keypoints:frames.map(f=>f.keypoints)};
writeFileSync(join(out,'request.json'),JSON.stringify({...args,first_frame_base64:'<raw/'+ref+'>'},null,2));writeFileSync(join(out,'motion.json'),JSON.stringify({description:'Một tay: góc cao phía vai cầm kiếm → chân bên tay không cầm kiếm; một nhát, không bổ dọc; tay kia không chạm chuôi.',direction:'N',reference:ref,frames:frames.map((f,i)=>({...f,ms:durations[i]})),source:'PixelLab animate_with_skeleton_v3',previewOnly:true,buildAllowed:false},null,2));
const env=loadEnv(process.cwd()),token=env.PIXELLAB_TOKENS?.split(',')[0]?.trim();if(!token)throw Error('Chưa có cấu hình PixelLab');const m=new PixelLabMcp(token);let jobId:string;
if(existsSync(join(out,'receipt.json'))){jobId=JSON.parse(readFileSync(join(out,'receipt.json'),'utf8')).jobId;console.log('Resume existing job '+jobId);}
else{const balance=await m.call('get_balance');const receipt=await m.call('animate_with_skeleton_v3',args);const id=receipt.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];if(!id)throw Error(receipt);jobId=id;writeFileSync(join(out,'receipt.json'),JSON.stringify({jobId,balanceBefore:balance,receipt},null,2));console.log('QUEUED '+jobId+' (one15-frame pilot, no retries)');}
if(!existsSync(join(out,'complete.json'))){const images=await waitImages(m,jobId,15,{w:128,h:128});images.forEach((im,i)=>writePng(join(out,'frame-'+String(i).padStart(2,'0')+'.png'),im));writeFileSync(join(out,'complete.json'),JSON.stringify({jobId,frames:images.length,balanceAfter:await m.call('get_balance')},null,2));}console.log('COMPLETE:15 PixelLab frames saved; no build.');
