/** Reference-led eight-direction rotation of the two accepted-size bare base drafts. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from '../packages/asset-pipeline/src/env.js';
import { PixelLabMcp } from '../packages/asset-pipeline/src/pixellab/mcp.js';
import { callWhenFree, waitCharacter } from '../packages/asset-pipeline/src/pixellab/jobs.js';
import { downloadPixelLab, PixelLabSource } from '../packages/asset-pipeline/src/pixellab/source.js';

const root = 'packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/bare-bases-v1';
const mcp = new PixelLabMcp(loadEnv(process.cwd()).PIXELLAB_TOKENS!.split(',')[0]!.trim());
const jobs: { sex: string; id: string }[] = [];
for (const sex of ['male', 'female']) {
  const folder = join(root, sex);
  const receiptPath = join(folder, 'rotation-job.json');
  if (!existsSync(receiptPath)) {
    const description = sex === 'male'
      ? 'Same adult male bald base as reference. Plain dark-blue modest underwear briefs. Bare chest, arms, legs and feet. Same 73px height, head size, shoulder width, short neck, skin tone and anime pixel style in all 8 directions. No hair, robe, weapons, accessories or shadows.'
      : 'Same adult female bald base as reference. Plain dark-blue modest two-piece bikini with simple shoulder straps and briefs. Bare arms, legs and feet. Same 71px height, head size, short neck, body width, skin tone and anime pixel style in all 8 directions. No hair, robe, weapons, accessories or shadows.';
    const receipt = await callWhenFree(mcp, 'create_character', {
      name: `Haven Lord 80px bare ${sex} modular reference`, description,
      mode: 'v3', n_directions: 8,
      reference_image_base64: readFileSync(join(folder, 'S.png')).toString('base64'),
    });
    const id = receipt.match(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/)?.[0];
    if (!id) throw Error(receipt);
    writeFileSync(receiptPath, JSON.stringify({ id, description }, null, 2));
    console.log('QUEUED', sex, id);
  }
  jobs.push({ sex, id: JSON.parse(readFileSync(receiptPath, 'utf8')).id });
}
await Promise.all(jobs.map(async ({ sex, id }) => {
  await waitCharacter(mcp, id);
  const name = `rotation-${sex}`;
  if (!existsSync(join(root, name, 'metadata.json'))) await downloadPixelLab(root, name, id);
  const src = new PixelLabSource(join(root, name));
  for (const dir of ['S', 'SE', 'E', 'NE', 'N'] as const) {
    if (!src.rotation(dir)) throw Error(`${sex} missing ${dir}`);
  }
  console.log('READY', sex, '5 original directions + 3 mirrored directions');
}));
