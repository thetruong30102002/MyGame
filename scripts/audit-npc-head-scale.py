"""Detect eye landmark to validate a shared head anchor. No image is modified."""
from pathlib import Path
from PIL import Image
from collections import Counter
import json

root=Path('packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/npc-heads30-v1')
entries=json.loads((root/'manifest.json').read_text(encoding='utf-8-sig'))['entries']
targets={'m':21,'f':23}
for entry in entries:
    path=root/entry['image']
    if not path.exists():continue
    im=Image.open(path).convert('RGBA')
    rows=Counter()
    for y in range(18,29):
        for x in range(27,51):
            r,g,b,a=im.getpixel((x,y))
            blue=(g>=80 and b>=100 and b>r+20 and g>r+10)
            amber=(r>=170 and g>=65 and b<=95 and r>g+45)
            if a and (amber if entry['race']=='demon' else blue):rows[y]+=1
    plausible={y:n for y,n in rows.items() if n>=2}
    if not plausible:
        print(entry['id'],'NO EYES FOUND')
        continue
    eye=max(plausible,key=lambda y:plausible[y])
    delta=targets[entry['id'][0]]-eye
    print(entry['id'],'eye',eye,'target',targets[entry['id'][0]],'source shift',delta,'REVIEW' if abs(delta)>2 else 'ok')
