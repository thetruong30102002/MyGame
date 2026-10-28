"""Export complete combat frames for review, without changing the shipped game."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,base64
B=Path(__file__).resolve().parent;ROOT=B.parents[3];V17=B.parent/'wholecast-v17'
DIRS=['S','SE','E','NE','N','NW','W','SW'];MIRROR={'NW':'NE','W':'E','SW':'SE'}
ACTIONS={'sword':'attack','staff':'cast','bow':'shoot','spear':'thrust','shield':'bash'}
roster=json.loads((B/'roster.json').read_text(encoding='utf8'));reviewed_path=B/'combat-art-review.json'
reviewed=json.loads(reviewed_path.read_text(encoding='utf8')) if reviewed_path.exists() else {}
options=json.loads((B/'combat-registration-options.json').read_text(encoding='utf8'))
dest=ROOT/'assets/player-roster/v18/combat';dest.mkdir(parents=True,exist_ok=True)
status=[];gallery={}
for c in roster['characters']:
    action=ACTIONS[c['role']];sources={};issues=[];originals={};ready_dirs=[]
    for d in ['S','SE','E','NE','N']:
        if c.get('reference'):
            hero='swordsman' if c['role']=='sword' else 'mage';folder=V17/'traces'/f'{hero}-{action}-{d}'
        else:folder=B/'combat-traces'/f"{c['id']}-{action}-{d}"
        receipt=folder/'trace.json'
        if not receipt.exists():continue
        r=json.loads(receipt.read_text());sources[d]={'trace':str(receipt.relative_to(ROOT)).replace('\\','/'),'sourceSha256':r.get('sha256',r.get('sourceSha256'))}
        if not c.get('reference'):
            job=f"{c['id']}-{action}-{d}";opt=options.get(job,{})
            selected=B/'motion'/opt.get('source',job+'.png')
            assert r['sha256']==hashlib.sha256(selected.read_bytes()).hexdigest() and r.get('registrationOptions',{})==opt, 'Stale trace: '+job
        if any(f['clipped'] or f['sourceEdge'] for f in r['frames']):issues.append(d+': crop/edge inspection required')
        originals[d]=[Image.open(folder/f'frame-{i:02}.png').convert('RGBA') for i in range(12)];ready_dirs.append(d)
    if len(originals)!=5:
        status.append({'id':c['id'],'action':action,'authoredDirections':ready_dirs,'combatFramesReady':False,'reason':'missing authored directions'});continue
    atlas=Image.new('RGBA',(1728,1152));metadata={};native=[]
    for row,d in enumerate(DIRS):
        original=MIRROR.get(d,d)
        master=Image.new('RGBA',(144,144));master.alpha_composite(Image.open(B/'native'/c['id']/f'idle-{d}.png').convert('RGBA'),(16,28))
        for i in range(12):
            im=originals[original][i].copy()
            if d in MIRROR:
                mirrored=Image.new('RGBA',(144,144));mirrored.alpha_composite(im.transpose(Image.Transpose.FLIP_LEFT_RIGHT),(1,0));im=mirrored
            # Canonical whole-frame endpoints make idle/combat transitions exact.
            # This replaces a complete pose; no layer or body part is composited.
            if i in [0,11]:im=master.copy()
            atlas.paste(im,(i*144,row*144));key=f"{c['id']}/{action}_{d}_{i}"
            metadata[key]={'frame':{'x':i*144,'y':row*144,'w':144,'h':144},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':144,'h':144},'sourceSize':{'w':144,'h':144}}
            native.append((key,im))
    png=dest/f"{c['id']}.png";atlas.save(png)
    # Verify every complete RGBA frame survives atlas export byte-for-byte.
    reopened=Image.open(png).convert('RGBA')
    for k,im in native:
        f=metadata[k]['frame'];assert reopened.crop((f['x'],f['y'],f['x']+144,f['y']+144)).tobytes()==im.tobytes()
    content={'frames':metadata,'meta':{'image':png.name,'size':{'w':1728,'h':1152},'scale':'1','frameSize':[144,144],'root':[72,128],'fps':16,'ppu':48,'completeCharacter':True,'modularLayers':False,'wholeFrameReflections':MIRROR,'canonicalIdleEndpoints':[0,11],'sources':sources,'importedIntoProduction':False}}
    (dest/f"{c['id']}.json").write_text(json.dumps(content,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
    atlas.save(B/'review'/f"combat-{c['id']}.png")
    inspection=reviewed.get(c['id'],{})
    visual=inspection.get('status','pending') if inspection.get('atlasSha256')==hashlib.sha256(png.read_bytes()).hexdigest() else 'pending'
    gallery[c['id']]={'action':action,'sheetData':'data:image/png;base64,'+base64.b64encode(png.read_bytes()).decode(),'issues':issues,'visualReview':visual}
    status.append({'id':c['id'],'action':action,'authoredDirections':ready_dirs,'logicalDirections':DIRS,'frameCount':96,'combatFramesReady':not issues,'visualReview':gallery[c['id']]['visualReview'],'issues':issues,'sourceSha256':hashlib.sha256(png.read_bytes()).hexdigest(),'exactRgbaRoundtripFrames':96,'importedIntoProduction':False})
summary={'version':18,'charactersWithCombatSheets':len(gallery),'total':30,'characters':status,'fullCoreAnimationsReady':2,'newWalkRunStatus':'not drawn','productionImport':False}
(B/'combat-status.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(dest/'export-proof.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(B/'review'/'combat-data.json').write_text(json.dumps(gallery,ensure_ascii=False,separators=(',',':')),encoding='utf8')
for c in roster['characters']:
    if c['id'] in gallery and not c.get('reference'):
        c['combatStatus']='drawn-native-reviewed' if gallery[c['id']]['visualReview']=='inspected-native' else 'drawn-review-pending'
        c['motionStatus']='combat-drawn-walk-run-pending'
(B/'roster.json').write_text(json.dumps(roster,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('combat sheets',len(gallery),'/30; exact frame roundtrips',len(gallery)*96)
