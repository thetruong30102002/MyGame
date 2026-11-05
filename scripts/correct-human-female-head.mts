/** One-at-a-time correction of rejected human female front designs. */
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadEnv} from '../packages/asset-pipeline/src/env.js';
import {PixelLabMcp} from '../packages/asset-pipeline/src/pixellab/mcp.js';
import {callWhenFree,waitImages} from '../packages/asset-pipeline/src/pixellab/jobs.js';
import {writePng} from '../packages/asset-pipeline/src/image/rgba.js';

const id=process.argv[2];
const hair:Record<string,string>={
  'f-human2':'black short low ponytail tied at the nape, loose natural bangs',
  'f-human3':'copper brown shoulder-length side braid, soft side-swept bangs',
};
if(!id||!hair[id])throw Error('Pass f-human2 or f-human3');
const root='packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/bare-bases-v1';
const dir=join(root,'human-female-corrections',id);mkdirSync(dir,{recursive:true});
const source=join(root,'f-human1-bare-composite-pilot.png');
const description=`Change ONLY hairstyle to ${hair[id]}. Human woman with normal small rounded human ears, NO horns, NO animal ears. Same exact face, eye and chin positions, skull size, short neck, skin palette, body, modest blue bikini, 71px height, foot position and straight-on pose as reference. Original crisp 80x80 anime pixel art. No robe, armor, accessories or weapon.`;
if(description.length>500)throw Error('Prompt too long');
const receiptPath=join(dir,'correction-job.json'),target=join(dir,'S.png');
const mcp=new PixelLabMcp(loadEnv(process.cwd()).PIXELLAB_TOKENS!.split(',')[0]!.trim());
if(!existsSync(receiptPath)){
  const receipt=await callWhenFree(mcp,'edit_image_pixen',{description,image_base64:readFileSync(source).toString('base64'),width:80,height:80,no_background:true,seed:id==='f-human2'?74202:74203});
  const jobId=receipt.match(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/)?.[0];
  if(!jobId)throw Error(receipt);
  writeFileSync(receiptPath,JSON.stringify({jobId,description,source},null,2));console.log('QUEUED',id,jobId);
}
if(!existsSync(target)){
  const {jobId}=JSON.parse(readFileSync(receiptPath,'utf8'));
  const [im]=await waitImages(mcp,jobId,1,{w:80,h:80});writePng(target,im!);
}
console.log('READY',id,'front correction draft; inspect before roster inclusion');
