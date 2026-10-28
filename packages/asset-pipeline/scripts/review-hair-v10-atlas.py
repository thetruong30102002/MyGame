from pathlib import Path
from PIL import Image,ImageDraw
import json

ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'assets/mannequin/v2'
C=json.loads((OUT/'catalog.json').read_text(encoding='utf8'))
DEST=ROOT/f'.aether-stage/mannequin/modular-v{C.get("hairRevision",7)}-review';DEST.mkdir(exist_ok=True)
S={r['name']:r['cell'] for r in json.loads((OUT/'aether_shared-slices.json').read_text())};P={}
def sprite(name):
    k=S[name];page=k//256
    if page not in P:P[page]=Image.open(OUT/f'aether_shared-{page}.png').convert('RGBA')
    return P[page].crop((k%16*176,k%256//16*176,k%16*176+176,k%256//16*176+176))
def draw(identity,seq,frame,look=0,mask=7,hair=0,weapon=True):
    f=seq['frames'][frame];layers=[];gp=f['garmentPrefix'];bp=f['bodyPrefix'];offset=(0,0) if f.get('hairBaked') else (f['headAnchor'][0]-88,f['headAnchor'][1]-72);h=C['hairStyles'][hair]['id'];d=f['headDirection']
    layers.append((-2,sprite(f"{f.get('hairPrefix','hair')}_{h}_{d}_back"),offset));layers.append((0,sprite(bp+('_base' if mask==0 else '_base_'+str(mask))),(0,0)))
    outfit=[['jacket_navy','pants_dark','boots_brown'],['cuirass_silver','pants_mail','boots_plate'],['jacket_wine','pants_linen','boots_black'],['dragon_guard','dragon_legs','dragon_boots']][look]
    for i,item in enumerate(outfit):
        if mask&(1<<i):layers.append((C['garmentSlots'][i]['order']+1,sprite(gp+'_'+item),(0,0)))
    if mask&1:layers.append((10,sprite(gp+'_arm_'+outfit[0]),(0,0)))
    if weapon:
        kind='staff' if seq['action']=='cast' else 'sword';wi=1 if kind=='staff' else 0
        suffix='_bare' if not mask&1 else '_silver' if look==1 else '_gold' if look==3 else ''
        layers.append((11 if f['weaponOrders'][wi]>0 else -1,sprite(f['name']+'_'+kind+suffix),(0,0)))
        layers.append((12,sprite(f['handPrefix']+'_'+kind+suffix),(0,0)))
    if not C.get('integratedHeads') or h=='bald':layers.append((8,sprite(f['name']+('_identity_clothed' if mask&1 else '_identity')),(0,0)))
    layers.append((9,sprite(f"{f.get('hairPrefix','hair')}_{h}_{d}_front"),offset))
    im=Image.new('RGBA',(176,176))
    for _,layer,at in sorted(layers,key=lambda a:a[0]):im.alpha_composite(layer,at)
    return im


# Actual atlas composition: same render order, face, hair, gear and root.
canvas=Image.new('RGBA',(80*8,104*6),(26,32,40,255))
labels=ImageDraw.Draw(canvas)
for sex,identity in enumerate(C['identities']):
    for hair in range(3):
        row=sex*3+hair
        for col,d in enumerate(C['directions']):
            seq=next(s for s in identity['sequences'] if s['action']=='idle' and s['direction']==d)
            im=draw(identity,seq,0,0,7,hair=hair,weapon=False)
            canvas.alpha_composite(im.crop((48,52,128,156)),(col*80,row*104))
canvas.resize((1280,1248),Image.Resampling.NEAREST).save(DEST/'hair-eight-directions.png')
print('PASS actual atlas review: 3 hair styles, 8 directions, 2 identities')
