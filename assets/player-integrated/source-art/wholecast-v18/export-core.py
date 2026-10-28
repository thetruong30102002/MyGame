"""Xuất 30 actor vẽ liền cho game; --activate chỉ khi đã rà đủ bộ hình."""
from pathlib import Path
import json,hashlib,importlib.util,sys
from PIL import Image
B=Path(__file__).resolve().parent;ROOT=B.parents[3];V17=B.parent/'wholecast-v17'
sp=importlib.util.spec_from_file_location('packer',ROOT/'packages/asset-pipeline/scripts/export-player-integrated.py');pk=importlib.util.module_from_spec(sp);sp.loader.exec_module(pk)
R=json.loads((B/'roster.json').read_text(encoding='utf8'));DIRS=['S','SW','W','NW','N','NE','E','SE'];CDIRS=['S','SE','E','NE','N','NW','W','SW'];MIRROR={'SW':'SE','W':'E','NW':'NE'};COMBAT={'sword':'attack','bow':'shoot','staff':'cast','spear':'thrust','shield':'bash'}
reviews=json.loads((B/'core-art-review.json').read_text(encoding='utf8')) if (B/'core-art-review.json').exists() else {}
moveopts=json.loads((B/'movement-registration-options.json').read_text()) if (B/'movement-registration-options.json').exists() else {}

def movement(c,action,d):
    source=MIRROR.get(d,d)
    if c.get('reference'):folder=V17/'traces'/f"{'swordsman' if c['role']=='sword' else 'mage'}-{action}-{source}"
    else:folder=B/'movement-traces'/f"{c['id']}-{action}-{source}"
    receipt=folder/'trace.json'
    if not receipt.exists():raise FileNotFoundError(str(receipt))
    r=json.loads(receipt.read_text());assert len(r['frames'])==8 and not any(f['clipped'] or f['sourceEdge'] for f in r['frames']),str(receipt)
    if not c.get('reference'):
        job=f"{c['id']}-{action}-{source}";opts=moveopts.get(job,{})
        png=B/'motion'/opts.get('source',job+'.png')
        assert r['sha256']==hashlib.sha256(png.read_bytes()).hexdigest() and r['options']==opts and r['version']==2,'Stale movement '+job
    frames=[]
    for i in range(8):
        im=Image.open(folder/f'frame-{i:02}.png').convert('RGBA')
        if d in MIRROR:
            flipped=Image.new('RGBA',(144,144));flipped.alpha_composite(im.transpose(Image.Transpose.FLIP_LEFT_RIGHT),(1,0));im=flipped
        frames.append(im)
    return frames,{'trace':str(receipt.relative_to(ROOT)).replace('\\','/'),'traceSha256':hashlib.sha256(receipt.read_bytes()).hexdigest()}

