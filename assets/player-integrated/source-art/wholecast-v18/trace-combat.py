"""Register complete combat drawings; no body-part painting or phase resizing."""
from pathlib import Path
import importlib.util,json,statistics,hashlib,sys
from PIL import Image,ImageDraw
B=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('roster_prep',B/'prepare-roster.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
ROSTER=json.loads((B/'roster.json').read_text(encoding='utf8'))
CHARS={c['id']:c for c in ROSTER['characters']}
JOBS=json.loads((B/'motion-jobs.json').read_text(encoding='utf8'))['jobs']

def landmark(raw,actor,kind):
    x0,y0,x1,y1=actor['bounds'];mask=Image.new('RGBA',raw.size);px=mask.load()
    for x,y in actor['pixels']:
        if y<y0+(y1-y0)*.55 and x0+(x1-x0)*.12<x<x1-(x1-x0)*.12 and p.hair_color(raw.getpixel((x,y))[:3],kind):px[x,y]=(255,255,255,255)
    cc=p.whole.components(mask)
    if not cc:raise ValueError('No crown landmark')
    return cc[0]['bounds']

def trace(j):
    optpath=B/'combat-registration-options.json';opts=json.loads(optpath.read_text()).get(j['id'],{}) if optpath.exists() else {}
    src=B/'motion'/opts.get('source',f"{j['id']}.png")
    old=B/'combat-traces'/j['id']/'trace.json'
    if old.exists():
        prior=json.loads(old.read_text())
        if prior.get('registrationVersion')==2 and prior['sha256']==hashlib.sha256(src.read_bytes()).hexdigest() and prior.get('registrationOptions',{})==opts:return
    raw=Image.open(src).convert('RGBA');c=CHARS[j['character']]
    cs=p.whole.components(raw)
    if opts.get('excludeSheetGrid'):
        # Exclude the disconnected sheet border, retaining whole actor islands.
        cs=[a for a in cs if a['bounds'][2]-a['bounds'][0]<raw.width*.8 and a['bounds'][3]-a['bounds'][1]<raw.height*.8]
    cs=cs[:12]
    if len(cs)!=12:raise ValueError(f'{j["id"]}: needs 12 complete actors, got {len(cs)}')
    cs.sort(key=lambda a:(a['bounds'][1]+a['bounds'][3])/2);ordered=[]
    for row in range(3):ordered+=sorted(cs[row*4:row*4+4],key=lambda a:(a['bounds'][0]+a['bounds'][2])/2)
    cw=raw.width/4
    # Neutral crown is measured in the center strip, where no upright side
    # weapon is present. Dark coats must never become the head landmark.
    crowns={}
    for i in [0,11]:
        a=ordered[i];col=i%4;win=(round((col+.43)*cw),a['bounds'][1],round((col+.57)*cw),a['bounds'][3])
        bb=p.whole.isolate(raw,a).getchannel('A').crop(win).getbbox()
        if not bb:raise ValueError('No neutral crown')
        crowns[i]=landmark(raw,a,c['hairColor'])[1] if opts.get('neutralCrown')=='hair' else win[1]+bb[1]
        if 'neutralCrownY' in opts:crowns[i]=opts['neutralCrownY'][0 if i==0 else 1]
    ref=Image.new('RGBA',(144,144));ref.alpha_composite(Image.open(B/'native'/c['id']/f"idle-{j['direction']}.png").convert('RGBA'),(16,28))
    ra=p.whole.components(ref)[0];rh=landmark(ref,ra,c['hairColor']);targetheight=75
    # Ground is the bottom of boots in the central body window. A spear tip
    # above the head does not participate in the crown measurement.
    floors=[a['bounds'][3]-1 for a in ordered]
    scale=opts.get('scale',targetheight/statistics.median(floors[i]-crowns[i] for i in [0,11]))
    heads=[]
    for i,a in enumerate(ordered):
        row,col=divmod(i,4);neutral_crown=statistics.median(crowns[k]-(k//4)*raw.height/3 for k in crowns)+row*raw.height/3
        win=(round((col+.29)*cw),round(neutral_crown-15),round((col+.73)*cw),round(neutral_crown+targetheight/scale*.25))
        mask=p.whole.isolate(raw,a).crop(win)
        candidates=p.whole.components(mask)
        if not candidates:
            # A deep follow-through can leave this measurement-only window.
            # It never controls rendered pixels or the physical actor scale.
            if i in [0,11]:raise ValueError('Missing neutral head window')
            heads.append([round((col+.45)*cw),round(neutral_crown),round((col+.55)*cw),round(neutral_crown+20/scale)])
        else:
            bb=candidates[0]['bounds'];heads.append([bb[0]+win[0],bb[1]+win[1],bb[2]+win[0],bb[3]+win[1]])
    step=cw;origin=statistics.median((heads[i][0]+heads[i][2])/2-(i%4)*cw for i in [0,11])
    rowfloors=[statistics.median(floors[r*4:r*4+4]) for r in range(3)]
    out=B/'combat-traces'/j['id'];out.mkdir(parents=True,exist_ok=True)
    contact=Image.new('RGBA',(720,510),(25,30,30,255));dr=ImageDraw.Draw(contact);frames=[];targetx=72
    for i,(a,h) in enumerate(zip(ordered,heads)):
        row,col=divmod(i,4);tx=targetx-(origin+step*col)*scale+opts.get('translate',[0,0])[0];ty=127-rowfloors[row]*scale+opts.get('translate',[0,0])[1]
        im=p.whole.isolate(raw,a).transform((144,144),Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.NEAREST)
        im.putalpha(im.getchannel('A').point(lambda v:255 if v>=128 else 0));im.paste((0,0,0,0),(0,0),im.getchannel('A').point(lambda v:255 if v==0 else 0))
        im.save(out/f'frame-{i:02}.png');contact.alpha_composite(im,((col+1)*144,row*170));dr.text(((col+1)*144+4,row*170+148),str(i+1),fill='white')
        bb=a['bounds'];mapped=[bb[0]*scale+tx,bb[1]*scale+ty,bb[2]*scale+tx,bb[3]*scale+ty]
        frames.append({'index':i,'nativeBounds':im.getbbox(),'headWidth':round((h[2]-h[0])*scale,2),'sourceBounds':bb,'sourceEdge':bb[0]==0 or bb[1]==0 or bb[2]==raw.width or bb[3]==raw.height,'clipped':min(mapped)<0 or mapped[2]>144 or mapped[3]>144})
    for row in range(3):contact.alpha_composite(ref,(0,row*170));dr.text((4,row*170+148),'IDLE MASTER',fill='white');dr.line((0,row*170+128,720,row*170+128),fill=(70,100,70))
    contact.resize((1440,1020),Image.Resampling.NEAREST).convert('RGB').save(out/'review-2x.png')
    receipt={'registrationVersion':2,'id':j['id'],'character':c['id'],'action':j['action'],'direction':j['direction'],'source':str(src.relative_to(B)).replace('\\','/'),'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'uniformWholeActorScale':scale,'rowFloor':rowfloors,'gridOrigin':origin,'gridStep':step,'frameSize':[144,144],'root':[72,128],'masterHeadWidth':rh[2]-rh[0],'neutralBodyHeight':targetheight,'resampling':'nearest','modularLayers':False,'frames':frames,'visualReview':'pending'}
    receipt['registrationOptions']=opts
    (out/'trace.json').write_text(json.dumps(receipt,indent=2)+'\n');print(j['id'],round(scale,5),'issues',sum(f['sourceEdge'] or f['clipped'] for f in frames))

if __name__=='__main__':
    wanted=sys.argv[1:]
    for j in JOBS:
        if j['action'] not in ['walk','run'] and (not wanted or j['id'] in wanted) and (B/'motion'/f"{j['id']}.png").exists():
            try:trace(j)
            except Exception as e:print('FAILED',j['id'],str(e))
