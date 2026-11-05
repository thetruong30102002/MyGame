/** Two underwear base poses from the exact 80x80 NPC references. No outfit or head is exported from these as a finished game layer. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from '../packages/asset-pipeline/src/env.js';
import { PixelLabMcp } from '../packages/asset-pipeline/src/pixellab/mcp.js';
import { callWhenFree, waitImages } from '../packages/asset-pipeline/src/pixellab/jobs.js';
import { writePng } from '../packages/asset-pipeline/src/image/rgba.js';

const out = 'packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/bare-bases-v1';
const root = 'packages/asset-pipeline/sources/pixellab';
const mcp = new PixelLabMcp(loadEnv(process.cwd()).PIXELLAB_TOKENS!.split(',')[0]!.trim());
const specs = [
  {
    sex: 'male', source: join(root, 'npc_silver_youth/Idle/rotations/south.png'),
    description: 'Edit this adult male NPC into a clean bald base body. Plain dark blue modest underwear briefs, bare upper torso, arms and legs, bare feet. Remove all hair, robe, armor, sleeves, collar, gloves, belt and boots completely. Keep the SAME face, head size, short natural neck, shoulders, body width, height, foot position, camera and pose. Crisp detailed anime pixel art, original 80x80 transparent canvas. No extra clothes, necklace, weapons or shadow.',
  },
  {
    sex: 'female', source: join(root, 'npc_silver_youth_f/Idle/rotations/south.png'),
    description: 'Edit this adult female NPC into a clean bald base body. Modest plain dark blue two-piece bikini: simple shoulder-strap top and briefs. Bare arms, legs and feet. Remove all hair, robe, armor, collar, gloves, belt and boots completely. Keep the SAME face, head size, short natural neck, shoulders, body width, height, foot position, camera and pose. Crisp detailed anime pixel art, original 80x80 transparent canvas. No extra clothes, necklace, weapons or shadow.',
  },
] as const;
const pending: Promise<void>[] = [];
for (const [index, spec] of specs.entries()) {
  const dir = join(out, spec.sex);
  const receiptPath = join(dir, 'job.json');
  const target = join(dir, 'S.png');
  mkdirSync(dir, { recursive: true });
  if (spec.description.length > 500) throw Error('Prompt too long');
  if (!existsSync(receiptPath)) {
    const receipt = await callWhenFree(mcp, 'edit_image_pixen', {
      description: spec.description, image_base64: readFileSync(spec.source).toString('base64'),
      width: 80, height: 80, no_background: true, seed: 74150 + index,
    });
    const jobId = receipt.match(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/)?.[0];
    if (!jobId) throw Error(receipt);
    writeFileSync(receiptPath, JSON.stringify({ jobId, source: spec.source, description: spec.description }, null, 2));
    console.log('QUEUED', spec.sex, jobId);
  }
  if (!existsSync(target)) {
    const { jobId } = JSON.parse(readFileSync(receiptPath, 'utf8'));
    pending.push(waitImages(mcp, jobId, 1, { w: 80, h: 80 }).then(([im]) => {
      writePng(target, im!);
      console.log('COMPLETE', spec.sex);
    }));
  }
}
await Promise.all(pending);
console.log('READY two front base drafts; no rotations or game export');
