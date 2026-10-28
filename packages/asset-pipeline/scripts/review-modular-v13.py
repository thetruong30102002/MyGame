"""Render actual exported full-body/gear cells at native scale and nearest x4."""
from pathlib import Path
import argparse,json
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[3]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base',type=Path,default=ROOT/'assets/mannequin/v13')
parser.add_argument('--out',type=Path,default=ROOT/'.aether-stage/mannequin/modular-v13-review')
args=parser.parse_args()
catalog=json.loads((args.base/'catalog.json').read_text(encoding='utf8'))
slices={s['name']:s for s in json.loads((args.base/'aether_shared-slices.json').read_text(encoding='utf8'))}
cell=catalog['frameSize'][0];pages={}
args.out.mkdir(parents=True,exist_ok=True)

def sprite(name):
    record=slices[name];i=record['cell'];page=record.get('page',i//256);i%=256
    if page not in pages:pages[page]=Image.open(args.base/f'aether_shared-{page}.png').convert('RGBA')
    if 'sourceRect' in record:
        x,y,w,h=record['rect'];l,t,sw,sh=record['sourceRect']
        out=Image.new('RGBA',(cell,cell));out.paste(pages[page].crop((x,y,x+w,y+h)),(l,t));return out
    return pages[page].crop(((i%16)*cell,(i//16)*cell,(i%16+1)*cell,(i//16+1)*cell))

def frame(pose,style,look,weapon=None):
    image=Image.new('RGBA',(cell,cell),(30,32,35,255))
    weapon_index=1 if weapon=='staff' else 0
    order=pose.get('weaponOrders',[1,1])[weapon_index]
    if weapon and order<0:image.alpha_composite(sprite(pose['name']+'_'+weapon))
    mask=0 if look=='bare' else 7
    image.alpha_composite(sprite(f'{pose["bodyPrefix"]}_{style}_base'+(f'_{mask}' if mask else '')))
    if look!='bare':
        items=['jacket_navy','pants_dark','boots_brown'] if look=='navy' else ['cuirass_silver','pants_mail','boots_plate']
        for slot in [1,2,0]:image.alpha_composite(sprite(pose['garmentPrefix']+'_'+items[slot]))
    if weapon:
        if order>=0:image.alpha_composite(sprite(pose['name']+'_'+weapon))
        if pose.get('trailActive',False):image.alpha_composite(sprite(pose['name']+'_trail'))
        image.alpha_composite(sprite(pose['name']+'_hand_'+weapon))
    if look!='bare':
        arm=pose['garmentPrefix']+'_arm_'+items[0]
        if arm in slices:image.alpha_composite(sprite(arm))
    return image

for identity in catalog['identities']:
    sex='female' if identity['id'].endswith('_f') else 'male'
    for action in ['idle','walk','attack','cast']:
        seqs=[s for s in identity['sequences'] if s['action']==action]
        if not seqs:continue
        for style in catalog['hairStyles']:
            # A single sheet includes every frame; transitions cannot be hidden
            # by selecting only the best standing / peak-strike screenshots.
            for look in ['bare','navy','silver']:
                contact=Image.new('RGBA',(cell*len(seqs[0]['frames']),cell*len(seqs)),(30,32,35,255))
                for row,seq in enumerate(seqs):
                    for col,pose in enumerate(seq['frames']):
                        contact.alpha_composite(frame(pose,style['id'],look,'sword' if action=='attack' else 'staff' if action=='cast' else None),(col*cell,row*cell))
                prefix=f'{sex}-{style["id"]}-{look}-{action}'
                contact.save(args.out/(prefix+'-native.png'))
            # Review all three loadouts and directions simultaneously at x2.
            frames=[]
            for phase in range(len(seqs[0]['frames'])):
                grid=Image.new('RGBA',(cell*len(seqs),cell*3),(30,32,35,255))
                for col,seq in enumerate(seqs):
                    for row,look in enumerate(['bare','navy','silver']):
                        grid.alpha_composite(frame(seq['frames'][phase],style['id'],look,'sword' if action=='attack' else 'staff' if action=='cast' else None),(col*cell,row*cell))
                frames.append(grid.resize((grid.width*2,grid.height*2),Image.Resampling.NEAREST).convert('RGB'))
            frames[0].save(args.out/f'{sex}-{style["id"]}-{action}.gif',save_all=True,append_images=frames[1:],duration=round(1000/seqs[0]['fps']),loop=0,disposal=2)
print(f'Review exported atlas: {args.out}')
