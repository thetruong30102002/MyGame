"""Kiểm kê map, ảnh minimap đã render và frame boss thật; không sửa asset gốc."""
import json, hashlib, re
from pathlib import Path
from collections import Counter, defaultdict
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '.havenlord-stage/world-renewal'
OUT.mkdir(parents=True, exist_ok=True)
read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
regions = read(OUT / 'regions.json')
manifest = read(ROOT / 'assets/manifest.json')['characters']
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 15)
report = {'regions': [], 'bosses': [], 'maps': []}
hub_images, all_images = [], []
for r in regions:
    base = ROOT / 'assets/maps' / r['id']
    world = read(base / 'world.json')
    mobs, bosses, props = set(), set(), Counter()
    maps = []
    for key in world['maps']:
        p = base / (key + '.json')
        if not p.exists(): continue
        m = read(p)
        ids = [x['id'] for x in m.get('props', [])]
        props.update(ids)
        mobids = {a for z in m.get('monsterZones', []) for a in z.get('monsters', [])}
        bosses.update(a for a in mobids if manifest.get(a, {}).get('role') == 'boss')
        mobs.update(a for a in mobids if manifest.get(a, {}).get('role') != 'boss')
        b = m.get('boss')
        if b:
            # boss khai dạng characterId trong dữ liệu kit.
            bid = b.get('characterId') or b.get('monster') or b.get('id')
            if bid: bosses.add(bid)
        entry = {'key': f"{r['id']}/{key}", 'name': m['name'], 'biome': m.get('biome'),
                 'props': len(ids), 'propTypes': len(set(ids)), 'npcs': len(m.get('npcs', [])),
                 'mobTypes': sorted(mobids), 'boss': b, 'exits': len(m.get('exits', []))}
        maps.append(entry)
        mini = base / (key + '.minimap.png')
        if mini.exists():
            im = Image.open(mini).convert('RGB')
            all_images.append((entry['key'], im))
            if key == r['hub']: hub_images.append((r['name'], im))
    hub = next((x for x in maps if x['key'].endswith('/' + r['hub'])), None)
    report['regions'].append({'id': r['id'], 'name': r['name'], 'hubName': r['settlement']['name'],
        'hubKey': r['id'] + '/' + r['hub'], 'mapCount': len(maps), 'hub': hub,
        'mobTypes': sorted(mobs), 'bossIds': sorted(bosses),
        'topProps': props.most_common(12), 'chief': r['chief']})
    report['maps'].extend(maps)

for cid, c in manifest.items():
    if c.get('role') != 'boss': continue
    atlas_path = ROOT / 'assets' / c['atlas']
    a = read(atlas_path)
    png = atlas_path.with_suffix('.png')
    sheet = Image.open(png).convert('RGBA')
    anims = defaultdict(lambda: defaultdict(list))
    for key, value in a['frames'].items():
        match = re.search(r'/([^/]+)_([A-Z]+)_(\d+)$', key)
        if not match: continue
        anim, direction, _ = match.groups()
        f = value['frame']
        crop = sheet.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
        anims[anim][direction].append(hashlib.sha256(crop.tobytes()).hexdigest())
    counts = {anim: {d: {'slots': len(h), 'unique': len(set(h))} for d,h in dirs.items()} for anim, dirs in anims.items()}
    cardinal = [v['unique'] for anim in ('idle','walk','attack','death') for d,v in counts.get(anim,{}).items() if d in ('S','W','N','E')]
    low = [f'{anim}/{d}: {v["unique"]}/{v["slots"]}' for anim, dirs in counts.items() for d,v in dirs.items()
           if anim in ('idle','walk','attack','death') and v['unique'] < (4 if anim == 'idle' else 6)]
    report['bosses'].append({'id':cid,'name':c['displayName'],'frameSize':c['frameSize'],
        'bodyHeight': c.get('bodyHeight'), 'frames': counts, 'lowFrames':low,
        'minCardinalUnique': min(cardinal) if cardinal else 0,
        'provisional':c.get('provisional',[])})

def contact(items, name, cols=4, cell=(300,250)):
    w,h=cell
    canvas = Image.new('RGB',(cols*w,((len(items)+cols-1)//cols)*h),'#101a22')
    draw = ImageDraw.Draw(canvas)
    for i,(label,im) in enumerate(items):
        x,y=(i%cols)*w,(i//cols)*h
        copy=im.copy(); copy.thumbnail((w-16,h-36),Image.Resampling.NEAREST)
        canvas.paste(copy,(x+(w-copy.width)//2,y+28))
        draw.text((x+8,y+6),label,font=font,fill='#e6c98c')
    canvas.save(OUT/name)

contact(hub_images,'hubs-contact.jpg')
for i in range(0,len(all_images),40): contact(all_images[i:i+40],f'maps-{i//40+1}.jpg',5,(240,206))
report['totals']={'regions':len(regions),'maps':len(report['maps']),'bosses':len(report['bosses']),
    'lowFrameBosses':sum(bool(x['lowFrames']) for x in report['bosses']), 'renderedMinimaps':len(all_images)}
(OUT/'audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report['totals'],ensure_ascii=False))
for r in report['regions']: print(r['id'],r['mapCount'],'hub NPC',r['hub']['npcs'] if r['hub'] else '-', 'mobs',len(r['mobTypes']), 'boss ids',','.join(r['bossIds']))
for b in report['bosses']: print(b['id'],b['frameSize'],'min actual cardinal',b['minCardinalUnique'],'low',len(b['lowFrames']))
