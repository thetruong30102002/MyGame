from pathlib import Path
from PIL import Image,ImageDraw
import json

ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'assets/mannequin/v2';DEST=ROOT/'.aether-stage/mannequin/modular-v6-review';DEST.mkdir(exist_ok=True)
C=json.loads((OUT/'catalog.json').read_text(encoding='utf8'));S={r['name']:r['cell'] for r in json.loads((OUT/'aether_shared-slices.json').read_text())};P={}
def sprite(name):
    k=S[name];page=k//256
    if page not in P:P[page]=Image.open(OUT/f'aether_shared-{page}.png').convert('RGBA')
    return P[page].crop((k%16*176,k%256//16*176,k%16*176+176,k%256//16*176+176))
def draw(identity,seq,frame,look=0,mask=7,hair=0,weapon=True):
    f=seq['frames'][frame];layers=[];gp=f['garmentPrefix'];bp=f['bodyPrefix'];offset=(f['headAnchor'][0]-88,f['headAnchor'][1]-72);h=C['hairStyles'][hair]['id'];d=f['headDirection']
    layers.append((-2,sprite(f'hair_{h}_{d}_back'),offset));layers.append((0,sprite(bp+('_base' if mask==0 else '_base_'+str(mask))),(0,0)))
    outfit=[['jacket_navy','pants_dark','boots_brown'],['cuirass_silver','pants_mail','boots_plate'],['jacket_wine','pants_linen','boots_black'],['dragon_guard','dragon_legs','dragon_boots']][look]
    for i,item in enumerate(outfit):
        if mask&(1<<i):layers.append((C['garmentSlots'][i]['order']+1,sprite(gp+'_'+item),(0,0)))
    if weapon:
        suffix='_bare' if not mask&1 else '_silver' if look==1 else '_gold' if look==3 else ''
        layers.append((10 if f['weaponOrders'][0]>0 else -1,sprite(f['name']+'_sword'+suffix),(0,0)))
        layers.append((11,sprite(f['handPrefix']+'_sword'+suffix),(0,0)))
    layers.append((8,sprite(f['name']+'_identity'),(0,0)));layers.append((9,sprite(f'hair_{h}_{d}_front'),offset))
    im=Image.new('RGBA',(176,176))
    for _,layer,at in sorted(layers,key=lambda a:a[0]):im.alpha_composite(layer,at)
    return im

for i,identity in enumerate(C['identities']):
    for action in ['walk','attack']:
        for d in ['S','W','N','SW']:
            seq=next(s for s in identity['sequences'] if s['action']==action and s['direction']==d)
            frames=[];sheet=Image.new('RGBA',(176*len(seq['frames']),176*3))
            for f in range(len(seq['frames'])):
                row=Image.new('RGBA',(176*3,176))
                for look,mask in [(0,0),(0,7),(1,7)]:
                    col=0 if mask==0 else 1 if look==0 else 2
                    im=draw(identity,seq,f,look,mask);row.alpha_composite(im,(col*176,0));sheet.alpha_composite(im,(f*176,col*176))
                bg=Image.new('RGBA',row.size,(25,30,35,255));bg.alpha_composite(row);frames.append(bg.resize((row.width*2,row.height*2),Image.Resampling.NEAREST).convert('RGB'))
            frames[0].save(DEST/f'{i}-{action}-{d}.gif',save_all=True,append_images=frames[1:],duration=round(1000/seq['fps']),loop=0,disposal=2)
            sheet.save(DEST/f'{i}-{action}-{d}.png')
for look in [0,1]:
    partial=Image.new('RGBA',(176*8,200*4),(24,29,35,255));labels=ImageDraw.Draw(partial)
    rows=[(C['identities'][0],'idle'),(C['identities'][1],'idle'),(C['identities'][0],'attack'),(C['identities'][1],'attack')]
    captions=['Base','Shirt','Pants','Shirt + pants','Boots','Shirt + boots','Pants + boots','Full']
    for row,(identity,action) in enumerate(rows):
        seq=next(s for s in identity['sequences'] if s['action']==action and s['direction']=='S')
        for mask in range(8):
            partial.alpha_composite(draw(identity,seq,0 if action=='idle' else 7,look,mask,0,False),(mask*176,row*200+20))
            labels.text((mask*176+6,row*200+4),captions[mask],fill=(230,225,210))
    partial.resize((partial.width*2,partial.height*2),Image.Resampling.NEAREST).save(DEST/f'partial-equipment-{look}.png')
print('PASS modular v6 visual review sheets / GIFs / independent equipment masks')
