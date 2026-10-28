"""Trace per-pose landmarks from the reviewed drawn body, not an animated rig.

Hand seeds below are manually traced from native-scale artwork. Snapping only
chooses an existing skin pixel inside a four-pixel inspection neighbourhood;
it never moves/repaints anatomy. The audit lists all snapped coordinates.
"""
from pathlib import Path
import json,math,shutil
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[3]
ART=ROOT/'assets/mannequin/v13/source-art';OUT=ART/'authored'
DIRS=['S','E','N','SE','NE']
SEEDS={
'S': [[[85,100]],[[76,86]],[[71,70],[75,74]],[[72,54],[76,58]],[[72,45],[76,49]],[[74,105],[70,100]],[[74,108],[70,104]],[[76,86]],[[86,100]]],
'E': [[[76,100]],[[81,83]],[[80,54],[83,58]],[[75,46],[79,50]],[[72,40],[76,44]],[[85,96],[82,92]],[[83,105],[80,101]],[[82,83]],[[76,99]]],
'N': [[[86,100]],[[83,87]],[[82,75]],[[72,54],[76,58]],[[72,45],[76,49]],[[62,109],[63,104]],[[62,111],[64,106]],[[83,87]],[[86,100]]],
'SE':[[[84,98]],[[76,86]],[[81,65],[77,69]],[[78,48],[81,52]],[[74,39],[78,43]],[[86,95],[82,90]],[[79,105],[75,100]],[[76,86]],[[85,98]]],
'NE':[[[83,99]],[[80,84]],[[81,58],[84,62]],[[76,48],[80,52]],[[72,40],[74,47]],[[83,89],[79,85]],[[80,105],[76,101]],[[82,85]],[[83,98]]],
}
HEADS={
'S': [[59,54,85,80],[60,54,85,80],[60,54,84,79],[61,54,84,80],[61,54,85,79],[64,61,88,84],[64,68,87,90],[60,54,85,80],[60,54,85,80]],
'E': [[60,54,85,78],[60,54,84,78],[58,54,82,79],[61,51,81,78],[60,52,82,79],[61,60,86,83],[62,66,85,88],[60,54,85,78],[60,54,85,78]],
'N': [[59,54,85,77],[60,54,85,77],[60,54,84,77],[61,54,84,78],[61,54,85,78],[62,60,88,83],[62,67,87,88],[60,54,85,77],[60,54,85,77]],
'SE':[[59,54,85,80],[60,54,85,80],[58,54,83,80],[61,53,84,79],[61,53,85,79],[63,61,88,85],[63,68,88,91],[60,54,85,80],[60,54,85,80]],
'NE':[[59,54,85,79],[60,54,85,79],[58,54,83,79],[61,53,84,79],[61,53,85,79],[62,60,88,84],[62,67,87,90],[60,54,85,79],[60,54,85,79]],
}

def skin(c):
    r,g,b,a=c
    return a and r>130 and r-g>20 and g-b>10

def snap_skin(im,seed,others=()):
    candidates=[]
    for y in range(max(0,seed[1]-4),min(144,seed[1]+5)):
        for x in range(max(0,seed[0]-4),min(144,seed[0]+5)):
            if skin(im.getpixel((x,y))) and all((x-p[0])**2+(y-p[1])**2>=16 for p in others):
                candidates.append(((x-seed[0])**2+(y-seed[1])**2,x,y))
    if not candidates:raise ValueError(f'No actual palm skin near reviewed seed {seed}')
    _,x,y=min(candidates);return [x,y]

def rectangle(l,t,r,b):return [[l,t],[r,t],[r,b],[l,b]]

