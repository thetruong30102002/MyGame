"""Bind all drawn complete-body families to genuine common visible palms."""
from pathlib import Path
import importlib.util,json,math,shutil
from PIL import Image

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('annotation',HERE/'annotate-authored-v13.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
spec=importlib.util.spec_from_file_location('exporter',HERE/'assemble-modular-v13.py')
e=importlib.util.module_from_spec(spec);spec.loader.exec_module(e)

def common(ims,seed,previous=()):
    candidates=[]
    for y in range(max(0,seed[1]-4),min(144,seed[1]+5)):
        for x in range(max(0,seed[0]-4),min(144,seed[0]+5)):
            if all(a.skin(im.getpixel((x,y))) for im in ims) and all((x-p[0])**2+(y-p[1])**2>=16 for p in previous):
                candidates.append(((x-seed[0])**2+(y-seed[1])**2,x,y))
    if not candidates:raise ValueError(f'No common actual palm within reviewed cluster {seed}')
    _,x,y=min(candidates);return [x,y]

def finalize():
    audit=[]
    for action in ['walk','attack','cast']:
        path=a.OUT/f'male_{action}.json';data=json.loads(path.read_text(encoding='utf8'))
        female=[]
        for record in data['records']:
            d,p=record['direction'],record['phase']
            pants_polygon=record['erasePolygons']['pants']
            record['underwearBottomY']=max(y for polygon in pants_polygon for x,y in polygon)
            ims=[Image.open(a.OUT/f'{sex}_{style}_{action}_{p}_{d}.png').convert('RGBA')
                 for sex in ['male','female'] for style in ['chestnut_short','brown_ponytail']]
            if record.get('handsVisible',True):
                seeds=record['hands']
                note='common actual palm intersection across all four drawn body families'
                if action=='attack' and d=='N' and p==3:
                    seeds=[seeds[-1]];note+='; second hand occluded behind joined visible hand'
                if action=='attack' and d=='SE' and p==0:
                    seeds=[[60,99]];note+='; other real palm chosen for weapon visibility'
                hands=[]
                for seed in seeds:hands.append(common(ims,seed,hands))
                record['hands']=hands;record['grip']=hands[0];record['staffGrip']=hands[0]
                record['hand_boxes']=[[x-2,y-2,x+2,y+2] for x,y in hands]
                if len(hands)==2:
                    record['weaponAngle']=round(math.degrees(math.atan2(hands[0][1]-hands[1][1],hands[0][0]-hands[1][0])),3)
                if action=='attack' and d=='SE' and p==0:record['weaponAngle']=-112
                record['landmarkSource']=note
            audit.append(dict(action=action,phase=p,direction=d,hands=record['hands'],visible=record.get('handsVisible',True)))
            female_record=json.loads(json.dumps(record))
            # A female base keeps its own drawn underwear. Only exact navy bra
            # pixels inside the authored chest region are hidden by a shirt.
            im=ims[2];bra=[]
            for y in range(record['neckY']+2,record['waistY']):
                for x in range(45,101):
                    r,g,b,alpha=im.getpixel((x,y))
                    if alpha and b>r*1.08 and b>=g and r<110:bra.append(a.rectangle(x,y,x,y))
            female_record['erasePolygons']['upper']=bra
            female.append(female_record)
        path.write_text(json.dumps(data,indent=2)+'\n',encoding='utf8')
        (a.OUT/f'female_{action}.json').write_text(json.dumps(dict(records=female),indent=2)+'\n',encoding='utf8')
    for sex in ['male','female']:
        attack=json.loads((a.OUT/f'{sex}_attack.json').read_text(encoding='utf8'))['records']
        idle=[r for r in attack if r['phase']==0]
        (a.OUT/f'{sex}_idle.json').write_text(json.dumps(dict(records=idle),indent=2)+'\n',encoding='utf8')
        for d in a.DIRS:
            for style in ['chestnut_short','brown_ponytail']:
                shutil.copyfile(a.OUT/f'{sex}_{style}_attack_0_{d}.png',a.OUT/f'{sex}_{style}_idle_0_{d}.png')
    for d in a.DIRS:
        for look in ['navy','silver']:
            shutil.copyfile(a.OUT/f'dressed/{look}_attack_0_{d}.png',a.OUT/f'dressed/{look}_idle_0_{d}.png')
    manifest=e.example();manifest.pop('metadataExample',None);manifest['maxColors']=64;manifest['maxVariantHeight']=82
    (a.OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    (a.ART/'palm-intersection-audit.json').write_text(json.dumps(audit,indent=2)+'\n',encoding='utf8')
    print('Bound all source body families to shared actual palms; female metadata/underwear and identical idle poses saved')

if __name__=='__main__':finalize()
