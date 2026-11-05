import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from '../packages/asset-pipeline/src/env.js';
import { PixelLabMcp } from '../packages/asset-pipeline/src/pixellab/mcp.js';
import { callWhenFree, waitImages } from '../packages/asset-pipeline/src/pixellab/jobs.js';
import { writePng } from '../packages/asset-pipeline/src/image/rgba.js';

const output = 'packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/npc-heads30-v1';
const references = 'packages/asset-pipeline/sources/pixellab';
const mcp = new PixelLabMcp(loadEnv(process.cwd()).PIXELLAB_TOKENS!.split(',')[0].trim());
const designs = {
  human: {
    race: 'Human, normal round ears.',
    male: ['chestnut messy fringe','black side-parted hair','ash blond short swept fringe'],
    female: ['warm brown neat bob','black low ponytail ending at shoulders','copper short side braid'],
  },
  elf: {
    race: 'Elf, slim pointed ears projecting sideways, no horns.',
    male: ['golden blond smooth side part','forest teal loose bangs','silver short swept-back hair'],
    female: ['pale gold shoulder bob','mint-green tied short hair','silver short side braid'],
  },
  demon: {
    race: 'Demon, muted lavender skin, two compact curled black horns and amber eyes.',
    male: ['dark crimson tousled crop','deep plum side sweep','white short slicked-back hair'],
    female: ['wine-red blunt bob','violet short ponytail','black asymmetrical bob'],
  },
  beast: {
    race: 'Humanoid beastkin, animal ears on hair, human face, no muzzle or human ears.',
    male: ['charcoal short hair and wolf ears','ginger side-swept hair and fox ears','sand blond layered hair and small lynx ears'],
    female: ['silver short bob and wolf ears','chestnut short ponytail and fox ears','golden short braid and lynx ears'],
  },
  dragon: {
    race: 'Humanoid dragonkin, two small swept-back angular horns, subtle cheek scales and slit pupils, human face.',
    male: ['navy short hair and slate horns','rust red swept hair and dark bronze horns','silver spiky crop and pale ivory horns'],
    female: ['indigo short bob and blue-gray horns','copper shoulder braid and dark horns','pale silver short ponytail and pearl horns'],
  },
};
mkdirSync(output, { recursive: true });
const entries = [];
const active: Promise<void>[] = [];
for (const [race, design] of Object.entries(designs)) {
  for (const sex of ['male', 'female'] as const) {
    const source = join(references, sex === 'male' ? 'npc_silver_youth' : 'npc_silver_youth_f', 'Idle/rotations/south.png');
    for (const [variant, hair] of design[sex].entries()) {
      const id = sex[0] + '-' + race + (variant + 1);
      // These two outputs introduced non-human ears or horns and were rejected.
      if (id === 'f-human2' || id === 'f-human3') continue;
      const folder = join(output, id);
      const receiptPath = join(folder, 'head-job.json');
      const target = join(folder, 'S.png');
      const description = 'Change head and hair only. ' + design.race + ' ' + hair + '. Keep exact NPC skull, face size, chin and neck position, eye placement, body, outfit, feet and straight-on pose. Match original 80px anime pixel style, crisp tiny clusters. Keep hair at or above shoulders. Compact ears/horns. Transparent background.';
      mkdirSync(folder, { recursive: true });
      if (description.length > 500) throw Error(id + ' prompt too long');
      if (!existsSync(receiptPath)) {
        const receipt = await callWhenFree(mcp, 'edit_image_pixen', {
          description, image_base64: readFileSync(source).toString('base64'),
          width: 80, height: 80, no_background: true, seed: 73500 + entries.length,
        });
        const jobId = receipt.match(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/)?.[0];
        if (!jobId) throw Error(receipt);
        writeFileSync(receiptPath, JSON.stringify({ jobId, source, description, receipt }, null, 2));
        console.log('QUEUED', id, jobId);
      }
      entries.push({ id, race, sex, variant: variant + 1, source, image: id + '/S.png' });
      if (!existsSync(target)) {
        const { jobId } = JSON.parse(readFileSync(receiptPath, 'utf8'));
        active.push(waitImages(mcp, jobId, 1, { w: 80, h: 80 }).then(([im]) => {
          writePng(target, im!);
          console.log('COMPLETE', id);
        }));
      }
    }
  }
}
writeFileSync(join(output, 'manifest.json'), JSON.stringify({ entries, reference: 'NPC native 80px', stage: 'south master drafts' }, null, 2));
await Promise.all(active);
console.log('READY', entries.length, 'south master drafts');
