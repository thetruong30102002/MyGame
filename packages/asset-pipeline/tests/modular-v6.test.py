"""Behavioral asset gates for the shared male/female equipment rig."""
from pathlib import Path
from PIL import Image
import json, math

ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'assets/mannequin/v2'
C=json.loads((OUT/'catalog.json').read_text(encoding='utf8'))
S=json.loads((OUT/'aether_shared-slices.json').read_text());N={r['name']:r['cell'] for r in S};P={}
assert len(N)==len(S) and C['modularBody'] and len(C['identities'])==2
assert C['frameSize']==[176,176] and C['anchor']==[88,152] and C['ppu']==48
assert len(C['hairStyles'])>=3
def sprite(name):
    k=N[name];page=k//256
    if page not in P:P[page]=Image.open(OUT/f'aether_shared-{page}.png').convert('RGBA')
    return P[page].crop((k%16*176,k%256//16*176,k%16*176+176,k%256//16*176+176))
def check(condition,message):
    if not condition:raise AssertionError(message)
contacts=0;shared=0;poses=set()
for identity in C['identities']:
    check(identity['texture']=='aether_shared','Separate duplicated gender equipment atlas')
    check(len(identity['sequences'])==40,'Missing action/direction')
    for seq in identity['sequences']:
        check(seq['direction'] in C['directions'],'Unknown direction')
        check(seq['fps']>0 and seq['hitFrame']<len(seq['frames']),'Invalid action timing')
        if seq['action'] in ['walk','run']:
            check(len({f['posePhase'] for f in seq['frames']})==8,'Not eight actual foot phases')
            check(seq['fps']<=9,'Movement cadence regression')
        for f in seq['frames']:
            check(f['root']==C['anchor'],'Root changes with action')
            poses.add(f['source']);gp=f['garmentPrefix'];bp=f['bodyPrefix']
            check(gp.startswith('gear_') and not gp.startswith(identity['id']),'Gear depends on sex')
            for mask in range(8):check(bp+('_base' if mask==0 else '_base_'+str(mask)) in N,'Missing body visibility mask')
            for slot in C['garmentSlots']:
                for item in slot['items']:check(gp+'_'+item['id'] in N,'Missing equipment action frame')
            for h in C['hairStyles']:
                for layer in ['front','back']:check('hair_'+h['id']+'_'+f['headDirection']+'_'+layer in N,'Missing directional hair')
            if seq['action']!='attack' or f['swordHandsVisible']:
                for look,grips in enumerate(f['weaponGripSets']):
                    suffix=['','_bare','_silver','_gold'][look]
                    for wi,weapon in enumerate(['sword','staff']):
                        point=tuple(grips[wi]);held=sprite(f['name']+'_'+weapon+suffix);hand=sprite(f['handPrefix']+'_'+weapon+suffix)
                        check(held.getpixel(point)[3]>0 and hand.getpixel(point)[3]>0,'Carried weapon misses actual hand '+f['name']+'/'+suffix+'/'+weapon)
            if seq['action']=='attack' and f['swordHandsVisible'] and not f.get('transitionPose',False):
                check(len(f['swordHandSets'])==4,'Missing bare/clothing grip variants')
                for look,pair in enumerate(f['swordHandSets']):
                    check(len(pair)==2,'Chop is not two handed')
                    suffix=['','_bare','_silver','_gold'][look]
                    sword=sprite(f['name']+'_sword'+suffix);hands=sprite(f['handPrefix']+'_sword'+suffix)
                    a,b=pair;ax=math.cos(math.radians(f['swordAngle']));ay=math.sin(math.radians(f['swordAngle']))
                    check(abs((b[0]-a[0])*ay-(b[1]-a[1])*ax)<1.1,'Fists not on one rigid hilt')
                    for p in pair:
                        check(sword.getpixel(tuple(p))[3]>0,'Hilt misses authored palm')
                        check(hands.getpixel(tuple(p))[3]>0,'No actual gripping hand above hilt')
                        contacts+=1
            if seq['action'] in ['idle','walk','run']:check(f['weaponOrders'][0]>0,'Carried sword hidden behind torso')
male,female=C['identities']
for a,b in zip(male['sequences'],female['sequences']):
    for x,y in zip(a['frames'],b['frames']):
        check(x['garmentPrefix']==y['garmentPrefix'],'Gender-specific duplicate equipment')
        shared+=1
check(len(poses)==320,'Missing independently drawn body poses')
check(C['garmentSlots'][2]['order']>C['garmentSlots'][1]['order'],'Boots must cover full trouser legs')
for direction in C['directions']:
    pants=sprite('gear_idle_0_'+direction+'_pants_dark');box=pants.getbbox()
    check(box is not None and box[3]-box[1]>=26,'Missing hidden trouser shins '+direction)
    upper=sprite('gear_idle_0_'+direction+'_jacket_navy');box=upper.getbbox()
    check(box[3]-24<=105,'Boot fragments accidentally belong to the shirt '+direction)
    for sex in ['male','female']:
        feet=sprite(sex+'_idle_0_'+direction+'_base_2')
        check(feet.getchannel('A').crop((0,148,176,154)).getbbox() is not None,'Bare feet vanish when wearing only pants')
check(C['weapons'][0]['hitFrame']/C['weapons'][0]['fps']==7/18,'Accepted sword hit timing changed')
print(f'PASS modular v6: {len(poses)} body poses, {shared} shared-equipment frame pairs, {contacts} actual two-palm hilt contacts; {C["uniqueCells"]} unique cells')
