/** Two full reference avatars to validate separate head extraction in every direction. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from '../packages/asset-pipeline/src/env.js';
import { PixelLabMcp } from '../packages/asset-pipeline/src/pixellab/mcp.js';
import { callWhenFree, waitCharacter } from '../packages/asset-pipeline/src/pixellab/jobs.js';
import { downloadPixelLab, PixelLabSource } from '../packages/asset-pipeline/src/pixellab/source.js';

const root = 'packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/bare-bases-v1';
const mcp = new PixelLabMcp(loadEnv(process.cwd()).PIXELLAB_TOKENS!.split(',')[0]!.trim());
const pilots = [
  {id:'m-human1', sex:'male', description:'Same adult male as exact reference, chestnut short tousled hair, normal human ears and warm skin. Plain dark blue underwear briefs. Preserve exact 80px canvas, 73px height, skull size, short neck, body, original anime pixel clusters and pose across all 8 directions. No robe, collar, weapon or accessories.'},
  {id:'f-human1', sex:'female', description:'Same adult female as exact reference, warm brown short neat bob, normal human ears and warm skin. Plain dark blue modest two-piece bikini. Preserve exact 80px canvas, 71px height, skull size, short neck, body, original anime pixel clusters and pose across all 8 directions. No robe, collar, weapon or accessories.'},
];
for (const p of pilots) {
  const receiptPath = join(root, `${p.id}-rotation-job.json`);
  if (!existsSync(receiptPath)) {
    const receipt = await callWhenFree(mcp, 'create_character', {
      name:`Haven Lord modular ${p.id} pilot`, description:p.description, mode:'v3', n_directions:8,
      reference_image_base64:readFileSync(join(root, `${p.id}-bare-composite-pilot.png`)).toString('base64'),
    });
    const id=receipt.match(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/)?.[0];
    if(!id)throw Error(receipt);
    writeFileSync(receiptPath,JSON.stringify({id,description:p.description},null,2));
    console.log('QUEUED',p.id,id);
  }
}
await Promise.all(pilots.map(async p=>{
  const id=JSON.parse(readFileSync(join(root,`${p.id}-rotation-job.json`),'utf8')).id;
  await waitCharacter(mcp,id);
  const name=`head-rotation-${p.id}`;
  if(!existsSync(join(root,name,'metadata.json')))await downloadPixelLab(root,name,id);
  const src=new PixelLabSource(join(root,name));
  for(const d of ['S','SE','E','NE','N'] as const)if(!src.rotation(d))throw Error(`${p.id} missing ${d}`);
  console.log('READY',p.id,'reference avatars for head extraction');
}));