def pants_bounds(im):
    points=[]
    # The reviewed pelvis occupies y90..119. Eye / head-shadow pixels can have
    # the same navy hue and MUST never be considered underwear.
    for y in range(90,120):
        for x in range(45,101):
            r,g,b,a=im.getpixel((x,y))
            if a and b>r*1.08 and b>=g and r<110:points.append((x,y))
    if not points:raise ValueError('Drawn underwear not found inside reviewed pelvis region')
    return [min(x for x,y in points),min(y for x,y in points),max(x for x,y in points),max(y for x,y in points)]

def annotate_attack():
    records=[];contact=Image.new('RGBA',(9*144,5*144),(30,32,35,255))
    for row,d in enumerate(DIRS):
        for phase in range(9):
            im=Image.open(OUT/f'male_chestnut_short_attack_{phase}_{d}.png').convert('RGBA')
            hidden=d=='N' and phase==2
            hands=[]
            if hidden:
                hands=[[70,67],[74,72]] # inferred behind scalp from both forearm ends
            else:
                for seed in SEEDS[d][phase]:hands.append(snap_skin(im,seed,hands))
            head=HEADS[d][phase];pants=pants_bounds(im)
            # Blade axis follows the actual two-hand grip, not an independent
            # sword animation. Its first point is towards the blade tip.
            if len(hands)==2:
                dx,dy=hands[0][0]-hands[1][0],hands[0][1]-hands[1][1]
                angle=math.degrees(math.atan2(dy,dx))
            else:angle=-68
            boxes=[[x-2,y-2,x+2,y+2] for x,y in hands]
            # Raised sleeves need the part of the head rectangle crossed by
            # actual forearms, supplied as foreground authoring polygons.
            foreground=[]
            if phase in [2,3,4]:
                for x,y in hands:foreground.append(rectangle(x-5,y-2,x+5,max(y+7,head[3]+4)))
            record=dict(phase=phase,direction=d,headBox=head,neckY=head[3]-1,
                waistY=pants[1],bootTopY=116,tunicDrop=5,hands=hands,grip=hands[0],staffGrip=hands[0],
                weaponAngle=round(angle,3),staffAngle=-90,hand_boxes=boxes,
                handsVisible=not hidden,weaponOrder=-1 if hidden else 1,
                foregroundPolygons=foreground,erasePolygons=dict(upper=[],pants=[rectangle(*pants)],boots=[]),
                trailActive=phase in [5,6],landmarkSource='manual native-frame trace; skin snap radius <=4px')
            records.append(record)
            preview=im.copy();draw=ImageDraw.Draw(preview);draw.rectangle((head[0],head[1],head[2]-1,head[3]-1),outline=(30,220,120,255))
            for x,y in hands:draw.ellipse((x-2,y-2,x+2,y+2),outline=(255,40,170,255))
            draw.text((45,134),f'{d} {phase} {len(hands)}h',fill='white')
            contact.alpha_composite(preview,(phase*144,row*144))
    (OUT/'male_attack.json').write_text(json.dumps(dict(records=records),indent=2)+'\n',encoding='utf8')
    contact.resize((contact.width*3,contact.height*3),Image.Resampling.NEAREST).save(ART/'male-attack-annotated.png')
    # Idle is the same actual complete body, including hairstyle; no redraw.
    idle=[]
    for record in records:
        if record['phase']!=0:continue
        d=record['direction'];shutil.copyfile(OUT/f'male_chestnut_short_attack_0_{d}.png',OUT/f'male_chestnut_short_idle_0_{d}.png')
        idle.append(record)
    (OUT/'male_idle.json').write_text(json.dumps(dict(records=idle),indent=2)+'\n',encoding='utf8')
    print('Annotated 45 attack and 5 identical idle complete-body poses')

