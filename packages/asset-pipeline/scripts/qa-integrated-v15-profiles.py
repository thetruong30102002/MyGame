"""Read-only artwork registration proposals using actual approved idle profiles.

Fits one complete-character scale/grid translation against head, neck/torso,
shoulders and belt simultaneously, keeping the contact-foot anchor. It never
warps a part or approves art. A profile-fit subfolder contains proposed native
frames for a human anatomy/gait review, separate from the original trace.
"""
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
import argparse,copy,importlib.util,json,statistics

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('prep',HERE/'prepare-integrated-v15.py')
prep=importlib.util.module_from_spec(spec);spec.loader.exec_module(prep)

def profile_fit(trace_path):
    trace_path=trace_path.resolve()
    cfg=json.loads(trace_path.read_text(encoding='utf8'))
    raw=Image.open(prep.B/cfg['source']).convert('RGBA');reg=cfg['registration'];count=cfg['count'];cols=cfg['columns']
    idle=prep.exact_idle(cfg['state'],cfg['direction'])
    hair=reg['idleHairBounds'];crown=hair[1];cx=round((hair[0]+hair[2])/2)
    # Boot window excludes held sword/staff tips and uses the true saved pixels.
    boot=idle.getchannel('A').crop((cx-14,110,cx+14,144)).getbbox()
    if not boot:raise ValueError('No approved central boot sole')
    target_sole=110+boot[3]-1
    # The comparison deliberately includes four anatomical regions. Hair width
    # or crown-to-sole height alone cannot select this uniform scale.
    regions=[
        ('head',(hair[0]-1,max(40,crown-2),hair[2]+1,min(85,hair[3]+4)),2.0),
        ('neck-torso',(cx-10,max(76,hair[3]+1),cx+10,107),2.0),
        ('shoulders',(cx-18,max(78,hair[3]+2),cx+18,min(98,hair[3]+15)),1.0),
        ('belt',(cx-13,96,cx+13,108),1.5),
    ]
    refparts={n:idle.crop(b) for n,b,w in regions}
    measures=cfg['measurements'];row_floors=list(reg['rowFloor'])
    if cfg['kind']=='run':
        # Ground contacts are 0 and 4 in each separate 8-phase run source.
        row_floors=[measures[r*cols]['floor'] for r in range(count//cols)]
    phases=[0,4] if count==8 else [0,count-1] if count==12 else [0,4]
    tiles={i:raw.crop(measures[i]['bounds']) for i in phases}
    def render(i,scale,dx=0):
        row,col=divmod(i,cols);b=measures[i]['bounds'];rootx=reg.get('columnRootX',[col*raw.width/cols+reg['rootX'] for col in range(cols)])[col]
        tx=72+dx-(rootx-b[0])*scale;ty=target_sole-(row_floors[row]-b[1])*scale
        im=tiles[i].transform((144,144),Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.BICUBIC)
        im.putalpha(im.getchannel('A').point(lambda v:255 if v>=96 else 0))
        # Transparent RGB must not affect profile registration cost.
        zero=Image.new('RGBA',im.size);zero.alpha_composite(im)
        return zero
    def errors(im):
        out={}
        for n,b,w in regions:
            part=im.crop(b);ref=refparts[n];delta=ImageChops.difference(part,ref)
            out[n]=sum(ImageStat.Stat(delta).mean)/4/255
        return out
    def score(scale,dx):
        per=[errors(render(i,scale,dx)) for i in phases]
        errs={n:statistics.mean(p[n] for p in per) for n,b,w in regions}
        return sum(errs[n]*w for n,b,w in regions)/sum(w for n,b,w in regions),errs
    body_seed=(target_sole-crown+1)/reg['referenceBodyHeight']
    head_seed=(reg.get('idleHeadSilhouetteBounds',[0,0,0,0])[2]-reg.get('idleHeadSilhouetteBounds',[0,0,0,0])[0])/reg.get('sourceMedianHeadWidth',1)
    seeds=[s for s in [reg['scale'],body_seed,head_seed] if s>0]
    low=min(seeds)*.78;high=max(seeds)*1.22
    proposals=[]
    for n in range(49):
        scale=low+(high-low)*n/48
        for dx in [-1,0,1]:
            err,detail=score(scale,dx);proposals.append((err,scale,dx,detail))
    best=min(proposals,key=lambda p:p[0])
    fine=[]
    radius=(high-low)/48
    for n in range(17):
        scale=best[1]-radius+radius*n/8
        for dx in [best[2]-.5,best[2],best[2]+.5]:
            err,detail=score(scale,dx);fine.append((err,scale,dx,detail))
    best=min(fine,key=lambda p:p[0]);err,scale,dx,detail=best
    out=trace_path.parent/'profile-fit';out.mkdir(exist_ok=True)
    proposal=copy.deepcopy(cfg);pr=proposal['registration'];pr['scale']=scale;pr['rowFloor']=row_floors;pr['targetRootY']=target_sole
    pr['columnRootX']=[x-dx/scale for x in reg['columnRootX']]
    pr['scaleMode']='multi-profile-proposal-unreviewed'
    proposal['artApproved']=False;proposal['registrationApproved']=False
    proposal['profileFit']=dict(reference='exact saved baseline native idle',targetSole=target_sole,
        crownProxy=crown,regions=[dict(name=n,bounds=b,weight=w) for n,b,w in regions],
        contactPhases=phases,score=err,regionError=detail,uniformScale=scale,uniformNativeDx=dx,
        warning='Proposal only. Inspect crown/chin/shoulder/belt/knee/sole and gait; reject incompatible source anatomy.')
    p=out/'trace.json';p.write_text(json.dumps(proposal,indent=2)+'\n',encoding='utf8')
    prep.render_trace(p)
    return dict(source=cfg['source'],trace=str(p.relative_to(prep.B)).replace('\\','/'),
        state=cfg['state'],direction=cfg['direction'],kind=cfg['kind'],scale=scale,score=err,
        regionError=detail,targetSole=target_sole,referenceCrownProxy=crown,artApproved=False,registrationApproved=False)

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--trace',type=Path,required=True)
    args=ap.parse_args();print(json.dumps(profile_fit(args.trace),indent=2))
