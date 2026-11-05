/** Shared male/female underwear movement. Five drawn directions; opposite three are mirrored at export. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from '../packages/asset-pipeline/src/env.js';
import { PixelLabMcp } from '../packages/asset-pipeline/src/pixellab/mcp.js';
import { callWhenFree, waitCharacter } from '../packages/asset-pipeline/src/pixellab/jobs.js';
import { downloadPixelLab, PixelLabSource } from '../packages/asset-pipeline/src/pixellab/source.js';

const root = 'packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/bare-bases-v1';
const mcp = new PixelLabMcp(loadEnv(process.cwd()).PIXELLAB_TOKENS!.split(',')[0]!.trim());
const directions = ['south', 'south-east', 'east', 'north-east', 'north'];
const jobs = ['male', 'female'].map(sex => ({sex, id: JSON.parse(readFileSync(join(root, sex, 'rotation-job.json'), 'utf8')).id as string}));
for (const {sex,id} of jobs) {
  for (const [action, template] of [['walk','walking-8-frames'], ['run','running-8-frames']]) {
    const receiptPath = join(root, sex, `${action}-job.json`);
    if (existsSync(receiptPath)) continue;
    const receipt = await callWhenFree(mcp, 'animate_character', {
      character_id: id, animation_name: action, template_animation_id: template,
      directions, mode: 'template', ai_freedom: 0,
    });
    writeFileSync(receiptPath, JSON.stringify({id, action, template, directions, receipt}, null, 2));
    console.log('QUEUED', sex, action);
  }
}
await Promise.all(jobs.map(async ({sex,id}) => {
  await waitCharacter(mcp, id);
  const name = `motion-${sex}`;
  if (!existsSync(join(root, name, 'metadata.json'))) await downloadPixelLab(root, name, id);
  const src = new PixelLabSource(join(root,name));
  for (const direction of ['S','SE','E','NE','N'] as const) for (const action of ['walk','run']) {
    const count = src.animationFiles(action, direction).length;
    if (count !== 8) throw Error(`${sex} ${direction} ${action} has ${count} frames`);
  }
  console.log('READY', sex, 'walk/run 8 frames in 5 drawn directions');
}));
