/** Matching walk/run templates for the first two complete head+bare references. */
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadEnv} from '../packages/asset-pipeline/src/env.js';
import {PixelLabMcp} from '../packages/asset-pipeline/src/pixellab/mcp.js';
import {callWhenFree,waitCharacter} from '../packages/asset-pipeline/src/pixellab/jobs.js';
import {downloadPixelLab,PixelLabSource} from '../packages/asset-pipeline/src/pixellab/source.js';

const root='packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/bare-bases-v1';
const mcp=new PixelLabMcp(loadEnv(process.cwd()).PIXELLAB_TOKENS!.split(',')[0]!.trim());
const directions=['south','south-east','east','north-east','north'];
const specs=['m-human1','f-human1'].map(head=>({head,id:JSON.parse(readFileSync(join(root,`${head}-rotation-job.json`),'utf8')).id as string}));
for(const {head,id} of specs){
  for(const [action,template] of [['walk','walking-8-frames'],['run','running-8-frames']]){
    const path=join(root,`${head}-${action}-job.json`);
    if(existsSync(path))continue;
    const receipt=await callWhenFree(mcp,'animate_character',{
      character_id:id,animation_name:action,template_animation_id:template,
      directions,mode:'template',ai_freedom:0,
    });
    writeFileSync(path,JSON.stringify({id,action,template,directions,receipt},null,2));
    console.log('QUEUED',head,action);
  }
}
await Promise.all(specs.map(async ({head,id})=>{
  await waitCharacter(mcp,id);
  const name=`head-motion-${head}`;
  if(!existsSync(join(root,name,'metadata.json')))await downloadPixelLab(root,name,id);
  const source=new PixelLabSource(join(root,name));
  for(const d of ['S','SE','E','NE','N'] as const)for(const action of ['walk','run']){
    const count=source.animationFiles(action,d).length;
    if(count!==8)throw Error(`${head} ${d} ${action}=${count}`);
  }
  console.log('READY',head,'frame-matched 8-frame walk/run heads');
}));
