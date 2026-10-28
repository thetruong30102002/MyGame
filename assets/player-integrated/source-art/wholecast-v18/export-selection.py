"""Lossless export of the 30 complete turnarounds for an initial selector.

This exports art/data only. Missing character motion is explicitly represented;
no placeholder movement is substituted and no production manifest is changed.
"""
from pathlib import Path
import hashlib,importlib.util,json
from PIL import Image,ImageDraw,ImageFont
B=Path(__file__).resolve().parent;ROOT=B.parents[3];OUT=ROOT/'assets/player-roster/v18'
spec=importlib.util.spec_from_file_location('packer',ROOT/'packages/asset-pipeline/scripts/export-player-integrated.py');packer=importlib.util.module_from_spec(spec);spec.loader.exec_module(packer)
DIRS=['S','SE','E','NE','N','NW','W','SW'];LABEL={'sword':'Kiếm','bow':'Cung','staff':'Trượng','spear':'Thương','shield':'Khiên'}
FONT=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)

def main():
    roster=json.loads((B/'roster.json').read_text(encoding='utf8'));chars=roster['characters'];OUT.mkdir(parents=True,exist_ok=True)
    assert len(chars)==30 and len({c['id'] for c in chars})==30
    for role in roster['roles']:
        assert all(sum(c['role']==role and c['gender']==gender for c in chars)==3 for gender in ['male','female'])
    combat_path=B/'combat-status.json';combat=json.loads(combat_path.read_text(encoding='utf8')) if combat_path.exists() else {'characters':[]}
    combat_by_id={r['id']:r for r in combat['characters']}
    images=[];names=[];choices=[];records=[]
    for c in chars:
        native=B/'native'/c['id'];reg=json.loads((native/'registration.json').read_text())
        assert not any(f['sourceEdge'] or f['clipped'] for f in reg.get('frames',[])),c['id']
        entry={'id':c['id'],'displayName':c['label'],'classId':c['role'],'classLabel':LABEL[c['role']],'gender':c['gender'],'variant':c['index'],'portraitFrame':f"{c['id']}/idle_S",'directionFrames':{},'weaponBakedIntoBody':True,'turnaroundReady':True,'coreMotionReady':bool(c.get('reference')),'importedIntoGame':False}
        motion=combat_by_id.get(c['id'],{})
        entry['combatSheetReady']=motion.get('frameCount')==96
        entry['combatVisualReview']=motion.get('visualReview','pending')
        entry['combatIssues']=motion.get('issues',[])
        entry['combatAtlas']=f"combat/{c['id']}.json" if entry['combatSheetReady'] else None
        for direction in DIRS:
            tile=Image.open(native/f'idle-{direction}.png').convert('RGBA');assert tile.size==(112,112)
            assert set(tile.getchannel('A').getdata())<={0,255}
            frame=Image.new('RGBA',(144,144));frame.alpha_composite(tile,(16,28));name=f"{c['id']}/idle_{direction}"
            images.append(frame);names.append(name);entry['directionFrames'][direction]=name
            records.append({'name':name,'rgbaSha256':hashlib.sha256(frame.tobytes()).hexdigest(),'registration':str((native/'registration.json').relative_to(ROOT)).replace('\\','/'),'registrationSha256':hashlib.sha256((native/'registration.json').read_bytes()).hexdigest()})
        choices.append(entry)
    atlas,placements=packer.pack(images);atlas.save(OUT/'selection-roster.png');frames={}
    for i,name in enumerate(names):
        x,y,b=placements[i];l,t,r,bt=b;w,h=r-l,bt-t
        frames[name]={'frame':{'x':x,'y':y,'w':w,'h':h},'rotated':False,'trimmed':True,'spriteSourceSize':{'x':l,'y':t,'w':w,'h':h},'sourceSize':{'w':144,'h':144},'anchor':{'x':.5,'y':128/144}}
        restored=Image.new('RGBA',(144,144));restored.paste(atlas.crop((x,y,x+w,y+h)),(l,t));assert restored.tobytes()==images[i].tobytes(),name
    atlas_data={'frames':frames,'meta':{'image':'selection-roster.png','format':'RGBA8888','size':{'w':atlas.width,'h':atlas.height},'scale':'1'}}
    (OUT/'selection-roster.json').write_text(json.dumps(atlas_data,separators=(',',':'))+'\n')
    catalog={'version':18,'total':30,'classOrder':roster['roles'],'perClass':{'male':3,'female':3},'directions':DIRS,'atlas':'selection-roster.json','frameSize':[144,144],'root':[72,128],'pixelsPerUnit':48,'characters':choices,'scope':'Initial-selection and combat art review. 28 new characters still lack walk/run. See combatSheetReady, combatVisualReview and combatIssues per character. Production creation/save flow is not changed.'}
    (OUT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    proof={'characters':30,'turnaroundFrames':240,'balancedGenderPerClass':True,'sourceOrCanvasClipping':0,'pixelRoundTripFrames':240,'atlasSha256':hashlib.sha256((OUT/'selection-roster.png').read_bytes()).hexdigest(),'coreMotionReady':2,'newMotionPilotAccepted':False,'productionImported':False,'records':records}
    (OUT/'export-proof.json').write_text(json.dumps(proof,indent=2)+'\n')
    # Review all eight directions in class groups: columns are M1,M2,M3,F1,F2,F3.
    for role in roster['roles']:
        group=sorted([c for c in chars if c['role']==role],key=lambda c:(c['gender']!='male',c['index']))
        card=Image.new('RGBA',(672,1024),(26,31,32,255));draw=ImageDraw.Draw(card)
        for col,c in enumerate(group):
            for row,direction in enumerate(DIRS):
                card.alpha_composite(Image.open(B/'native'/c['id']/f'idle-{direction}.png'),(col*112,row*128));draw.text((col*112+3,row*128+112),direction,font=FONT,fill='white')
        card.convert('RGB').save(B/'review'/f'class-{role}-8directions.png')
    print('Selection export: 30 unique characters; 3M/3F per class; 240 exact frames; 0 clipped sources. Core motion remains 2/30.')

if __name__=='__main__':main()
