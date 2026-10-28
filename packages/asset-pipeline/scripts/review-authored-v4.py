"""Render the exact exported equipment layers as contact sheets and animation GIFs."""
from pathlib import Path
from PIL import Image,ImageDraw
import json

ROOT=Path(__file__).resolve().parents[3]
ASSETS=ROOT/'assets/mannequin/v2'
OUT=ROOT/'.aether-stage/mannequin/twohand-v5-review'
OUT.mkdir(parents=True,exist_ok=True)
catalog=json.loads((ASSETS/'catalog.json').read_text(encoding='utf8'))
names=json.loads((ASSETS/'aether_warden-slices.json').read_text())
indices={name:i for i,name in enumerate(names)}
pages={};sprites={}
def sprite(name):
    if name in sprites:return sprites[name]
    i=indices[name];page=i//256;cell=i%256
    if page not in pages:pages[page]=Image.open(ASSETS/f'aether_warden-{page}.png').convert('RGBA')
    sprites[name]=pages[page].crop(((cell%16)*144,(cell//16)*144,(cell%16+1)*144,(cell//16+1)*144))
    return sprites[name]

looks=[None,['jacket_navy','pants_dark','boots_brown'],['cuirass_silver','pants_mail','boots_plate'],['jacket_wine','pants_mail','boots_plate'],['dragon_guard','dragon_legs','dragon_boots']]
def frame(pose,look,action,index):
    mask=7 if look else 0
    layers=[(0,sprite(pose['garmentPrefix']+('_base_7' if mask else '_base')))]
    if look:
        for slot,item in enumerate(look):layers.append((catalog['garmentSlots'][slot]['order']+1,sprite(pose['garmentPrefix']+'_'+item)))
    weapon='staff' if action=='cast' else 'sword'
    suffix='_bare' if look is None else '_silver' if look[0]=='cuirass_silver' else '_gold' if look[0]=='dragon_guard' else ''
    layers.append((5 if pose['weaponOrder']>0 else -1,sprite(pose['name']+'_'+weapon+(suffix if action=='attack' else ''))))
    if action=='attack' and pose.get('trailActive',False):layers.append((6,sprite(pose['name']+'_trail')))
    hand='_bare' if look is None else '_silver' if look[0]=='cuirass_silver' else '_gold' if look[0]=='dragon_guard' else ''
    layers.append((7,sprite(pose['handPrefix']+'_'+weapon+hand)))
    layers.append((8,sprite(pose['name']+'_identity')))
    out=Image.new('RGBA',(144,144))
    for _,image in sorted(layers,key=lambda pair:pair[0]):out.alpha_composite(image)
    return out

for action in ['idle','walk','run','attack','cast']:
    for direction in ['S','W','N','E']:
        sequence=next(s for s in catalog['identities'][0]['sequences'] if s['action']==action and s['direction']==direction)
        contact=Image.new('RGBA',(144*len(sequence['frames']),144*len(looks)),(32,28,24,255))
        animations=[]
        for i,pose in enumerate(sequence['frames']):
            strip=Image.new('RGBA',(144*len(looks),144),(32,28,24,255))
            for row,look in enumerate(looks):
                cell=frame(pose,look,action,i)
                strip.alpha_composite(cell,(row*144,0));contact.alpha_composite(cell,(i*144,row*144))
            animations.append(strip.resize((strip.width*3,strip.height*3),Image.Resampling.NEAREST).convert('RGB'))
        contact.resize((contact.width*2,contact.height*2),Image.Resampling.NEAREST).save(OUT/f'{action}-{direction}-contact.png')
        # GIF time is quantized to10ms: distribute rounding across the sequence
        # instead of silently shortening every 18fps frame to50ms.
        durations=[round((i+1)*100/sequence['fps'])*10-round(i*100/sequence['fps'])*10 for i in range(len(animations))]
        animations[0].save(OUT/f'{action}-{direction}.gif',save_all=True,append_images=animations[1:],duration=durations,loop=0,disposal=2)
        if action=='attack':
            comparison=[]
            for strip in animations:
                pair=Image.new('RGB',(864,432))
                pair.paste(strip.crop((432,0,864,432)),(0,0));pair.paste(strip.crop((1728,0,2160,432)),(432,0))
                comparison.append(pair)
            comparison[0].save(OUT/f'twohand-{direction}.gif',save_all=True,append_images=comparison[1:],duration=durations,loop=0,disposal=2)
print(OUT)
