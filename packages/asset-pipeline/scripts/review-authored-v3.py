"""Render the exact exported equipment layers as contact sheets and animation GIFs."""
from pathlib import Path
from PIL import Image,ImageDraw
import json

ROOT=Path(__file__).resolve().parents[3]
ASSETS=ROOT/'assets/mannequin/v2'
OUT=ROOT/'.aether-stage/mannequin/drawn-v3-review'
OUT.mkdir(parents=True,exist_ok=True)
catalog=json.loads((ASSETS/'catalog.json').read_text(encoding='utf8'))
names=json.loads((ASSETS/'aether_warden-slices.json').read_text())
indices={name:i for i,name in enumerate(names)}
pages={};sprites={}
def sprite(name):
    if name in sprites:return sprites[name]
    i=indices[name];page=i//256;cell=i%256
    if page not in pages:pages[page]=Image.open(ASSETS/f'aether_warden-{page}.png').convert('RGBA')
    sprites[name]=pages[page].crop(((cell%16)*112,(cell//16)*112,(cell%16+1)*112,(cell//16+1)*112))
    return sprites[name]

looks=[None,['jacket_navy','pants_dark','boots_brown'],['cuirass_silver','pants_mail','boots_plate'],['jacket_wine','pants_mail','boots_plate']]
def frame(pose,look,action,index):
    mask=7 if look else 0
    layers=[(0,sprite(pose['garmentPrefix']+('_base_7' if mask else '_base')))]
    if look:
        for slot,item in enumerate(look):layers.append((catalog['garmentSlots'][slot]['order']+1,sprite(pose['garmentPrefix']+'_'+item)))
    weapon='staff' if action=='cast' else 'sword'
    layers.append((5 if pose['weaponOrder']>0 else -1,sprite(pose['name']+'_'+weapon)))
    if action=='attack' and 3<=index<=5:layers.append((6,sprite(pose['name']+'_trail')))
    hand='_bare' if look is None else '_silver' if look[0]=='cuirass_silver' else ''
    layers.append((7,sprite(pose['handPrefix']+'_'+weapon+hand)))
    layers.append((8,sprite(pose['name']+'_identity')))
    out=Image.new('RGBA',(112,112))
    for _,image in sorted(layers,key=lambda pair:pair[0]):out.alpha_composite(image)
    return out

for action in ['idle','walk','run','attack','cast']:
    for direction in ['S','W','N','E']:
        sequence=next(s for s in catalog['identities'][0]['sequences'] if s['action']==action and s['direction']==direction)
        contact=Image.new('RGBA',(112*len(sequence['frames']),112*4),(32,28,24,255))
        animations=[]
        for i,pose in enumerate(sequence['frames']):
            strip=Image.new('RGBA',(112*4,112),(32,28,24,255))
            for row,look in enumerate(looks):
                cell=frame(pose,look,action,i)
                strip.alpha_composite(cell,(row*112,0));contact.alpha_composite(cell,(i*112,row*112))
            animations.append(strip.resize((strip.width*4,strip.height*4),Image.Resampling.NEAREST).convert('RGB'))
        contact.resize((contact.width*2,contact.height*2),Image.Resampling.NEAREST).save(OUT/f'{action}-{direction}-contact.png')
        animations[0].save(OUT/f'{action}-{direction}.gif',save_all=True,append_images=animations[1:],duration=round(1000/sequence['fps']),loop=0,disposal=2)
print(OUT)
