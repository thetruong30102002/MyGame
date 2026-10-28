"""Compare complete native frames against a locked idle atlas.

The idle gate is byte-for-byte RGBA equality, independent of compact atlas
packing. Motion proportions use explicitly traced head/shoulder/waist points,
projected through each frame's recorded registration. Geometry measurements
and numeric limits are review evidence, never an art-quality approval.

Config paths are relative to this JSON file. Example landmark comparison:
{
  "frame": "player_integrated/attack_E_0",
  "referenceFrame": "player_integrated/idlesword_E_0",
  "candidate": {"space":"source", "head":[120,25,148,51],
                "shoulders":[122,56,143,57], "waist":[125,78,141,78]},
  "reference": {"space":"native", "head":[64,54,82,73],
                "shoulders":[65,76,79,76], "waist":[67,92,78,92]},
  "limits": {"headWidthRatio":[0.95,1.05], "headHeightRatio":[0.95,1.05],
             "shoulderWidthRatio":[0.9,1.1], "waistWidthRatio":[0.9,1.1]}
}
Head coordinates are opposite box corners; shoulder/waist coordinates are
segment endpoints. Source coordinates are pixel centers in the original full
source PNG, not the extracted tile. Native coordinates use the logical canvas.
Trace visible anatomy; do not include a raised hand, hair flare, sword or cloak.
Record occluded landmarks as a separate reviewer note instead of inventing them.
"""
from pathlib import Path
import argparse,hashlib,json,math
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[3]
DEFAULT=ROOT/'assets/player-integrated/source-art/fullhero-v15/native-review.json'
IDLE=('idle','idlesword','idlestaff')

def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def atlas(path):
    data=read_json(path);image_path=path.parent/data['meta']['image']
    pixels=Image.open(image_path).convert('RGBA')
    proof_path=path.with_suffix('.provenance.json')
    proof=read_json(proof_path) if proof_path.exists() else None
    digest=hashlib.sha256(image_path.read_bytes()).hexdigest()
    if proof and proof.get('atlasSha256')!=digest:
        raise ValueError('Atlas pixels do not match provenance: '+str(image_path))
    return dict(path=path,data=data,image=pixels,imageSha256=digest,proof=proof,
                records={r['name']:r for r in proof.get('records',[])} if proof else {})

def frame_image(a,name):
    f=a['data']['frames'][name]
    if f.get('rotated'):raise ValueError('Rotated frames are unsupported: '+name)
    r=f['frame'];s=f.get('spriteSourceSize',dict(x=0,y=0));size=f.get('sourceSize',r)
    im=Image.new('RGBA',(size['w'],size['h']))
    im.paste(a['image'].crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])),(s['x'],s['y']))
    return im

def frame_identity(a,name):
    f=a['data']['frames'][name]
    return dict(sourceSize=f.get('sourceSize'),anchor=f.get('anchor'))

def project(a,name,annotation):
    space=annotation.get('space','source');record=a['records'].get(name)
    if space not in ('source','native'):raise ValueError('Unknown landmark coordinate space: '+space)
    if space=='source' and record is None:raise ValueError('Source landmarks need frame provenance: '+name)
    def point(x,y):
        if space=='native':return [x,y]
        cell=record['sourceCell'];t=record['registration'];x-=cell[0];y-=cell[1]
        if t['mode']=='uniform-raw-affine':
            x=x*t['scale']+t['translate'][0];y=y*t['scale']+t['translate'][1]
        elif t['mode']=='known-reference-grid':
            size=t['referenceSize'];scale=t['scale'];translation=t['destinationTranslate']
            x=x*round(size[0]*scale)/(cell[2]-cell[0])+translation[0]
            y=y*round(size[1]*scale)/(cell[3]-cell[1])+translation[1]
        else:raise ValueError('Unknown frame registration: '+str(t))
        if record.get('mirrored'):x=frame_image(a,name).width-1-x
        return [x,y]
    result={}
    for key in ('head','shoulders','waist'):
        coords=annotation.get(key)
        if not isinstance(coords,list) or len(coords)!=4 or any(type(v) not in (int,float) or not math.isfinite(v) for v in coords):
            raise ValueError('Explicit four-coordinate '+key+' landmark required: '+name)
        result[key]=[point(*coords[:2]),point(*coords[2:])]
    return result

def measurements(points):
    h=points['head'];shoulders=points['shoulders'];waist=points['waist']
    return dict(headWidth=abs(h[1][0]-h[0][0]),headHeight=abs(h[1][1]-h[0][1]),
                shoulderWidth=math.dist(*shoulders),waistWidth=math.dist(*waist))

