"""Check the shipped atlas contract, including exact mirrored equipment/grips.

Uses exported pixels, not the exporter's geometry helpers. Visual and player
checks remain separate release requirements.
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
BASE = ROOT / 'assets/mannequin/v13'
catalog = json.loads((BASE / 'catalog.json').read_text(encoding='utf8'))
records = json.loads((BASE / 'aether_shared-slices.json').read_text(encoding='utf8'))
slices = {s['name']: s for s in records}
assert len(slices) == len(records), 'Duplicate logical sprite names'
assert catalog['integratedBodyVariants'] and catalog['drawnBodies']
assert catalog['frameSize'] == [176, 176] and catalog['anchor'] == [88, 152]
assert catalog['ppu'] == 48 and catalog['bodyHeight'] == 74
assert catalog['atlasPageCount'] == 4 and catalog['compactSlices']
assert len(catalog['identities']) == 2 and len(catalog['hairStyles']) == 3
pages = {}
palette = set()
for page in range(catalog['atlasPageCount']):
    im = Image.open(BASE / f'aether_shared-{page}.png').convert('RGBA')
    assert list(im.size) == catalog['atlasSize']
    colors = im.getcolors(im.width * im.height)
    assert colors is not None
    for _, rgba in colors:
        assert rgba[3] in (0, 255), 'Soft alpha would blur native pixels'
        if rgba[3]: palette.add(rgba[:3])
    pages[page] = im
assert len(palette) <= 64, f'Palette drift: {len(palette)} colors'

physical = {}
for s in records:
    x, y, w, h = s['rect']
    left, top, sw, sh = s['sourceRect']
    assert (w, h) == (sw, sh) and w > 0 and h > 0
    assert 0 <= x < x+w <= 2048 and 0 <= y < y+h <= 2048
    assert 0 <= left < left+w <= 176 and 0 <= top < top+h <= 176
    # Root stays within each crop so Unity imports the same anatomical origin.
    assert left <= 88 <= left+w and top <= 152 <= top+h
    geometry = (s['page'], tuple(s['rect']), tuple(s['sourceRect']))
    assert physical.setdefault(s['cell'], geometry) == geometry, 'Alias pivot drift'
assert len(physical) == catalog['uniqueCells']

def pixels(name):
    s = slices[name]
    x, y, w, h = s['rect']; left, top, _, _ = s['sourceRect']
    out = Image.new('RGBA', (176, 176))
    out.paste(pages[s['page']].crop((x, y, x+w, y+h)), (left, top))
    return out

mirror_count = 0
def mirror(left, right):
    global mirror_count
    a, b = pixels(left), pixels(right).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    assert a.tobytes() == b.tobytes(), f'Mirror mismatch: {left}'
    mirror_count += 1

items = [i['id'] for slot in catalog['garmentSlots'] for i in slot['items']]
uppers = [i['id'] for i in catalog['garmentSlots'][0]['items']]
for identity in catalog['identities']:
    seqs = {(s['action'], s['direction']): s for s in identity['sequences']}
    for action, count in [('idle', 1), ('walk', 8), ('run', 8), ('attack', 9), ('cast', 6)]:
        for direction in catalog['directions']:
            seq = seqs[action, direction]
            assert len(seq['frames']) == count
            for f in seq['frames']:
                assert f['hairBaked'] and f['root'] == catalog['anchor']
                assert f['anchorsReviewed'] and f['jointsReviewed']
                for style in catalog['hairStyles']:
                    for mask in range(8):
                        name = f"{f['bodyPrefix']}_{style['id']}_base" + (f'_{mask}' if mask else '')
                        assert name in slices, f'Missing body/action/mask: {name}'
                for item in items:
                    assert f"{f['garmentPrefix']}_{item}" in slices
        for west, east in [('W', 'E'), ('SW', 'SE'), ('NW', 'NE')]:
            for a, b in zip(seqs[action, west]['frames'], seqs[action, east]['frames']):
                for style in catalog['hairStyles']:
                    for mask in range(8):
                        tail = f"_{style['id']}_base" + (f'_{mask}' if mask else '')
                        mirror(a['bodyPrefix']+tail, b['bodyPrefix']+tail)
                for item in items:
                    mirror(a['garmentPrefix']+'_'+item, b['garmentPrefix']+'_'+item)
                for item in uppers:
                    mirror(a['garmentPrefix']+'_arm_'+item, b['garmentPrefix']+'_arm_'+item)
                for suffix in ['_sword', '_staff', '_hand_sword', '_hand_staff', '_trail']:
                    mirror(a['name']+suffix, b['name']+suffix)
                assert a['weaponGrips'] == [[175-x, y] for x, y in b['weaponGrips']]
print(f'PASS v13: {len(records)} logical / {len(physical)} physical sprites, '
      f'{len(palette)} colors, {mirror_count} exact mirrored layer comparisons')
