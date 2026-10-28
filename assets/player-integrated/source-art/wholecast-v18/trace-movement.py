"""Căn nguyên actor của sheet đi/chạy, không ghép hoặc vẽ lại bộ phận."""
from pathlib import Path
import importlib.util,json,hashlib,statistics,sys
from PIL import Image,ImageDraw
B=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('prep',B/'prepare-roster.py');p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
JOBS=[j for j in json.loads((B/'motion-jobs.json').read_text(encoding='utf8'))['jobs'] if j['action'] in ['walk','run']]

def geometry(raw):
    # Thin sheet borders are distinct from the eight complete actor islands.
    cs=[a for a in p.whole.components(raw) if a['bounds'][2]-a['bounds'][0]<raw.width*.8 and a['bounds'][3]-a['bounds'][1]<raw.height*.8][:8]
    if len(cs)!=8:raise ValueError('Expected eight complete actors')
    cs.sort(key=lambda a:(a['bounds'][1]+a['bounds'][3])/2)
    cs=sum([sorted(cs[r*4:r*4+4],key=lambda a:(a['bounds'][0]+a['bounds'][2])/2) for r in range(2)],[])
    heads=[];cw=raw.width/4;ch=raw.height/2
    for i,a in enumerate(cs):
        row,col=divmod(i,4);alpha=p.whole.isolate(raw,a).getchannel('A');left=round((col+.18)*cw);right=round((col+.82)*cw)
        # Dense crown rows exclude long, narrow weapon tips above the head.
        threshold=ch*.76*12/75
        top=None
        for y in range(a['bounds'][1],round(a['bounds'][1]+(a['bounds'][3]-a['bounds'][1])*.48)):
            if sum(v>=128 for v in alpha.crop((left,y,right,y+1)).getdata())>=threshold:top=y;break
        if top is None:raise ValueError('Cannot find dense head crown')
        win=(left,top,right,min(round(top+ch*.19),a['bounds'][3]));cc=p.whole.components(p.whole.isolate(raw,a).crop(win))
        if not cc:raise ValueError('Missing head measurement')
        bb=cc[0]['bounds'];heads.append([bb[0]+left,top,bb[2]+left,bb[3]+top])
    return cs,heads

def trace(j):
    optsfile=B/'movement-registration-options.json';allopts=json.loads(optsfile.read_text()) if optsfile.exists() else {};opts=allopts.get(j['id'],{})
    source=B/'motion'/opts.get('source',j['id']+'.png')
    if not source.exists():return
    walkjob=f"{j['character']}-walk-{j['direction']}";walk=B/'motion'/allopts.get(walkjob,{}).get('source',walkjob+'.png')
    walksha=hashlib.sha256(walk.read_bytes()).hexdigest() if j['action']=='run' and walk.exists() else None
    sha=hashlib.sha256(source.read_bytes()).hexdigest();out=B/'movement-traces'/j['id'];receipt=out/'trace.json'
    if receipt.exists():
        old=json.loads(receipt.read_text())
        if old.get('version')==2 and old['sha256']==sha and old.get('options',{})==opts:return
    raw=Image.open(source).convert('RGBA');cs,heads=geometry(raw);cw=raw.width/4
    ref=Image.new('RGBA',(144,144));ref.alpha_composite(Image.open(B/'native'/j['character']/('idle-'+j['direction']+'.png')),(16,28))
    neutral=[0,4]
    scale=75/statistics.median(cs[i]['bounds'][3]-1-heads[i][1] for i in neutral)
    # The approved gait bends the knees/torso in running. Do not enlarge that
    # crouch to the upright standing height or use horizontal flowing hair/shaft
    # width as a camera-scale measurement. One scale remains fixed for 8 poses.
    if j['action']=='run':scale*= (73 if j['direction'] in ['S','N'] else 69)/75
    scale=opts.get('scale',scale)
    origin=statistics.median((h[0]+h[2])/2-(i%4)*cw for i,h in enumerate(heads))
    out.mkdir(parents=True,exist_ok=True);card=Image.new('RGBA',(144*9,164*2),(25,30,30,255));dr=ImageDraw.Draw(card);records=[]
    for i,a in enumerate(cs):
        ground=124 if j['action']=='run' and i in [3,7] else 127
        tx=72-(origin+i%4*cw)*scale+opts.get('translate',[0,0])[0];ty=ground-(a['bounds'][3]-1)*scale+opts.get('translate',[0,0])[1]
        im=p.whole.isolate(raw,a).transform((144,144),Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.NEAREST)
        im.putalpha(im.getchannel('A').point(lambda v:255 if v>=128 else 0));im.paste((0,0,0,0),(0,0),im.getchannel('A').point(lambda v:255 if v==0 else 0))
        if i in opts.get('mirrorFrames',[]):
            mirror=Image.new('RGBA',(144,144));mirror.alpha_composite(im.transpose(Image.Transpose.FLIP_LEFT_RIGHT),(1,0));im=mirror
        im.save(out/f'frame-{i:02}.png');bb=a['bounds'];mapped=[bb[0]*scale+tx,bb[1]*scale+ty,bb[2]*scale+tx,bb[3]*scale+ty]
        records.append({'index':i,'nativeBounds':im.getbbox(),'sourceBounds':bb,'headDiagnostic':heads[i],'sourceEdge':bb[0]==0 or bb[1]==0 or bb[2]==raw.width or bb[3]==raw.height,'clipped':min(mapped)<0 or mapped[2]>144 or mapped[3]>144})
        card.alpha_composite(im,((i+1)*144,164));dr.text(((i+1)*144+3,310),str(i+1),fill='white')
    card.alpha_composite(ref,(0,164));dr.text((3,310),'IDLE '+j['direction'],fill='white')
    for col in range(9):dr.line((col*144,292,col*144+144,292),fill=(70,100,70))
    card.crop((0,164,1296,328)).convert('RGB').save(out/'review-native.png')
    r={'version':2,'id':j['id'],'source':str(source.relative_to(B)).replace('\\','/'),'sha256':sha,'walkSha256':walksha,'options':opts,'uniformWholeActorScale':scale,'resampling':'nearest','frameSize':[144,144],'root':[72,128],'modularLayers':False,'frames':records}
    receipt.write_text(json.dumps(r,indent=2)+'\n');print(j['id'],round(scale,5),'issues',sum(f['sourceEdge'] or f['clipped'] for f in records))

if __name__=='__main__':
    wanted=sys.argv[1:]
    for j in JOBS:
        if wanted and j['id'] not in wanted:continue
        try:trace(j)
        except Exception as e:print('FAILED',j['id'],str(e))
