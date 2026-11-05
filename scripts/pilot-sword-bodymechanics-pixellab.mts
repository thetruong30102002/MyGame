/** Thử mới bằng mô tả chuyển động toàn thân, KHÔNG truyền khung xương cũ. */
import{readFileSync,writeFileSync,mkdirSync,existsSync}from'node:fs';
import{join}from'node:path';
import{loadEnv}from'../packages/asset-pipeline/src/env.js';
import{PixelLabMcp}from'../packages/asset-pipeline/src/pixellab/mcp.js';
import{waitImages}from'../packages/asset-pipeline/src/pixellab/jobs.js';
import{writePng}from'../packages/asset-pipeline/src/image/rgba.js';
const out='packages/asset-pipeline/sources/layered-character/mau-1/sword-bodymechanics-20261103';mkdirSync(out,{recursive:true});
const ref='apps/server/site/media/layered/diagonal-sword-pilot-20261103/attack-00-full.png';
const action='ONE realistic one-handed diagonal sword cut, then recover. Same crisp pixels, body volume and limb lengths; fixed camera and scale. Ready: staggered feet, soft knees. Windup slowly: weight onto rear leg, hips/chest coil; raise fist above weapon-side shoulder, elbow naturally bent below fist, clear of head. Drive a short forward step and hip/chest turn; transfer weight onto planted leading foot, knees flex slightly, rear heel pivots. Cut FAST through space IN FRONT, from high weapon-side shoulder across target to low opposite hip/thigh. Shoulder, elbow and hand follow one continuous arc. Firm closed grip below guard, pommel beyond palm; sword stays attached to fist, wrist near neutral, no sideways wrist kink. Free arm counterbalances, never grips sword. Controlled follow-through and return to guard. More time preparing/recovering, only a few fast strike frames. No squat, foot slide, rubber elbows, inflated torso, neck gap, blur, trails, spin, second hit or two-handed grip.';
if(action.length>1000)throw Error('Prompt vượt giới hạn');
const args={action,frame_count:16,first_frame_base64:readFileSync(ref).toString('base64'),no_background:true,seed:73144};
writeFileSync(join(out,'request.json'),JSON.stringify({...args,first_frame_base64:'<'+ref+'>',method:'Text motion, no skeleton input; generated with visible sword for grip review. Separate weapon extraction pending art approval.',previewOnly:true,buildAllowed:false},null,2));
const m=new PixelLabMcp(loadEnv(process.cwd()).PIXELLAB_TOKENS!.split(',')[0]!.trim());
let jobId:string;if(existsSync(join(out,'receipt.json')))jobId=JSON.parse(readFileSync(join(out,'receipt.json'),'utf8')).jobId;
else{const before=await m.call('get_balance'),receipt=await m.call('animate_image',args),id=receipt.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];if(!id)throw Error(receipt);jobId=id;writeFileSync(join(out,'receipt.json'),JSON.stringify({jobId,balanceBefore:before,receipt},null,2));console.log('QUEUED '+jobId+'; one new full-body motion, no old skeleton.');}
if(!existsSync(join(out,'complete.json'))){const ims=await waitImages(m,jobId,17);ims.forEach((im,i)=>writePng(join(out,`frame-${String(i).padStart(2,'0')}.png`),im));writeFileSync(join(out,'complete.json'),JSON.stringify({jobId,frames:ims.length,dimensions:ims.map(i=>[i.width,i.height]),balanceAfter:await m.call('get_balance')},null,2));}
console.log('COMPLETE; preview only, weapon extraction not approved.');
