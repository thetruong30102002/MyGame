"""Export complete core-animation candidates and a self-contained review page.

Only whole-actor reflection, lossless atlas packing and master padding occur.
Production manifest and Unity assets are intentionally a separate release gate.
"""
from pathlib import Path
import base64,hashlib,importlib.util,json,math
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[4]
B=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('packing',ROOT/'packages/asset-pipeline/scripts/export-player-integrated.py')
packing=importlib.util.module_from_spec(spec);spec.loader.exec_module(packing)
DIRS=['S','SW','W','NW','N','NE','E','SE'];MIRROR={'SW':'SE','W':'E','NW':'NE'}
ROLES=[('swordsman','player_verdant_sword','Kiếm sĩ · Lục phong','sword','attack'),('mage','player_ivory_staff','Pháp sư · Nguyệt thạch','staff','cast')]

def clean(im):
    im=im.convert('RGBA');im.putalpha(im.getchannel('A').point(lambda a:255 if a>=128 else 0))
    im.paste((0,0,0,0),(0,0),im.getchannel('A').point(lambda a:255 if a==0 else 0));return im

def master(char,direction):
    source=MIRROR.get(direction,direction)
    im=clean(Image.open(B/'action-references'/f'{char}-{source}-master.png').resize((112,112),Image.Resampling.NEAREST))
    frame=Image.new('RGBA',(144,144));frame.alpha_composite(im,(16,28))
    return frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if direction in MIRROR else frame

def export(char,cid,label,weapon,combat):
    actions={'idle':(1,1,True,-1),'walk':(8,8,True,-1),'run':(8,11,True,-1),combat:(12,16,False,7 if combat=='attack' else 6)}
    images=[];records=[];animations={};lookup={};source_hashes={}
    for action,(count,fps,loop,hit) in actions.items():
        for direction in DIRS:
            source=MIRROR.get(direction,direction);names=[]
            if action!='idle':
                trace_path=B/'traces'/f'{char}-{action}-{source}'/'trace.json';trace=json.loads(trace_path.read_text())
                if any(r['sourceEdge'] or r['clipped'] for r in trace['frames']):raise ValueError('Clipped source: '+trace['job'])
                source_hashes[trace['source']]=trace['sourceSha256']
            for phase in range(count):
                if action=='idle':im=master(char,direction);origin=f'action-references/{char}-{source}-master.png'
                else:
                    origin=f'traces/{char}-{action}-{source}/frame-{phase:02}.png';im=clean(Image.open(B/origin))
                    if direction in MIRROR:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                name=f'{cid}/{action}_{direction}_{phase}';lookup[name]=len(images);images.append(im);names.append(name)
                records.append({'name':name,'wholeActor':True,'source':origin,'mirrored':direction in MIRROR,'rgbaSha256':hashlib.sha256(im.tobytes()).hexdigest()})
            animations[f'{action}_{direction}']=names
    atlas,placements=packing.pack(images);out=ROOT/'assets/characters'/cid;out.mkdir(parents=True,exist_ok=True)
    frames={}
    for name,index in lookup.items():
        x,y,b=placements[index];l,t,r,bt=b;w,h=r-l,bt-t
        frames[name]={'frame':{'x':x,'y':y,'w':w,'h':h},'rotated':False,'trimmed':True,'spriteSourceSize':{'x':l,'y':t,'w':w,'h':h},'sourceSize':{'w':144,'h':144},'anchor':{'x':.5,'y':128/144}}
    data={'frames':frames,'animations':animations,'meta':{'app':'Aether complete role core exporter','version':'17','image':cid+'.png','format':'RGBA8888','size':{'w':atlas.width,'h':atlas.height},'scale':'1'}}
    atlas.save(out/(cid+'.png'));(out/(cid+'.json')).write_text(json.dumps(data,separators=(',',':'))+'\n',encoding='utf8')
    entry={'displayName':label,'role':'player','atlas':f'characters/{cid}/{cid}.json','frameSize':{'width':144,'height':144},'anchor':{'x':.5,'y':128/144},'bodyHeight':75,'directions':DIRS,
        'animations':{a:{'frames':v[0],'fps':v[1],'loop':v[2],'hitFrame':v[3],'directions':DIRS} for a,v in actions.items()},'source':{'provider':'ImageGen-complete-character','ref':'player-integrated/source-art/wholecast-v17/used-generation-prompts.json'},'notes':f'Complete {weapon} character, one baked weapon. Core motion candidate. Idle has one master pose; reactions/death/dodge not authored.'}
    (out/'manifest-entry.json').write_text(json.dumps(entry,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    proof={'id':cid,'fullyDrawn':True,'bakedWeapon':weapon,'modularLayers':False,'frameSize':[144,144],'root':[72,128],'ppu':48,'resampling':'nearest','logicalFrames':len(images),'physicalFrames':len(images),'sourceSha256':source_hashes,'atlasSha256':hashlib.sha256((out/(cid+'.png')).read_bytes()).hexdigest(),'artApproved':False,'productionImported':False,'scope':'idle master + walk/run/combat, 8 directions; no reactions/lifecycle','records':records}
    (out/(cid+'.provenance.json')).write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    # Verify restored RGBA against every source candidate, including reflected directions.
    for name,index in lookup.items():
        f=frames[name];r=f['frame'];s=f['spriteSourceSize'];restored=Image.new('RGBA',(144,144));restored.paste(atlas.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])),(s['x'],s['y']))
        assert restored.tobytes()==images[index].tobytes(),name
    preview={'id':cid,'label':label,'weapon':weapon,'combat':combat,'atlas':'data:image/png;base64,'+base64.b64encode((out/(cid+'.png')).read_bytes()).decode(),'frames':frames,'animations':animations,'specs':entry['animations']}
    # Lossless animated overview, all eight directions beside one another, no smoothing.
    review=B/'review';review.mkdir(exist_ok=True)
    for action in actions:
        seq=[]
        for phase in range(actions[action][0]):
            card=Image.new('RGBA',(144*4,164*2),(29,31,34,255));d=ImageDraw.Draw(card)
            for i,direction in enumerate(DIRS):
                image=images[lookup[animations[f'{action}_{direction}'][phase]]];card.alpha_composite(image,(i%4*144,i//4*164));d.text((i%4*144+8,i//4*164+147),direction,fill='white')
            seq.append(card.resize((1152,656),Image.Resampling.NEAREST))
        if len(seq)>1:seq[0].save(review/f'{char}-{action}-8directions.webp',save_all=True,append_images=seq[1:],duration=round(1000/actions[action][1]),loop=0,lossless=True,method=6)
        else:seq[0].save(review/f'{char}-idle-8directions.png')
    print(cid,len(images),'frames; atlas round-trip exact')
    return preview

if __name__=='__main__':
    previews=[export(*r) for r in ROLES]
    payload=json.dumps(previews,ensure_ascii=False,separators=(',',':'))
    template=(B/'review-template.html').read_text(encoding='utf8')
    (B/'review'/'index.html').write_text(template.replace('__CAST_DATA__',payload),encoding='utf8')
    (B/'core-export-report.json').write_text(json.dumps({'version':17,'characters':[{'id':p['id'],'frames':len(p['frames']),'actions':list(p['specs'])} for p in previews],'pixelRoundTrip':'all frames exact','productionImported':False,'artApproved':False},indent=2)+'\n')