def contact_sheet(rows,destination):
    if not rows:return
    width=max(max(a.width,b.width) for _,a,b in rows)
    height=max(max(a.height,b.height) for _,a,b in rows)
    # Integer nearest-neighbour enlargement is for inspection, never reimported.
    for start in range(0,len(rows),24):
        page=rows[start:start+24]
        im=Image.new('RGB',(width*2+240,(height+22)*len(page)),(30,33,37));draw=ImageDraw.Draw(im)
        for row,(label,reference,candidate) in enumerate(page):
            y=row*(height+22);draw.text((3,y+3),label,fill=(230,230,230))
            im.paste(reference,(240,y+22),reference);im.paste(candidate,(240+width,y+22),candidate)
        suffix='' if len(rows)<=24 else f'-{start//24+1:03}'
        im.save(destination/f'native{suffix}.png')
        im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST).save(destination/f'3x{suffix}.png')

def verify(config_path,output=None,idle_only=False):
    cfg=read_json(config_path);base=config_path.resolve().parent
    baseline=atlas((base/cfg['baselineAtlas']).resolve());candidate=atlas((base/cfg['candidateAtlas']).resolve())
    output=output or base/'review/native-comparison';output.mkdir(parents=True,exist_ok=True)
    report=dict(baselineAtlas=str(baseline['path']),candidateAtlas=str(candidate['path']),
                baselineSha256=baseline['imageSha256'],candidateSha256=candidate['imageSha256'],
                idleFrames=[],landmarks=[],failures=[],artApproved=False,
                artReview='Native comparisons and traced geometry require visual review; this script never approves drawing quality.')
    rows=[];actions=cfg.get('idleActions',list(IDLE));names=[]
    for name in baseline['data']['frames']:
        action=name.rsplit('/',1)[-1].rsplit('_',2)[0]
        if action in actions:names.append(name)
    if not names:report['failures'].append('No locked idle frames found')
    for name in names:
        if name not in candidate['data']['frames']:
            report['failures'].append('Missing locked idle frame '+name);continue
        before=frame_image(baseline,name);after=frame_image(candidate,name)
        same=before.size==after.size and before.tobytes()==after.tobytes()
        same_identity=frame_identity(baseline,name)==frame_identity(candidate,name)
        changed=sum(a!=b for a,b in zip(before.getdata(),after.getdata())) if before.size==after.size else None
        report['idleFrames'].append(dict(frame=name,pixelIdentical=same,canvasAndAnchorIdentical=same_identity,changedPixels=changed,
                                        baselineRGBA=hashlib.sha256(before.tobytes()).hexdigest(),candidateRGBA=hashlib.sha256(after.tobytes()).hexdigest()))
        if not same or not same_identity:report['failures'].append('Locked idle changed: '+name)
        if not same or name.endswith('_0'):rows.append((name+' | locked idle / candidate',before,after))
    if not idle_only:
        comparisons=cfg.get('landmarkComparisons',[])
        if not comparisons:report['failures'].append('No explicit motion landmarks have been traced')
        covered=set()
        for check in comparisons:
            name=check['frame'];ref=check['referenceFrame']
            if ref.rsplit('/',1)[-1].rsplit('_',2)[0] not in actions:
                raise ValueError('Motion reference must be a locked idle: '+ref)
            before=project(baseline,ref,check['reference']);after=project(candidate,name,check['candidate'])
            bm=measurements(before);am=measurements(after)
            if any(v<=0 for v in bm.values()):raise ValueError('Idle landmark spans must be positive: '+ref)
            values={key+'Ratio':am[key]/bm[key] for key in bm}
            result=dict(frame=name,referenceFrame=ref,referencePoints=before,candidatePoints=after,
                        referencePixels=bm,candidatePixels=am,idleRelative=values,limits=check.get('limits',{}),failures=[],note=check.get('note',''))
            for key,limits in result['limits'].items():
                if key not in values or len(limits)!=2 or limits[0]>limits[1]:raise ValueError('Invalid landmark limit: '+key)
                if not limits[0]<=values[key]<=limits[1]:result['failures'].append(f'{key}={values[key]:.4f} outside {limits}')
            report['landmarks'].append(result);covered.add(name)
            report['failures'].extend(name+': '+failure for failure in result['failures'])
            rows.append((name+' | idle reference / candidate',frame_image(baseline,ref),frame_image(candidate,name)))
        required_frames=set(cfg.get('requiredLandmarkFrames',[]))
        for name in candidate['data']['frames']:
            if name.rsplit('/',1)[-1].rsplit('_',2)[0] in cfg.get('requiredLandmarkClips',[]):required_frames.add(name)
        for required in sorted(required_frames):
            if required not in covered:report['failures'].append('Missing explicit landmarks: '+required)
    report.update(passed=not report['failures'],idleOnly=idle_only,idleFrameCount=len(report['idleFrames']),landmarkFrameCount=len(report['landmarks']))
    (output/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    contact_sheet(rows,output)
    print(json.dumps({k:report[k] for k in ('passed','idleOnly','idleFrameCount','landmarkFrameCount','artApproved','failures')},ensure_ascii=False,indent=2))
    return report['passed']

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config',type=Path,default=DEFAULT)
    parser.add_argument('--output',type=Path)
    parser.add_argument('--idle-only',action='store_true',help='Palette/registration preservation check before motion art is ready')
    args=parser.parse_args()
    raise SystemExit(0 if verify(args.config,args.output,args.idle_only) else 1)