def export(c):
    attack=COMBAT[c['role']];specs={'idle':(1,1,True,-1),'walk':(8,8,True,-1),'run':(8,11,True,-1),attack:(12,16,False,6 if attack in ['cast','thrust'] else 7)}
    images=[];names=[];animations={};sources={}
    combat=ROOT/'assets/player-roster/v18/combat'/f"{c['id']}.png";combatim=Image.open(combat).convert('RGBA')
    for action,(count,fps,loop,hit) in specs.items():
        for d in DIRS:
            if action=='idle':
                im=Image.new('RGBA',(144,144));im.alpha_composite(Image.open(B/'native'/c['id']/f'idle-{d}.png'),(16,28));frames=[im]
            elif action in ['walk','run']:
                frames,source=movement(c,action,d);sources[action+'_'+d]=source
            else:
                row=CDIRS.index(d);frames=[combatim.crop((i*144,row*144,(i+1)*144,(row+1)*144)) for i in range(12)]
                sources[action+'_'+d]={'atlas':str(combat.relative_to(ROOT)).replace('\\','/'),'sha256':hashlib.sha256(combat.read_bytes()).hexdigest()}
            clip=[]
            for i,im in enumerate(frames):
                name=f"{c['id']}/{action}_{d}_{i}";clip.append(name);names.append(name);images.append(im)
            animations[action+'_'+d]=clip
    atlas,places=pk.pack(images);out=ROOT/'assets/characters'/c['id'];out.mkdir(parents=True,exist_ok=True);png=out/f"{c['id']}.png";atlas.save(png);frames={};records=[]
    reopened=Image.open(png).convert('RGBA')
    for name,im,(x,y,bb) in zip(names,images,[places[i] for i in range(len(images))]):
        l,t,r,bot=bb;w,h=r-l,bot-t
        frames[name]={'frame':{'x':x,'y':y,'w':w,'h':h},'rotated':False,'trimmed':True,'spriteSourceSize':{'x':l,'y':t,'w':w,'h':h},'sourceSize':{'w':144,'h':144},'anchor':{'x':.5,'y':128/144}}
        restored=Image.new('RGBA',(144,144));restored.paste(reopened.crop((x,y,x+w,y+h)),(l,t));assert restored.tobytes()==im.tobytes(),name
        records.append({'name':name,'rgbaSha256':hashlib.sha256(im.tobytes()).hexdigest()})
    sha=hashlib.sha256(png.read_bytes()).hexdigest();review=reviews.get(c['id'],{});reviewed=review.get('atlasSha256')==sha and review.get('status')=='inspected-native'
    data={'frames':frames,'animations':animations,'meta':{'image':png.name,'format':'RGBA8888','version':'18','size':{'w':atlas.width,'h':atlas.height},'scale':'1'}}
    (out/f"{c['id']}.json").write_text(json.dumps(data,separators=(',',':'))+'\n',encoding='utf8')
    entry={'displayName':c['label'],'role':'player','atlas':f"characters/{c['id']}/{c['id']}.json",'frameSize':{'width':144,'height':144},'anchor':{'x':.5,'y':128/144},'bodyHeight':75,'directions':DIRS,'animations':{a:{'frames':n,'fps':fps,'loop':loop,'hitFrame':hit,'directions':DIRS} for a,(n,fps,loop,hit) in specs.items()},'source':{'provider':'ImageGen-complete-character','ref':'player-integrated/source-art/wholecast-v18/movement-prompts'},'notes':'V18: one complete actor, one baked weapon; idle/walk/run/class combat; no modular overlays.'}
    (out/'manifest-entry.json').write_text(json.dumps(entry,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    proof={'id':c['id'],'fullyDrawn':True,'bakedWeapon':c['role'],'modularLayers':False,'frameSize':[144,144],'root':[72,128],'ppu':48,'logicalFrames':232,'exactRgbaRoundtripFrames':232,'atlasSha256':sha,'sources':sources,'artReviewed':reviewed,'review':str((B/'core-art-review.json').relative_to(ROOT)).replace('\\','/'),'productionAuthorizedByUser':True,'records':records}
    (out/f"{c['id']}.provenance.json").write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    return {'id':c['id'],'entry':entry,'atlasSha256':sha,'frames':232,'artReviewed':reviewed}

if __name__=='__main__':
    done=[];missing=[]
    for c in R['characters']:
        try:done.append(export(c));print('EXPORTED',c['id'])
        except FileNotFoundError as e:missing.append(c['id']);print('PENDING',c['id'])
    summary={'characters':len(done),'totalFrames':232*len(done),'missing':missing,'models':[{k:v for k,v in d.items() if k!='entry'} for d in done]}
    (B/'core-export-status.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    if '--activate' in sys.argv:
        assert len(done)==30 and all(d['artReviewed'] for d in done),'Review all 30 complete sets before activation'
        path=ROOT/'assets/manifest.json';backup=ROOT/'.aether-stage/v18-release/manifest-before.json';backup.parent.mkdir(parents=True,exist_ok=True)
        if not backup.exists():backup.write_bytes(path.read_bytes())
        manifest=json.loads(path.read_text(encoding='utf8'))
        for d in done:manifest['characters'][d['id']]=d['entry']
        tmp=path.with_suffix('.v18.tmp');tmp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8');tmp.replace(path)
        print('ACTIVATED 30 complete actors in pipeline manifest')
    print(len(done),'sets;',232*len(done),'exact RGBA frames')
