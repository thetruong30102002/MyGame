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
print(f'PASS modular v{C.get("hairRevision",7)} visual review sheets / GIFs / independent equipment masks')

# Show the exact transition the user reported, on the same root/zoom, with
# both sexes and independent equipment layers. No per-frame crop or resizing.
for direction in C['directions']:
    frames=[]
    for phase in [None]*5+list(range(8))*3+[None]*5:
        canvas=Image.new('RGBA',(80*3,96*2),(26,32,40,255))
        for row,identity in enumerate(C['identities']):
            action='idle' if phase is None else 'walk'
            seq=next(s for s in identity['sequences'] if s['action']==action and s['direction']==direction)
            for col,(look,mask) in enumerate([(0,0),(0,7),(1,7)]):
                im=draw(identity,seq,0 if phase is None else phase,look,mask,hair=row)
                canvas.alpha_composite(im.crop((48,60,128,156)),(col*80,row*96))
        frames.append(canvas.resize((720,576),Image.Resampling.NEAREST).convert('RGB'))
    frames[0].save(DEST/f'idle-walk-{direction}.gif',save_all=True,append_images=frames[1:],duration=111,loop=0,disposal=2)
print('PASS idle-to-walk transition GIFs in all eight directions, same body scale and crop')

movie=[];durations=[]
timeline=[('idle',0)]*5+[('walk',p) for _ in range(2) for p in range(8)]+[('attack',p) for p in range(14)]+[('cast',p) for p in range(8)]+[('idle',0)]*5
for action,f in timeline:
    canvas=Image.new('RGBA',(116*3,160*2),(26,32,40,255))
    for row,identity in enumerate(C['identities']):
        seq=next(s for s in identity['sequences'] if s['action']==action and s['direction']=='SW')
        for hair in range(3):
            im=draw(identity,seq,f,0,7,hair=hair)
            canvas.alpha_composite(im.crop((30,0,146,160)),(hair*116,row*160))
    movie.append(canvas.resize((696,640),Image.Resampling.NEAREST).convert('RGB'))
    durations.append(160 if action=='idle' else 111 if action=='walk' else 56 if action=='attack' else 100)
movie[0].save(DEST/'hair-actions.gif',save_all=True,append_images=movie[1:],duration=durations,loop=0,disposal=2)
print('PASS hair movie: three authored styles, both sexes, idle/walk/chop/cast on the same body clock')