CAST_SEEDS={
 'S':[[61,98],[67,91],[64,91],[65,92],[65,93],[61,98]],
 'E':[[75,99],[76,92],[75,94],[75,90],[75,92],[75,99]],
 'N':[[60,99],[60,99],[60,91],[60,90],[60,91],[60,98]],
 'SE':[[60,97],[65,91],[63,91],[64,91],[65,93],[61,98]],
 'NE':[[83,100],[83,100],[73,94],[70,93],[78,94],[82,100]],
}
WALK_SEEDS={
 'S':[[84,99]]*8,
 'E':[[75,102],[80,102],[74,102],[74,102],[79,102],[75,102],[71,99],[74,102]],
 'N':[[86,99]]*8,
 'SE':[[82,98],[81,100],[80,99],[81,99],[82,99],[81,99],[79,99],[82,99]],
 'NE':[[83,99],[83,99],[84,99],[84,99],[83,99],[84,99],[83,99],[84,99]],
}

def annotate_standing_action(action,seeds):
    records=[];count=len(seeds['S'])
    contact=Image.new('RGBA',(count*144,5*144),(30,32,35,255))
    for row,d in enumerate(DIRS):
        for phase,seed in enumerate(seeds[d]):
            im=Image.open(OUT/f'male_chestnut_short_{action}_{phase}_{d}.png').convert('RGBA')
            hand=snap_skin(im,seed);pants=pants_bounds(im)
            # These head bounds are traced to the stable complete-head pose;
            # source animations move limbs rather than rescaling the skull.
            head=[58,53,87,80]
            record=dict(phase=phase,direction=d,headBox=head,neckY=79,
                waistY=pants[1],bootTopY=116,tunicDrop=5,hands=[hand],grip=hand,staffGrip=hand,
                weaponAngle=-68,staffAngle=-90,hand_boxes=[[hand[0]-2,hand[1]-2,hand[0]+2,hand[1]+2]],
                handsVisible=True,weaponOrder=1,foregroundPolygons=[],
                erasePolygons=dict(upper=[],pants=[rectangle(*pants)],boots=[]),
                landmarkSource='manual native-frame trace; skin snap radius <=4px; cast grip is carry hand')
            records.append(record)
            preview=im.copy();draw=ImageDraw.Draw(preview);draw.rectangle((58,53,86,79),outline=(30,220,120,255))
            x,y=hand;draw.ellipse((x-2,y-2,x+2,y+2),outline=(255,40,170,255));draw.text((45,134),f'{d} {phase}',fill='white')
            contact.alpha_composite(preview,(phase*144,row*144))
    (OUT/f'male_{action}.json').write_text(json.dumps(dict(records=records),indent=2)+'\n',encoding='utf8')
    contact.resize((contact.width*3,contact.height*3),Image.Resampling.NEAREST).save(ART/f'male-{action}-annotated.png')
    print(f'Annotated {5*count} {action} complete-body poses')

def refresh_head_exclusions():
    for action in ['idle','walk','attack','cast']:
        path=OUT/f'male_{action}.json';data=json.loads(path.read_text(encoding='utf8'))
        for r in data['records']:
            d=r['direction'];phase=r['phase'];a='attack' if action=='idle' else action
            l,t,right,bottom=r['headBox'];xs=[l,right-1];ys=[t]
            for look in ['navy','silver']:
                source=OUT/f'dressed/{look}_{a}_{phase}_{d}.png'
                if not source.exists():continue
                im=Image.open(source).convert('RGBA')
                for y in range(max(0,t-10),bottom):
                    for x in range(max(0,l-8),min(144,right+8)):
                        red,green,blue,alpha=im.getpixel((x,y))
                        if alpha and 30<red<180 and green<130 and red>green*1.1 and blue<red*.9:
                            xs.append(x);ys.append(y)
            r['headExcludeBox']=[max(0,min(xs)-2),max(0,min(ys)-1),min(144,max(xs)+3),bottom+1]
            r['bootTopY']=112
        path.write_text(json.dumps(data,indent=2)+'\n',encoding='utf8')

if __name__=='__main__':
    annotate_attack()
    annotate_standing_action('cast',CAST_SEEDS)
    annotate_standing_action('walk',WALK_SEEDS)
    refresh_head_exclusions()
