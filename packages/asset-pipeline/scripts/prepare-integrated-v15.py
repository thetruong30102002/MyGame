"""Trace complete candidate actors and assemble V15 canonical native sheets.

This tool never draws, separates or warps body parts. It traces whole connected
actors, applies one uniform scale per source candidate and fixed row roots, and
copies complete frames into a canonical 144-pixel grid. Production export is a
separate, explicitly approved step.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import argparse, colorsys, hashlib, importlib.util, json, statistics

P=Path(__file__).resolve().parents[3]
B=P/'assets/player-integrated/source-art/fullhero-v15'
DIRS=['S','E','N','SE','NE']
FONT=ImageFont.truetype('C:/Windows/Fonts/consola.ttf',12)

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()

def components(raw):
    a=raw.getchannel('A');w,h=raw.size;pixels=a.load()
    pts={(x,y) for y in range(h) for x in range(w) if pixels[x,y]>=32}
    found=[]
    while pts:
        todo=[pts.pop()];c=todo[:]
        while todo:
            x,y=todo.pop()
            for dy in [-1,0,1]:
                for dx in [-1,0,1]:
                    n=(x+dx,y+dy)
                    if n in pts: pts.remove(n);todo.append(n);c.append(n)
        if len(c)>=40:
            box=[min(x for x,y in c),min(y for x,y in c),max(x for x,y in c)+1,max(y for x,y in c)+1]
            found.append(dict(area=len(c),bounds=box,pixels=c))
    return sorted(found,key=lambda c:-c['area'])

def isolate(raw,c):
    out=Image.new('RGBA',raw.size);a=Image.new('L',raw.size);px=a.load()
    for x,y in c['pixels']:px[x,y]=raw.getpixel((x,y))[3]
    out.paste(raw);out.putalpha(a)
    return out

def neutral_hair_box(raw,actor,bounds):
    """Diagnostic largest neutral cluster within a traced head window."""
    x0,y0,x1,y1=bounds;px=raw.load();pts=set()
    for x,y in actor['pixels']:
        if x0<=x<x1 and y0<=y<y1:
            r,g,b,a=px[x,y];_,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
            if a>=96 and s<.31 and v>.28:pts.add((x,y))
    best=[]
    while pts:
        todo=[pts.pop()];c=todo[:]
        while todo:
            x,y=todo.pop()
            for dy in [-1,0,1]:
                for dx in [-1,0,1]:
                    n=x+dx,y+dy
                    if n in pts:pts.remove(n);todo.append(n);c.append(n)
        if len(c)>len(best):best=c
    if not best:raise ValueError('No neutral hair cluster in traced window')
    return [min(x for x,y in best),min(y for x,y in best),max(x for x,y in best)+1,max(y for x,y in best)+1]

def alpha_head_box(raw,actor,bounds):
    bounds=tuple(round(v) for v in bounds)
    tile=isolate(raw,actor).crop(bounds)
    tile.putalpha(tile.getchannel('A').point(lambda v:255 if v>=96 else 0))
    head=components(tile)[0]['bounds']
    return [head[0]+bounds[0],head[1]+bounds[1],head[2]+bounds[0],head[3]+bounds[1]]

def exact_idle(state,direction):
    base=B/'baseline';j=json.loads((base/'player_integrated.json').read_text(encoding='utf8'));a=Image.open(base/'player_integrated.png').convert('RGBA')
    suffix='' if state=='none' else state;name=f'player_integrated/idle{suffix}_{direction}_0'
    f=j['frames'][name];r=f['frame'];s=f['spriteSourceSize'];im=Image.new('RGBA',(144,144));im.paste(a.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])),(s['x'],s['y']))
    return im

def trace(path,state,direction,kind,neutral=None,overrides=None,scale_mode='neutral-body'):
    if kind not in ['locomotion','walk','run','attack','cast']:raise ValueError(kind)
    count=16 if kind=='locomotion' else 8 if kind in ['walk','run'] else 12
    cols=4;rows=count//cols;raw=Image.open(path).convert('RGBA')
    all_components=components(raw)
    if len(all_components)<count:raise ValueError(f'Only {len(all_components)} complete objects for {count} poses: {path}')
    selected=all_components[:count]
    if min(c['area'] for c in selected)<max(c['area'] for c in selected)*.30:
        raise ValueError('Large actor area mismatch; manually review split/connected objects')
    selected.sort(key=lambda c:(c['bounds'][1]+c['bounds'][3])/2)
    ordered=[]
    for r in range(rows):
        ordered.extend(sorted(selected[r*4:(r+1)*4],key=lambda c:(c['bounds'][0]+c['bounds'][2])/2))
    measures=[];cw=raw.width/4
    for i,c in enumerate(ordered):
        r,col=divmod(i,4);im=isolate(raw,c);a=im.getchannel('A').point(lambda v:255 if v>=96 else 0)
        crown_window=(round((col+.42)*cw),c['bounds'][1],round((col+.68)*cw),c['bounds'][3])
        boot_window=(round((col+.34)*cw),round(c['bounds'][1]+(c['bounds'][3]-c['bounds'][1])*.60),round((col+.73)*cw),c['bounds'][3])
        cr=a.crop(crown_window).getbbox();bt=a.crop(boot_window).getbbox()
        if not cr or not bt:raise ValueError(f'Empty anatomy windows frame{i}')
        crown=cr[1]+crown_window[1];floor=bt[3]+boot_window[1]-1
        sole_window=(boot_window[0],floor-max(5,round((floor-crown)*.05)),boot_window[2],floor+1)
        sb=a.crop(sole_window).getbbox();rx=(sb[0]+sb[2]-1)/2+sole_window[0]-col*cw
        measures.append(dict(frame=i,row=r,column=col,bounds=c['bounds'],area=c['area'],crown=crown,floor=floor,height=floor-crown+1,rootX=rx))
    neutral=neutral or ([0,7] if count in [8,16] else [0,10,11])
    height=statistics.median(measures[i]['height'] for i in neutral)
    rootx=statistics.median(measures[i]['rootX'] for i in neutral)
    floors=[statistics.median(m['floor'] for m in measures if m['row']==r) for r in range(rows)]
    # Trace the source grid's actual horizontal spacing. Generator gutters do
    # not reliably equal width/4. A single fitted grid origin and step retains
    # pose sway; this is not a separate sprite/part fit for each phase.
    grid_frames=list(range(8)) if kind in ['locomotion','walk','run'] else neutral
    points=[]
    head_widths=[]
    for i in grid_frames:
        m=measures[i];bb=neutral_hair_box(raw,ordered[i],(m['column']*cw,m['crown'],(m['column']+1)*cw,m['crown']+m['height']*.38))
        m['hairBounds']=bb;points.append((m['column'],(bb[0]+bb[2])/2))
        hb=alpha_head_box(raw,ordered[i],(m['column']*cw,m['crown'],(m['column']+1)*cw,m['crown']+height*.33))
        m['headSilhouetteBounds']=hb;head_widths.append(hb[2]-hb[0])
    avgx=statistics.mean(x for x,y in points);avgy=statistics.mean(y for x,y in points)
    step=sum((x-avgx)*(y-avgy) for x,y in points)/sum((x-avgx)**2 for x,y in points)
    origin=avgy-step*avgx
    idle=exact_idle(state,direction);idle_actor=components(idle)[0]
    idle_hair=neutral_hair_box(idle,idle_actor,(40,44,105,84));idle_head_x=(idle_hair[0]+idle_hair[2])/2
    idle_head=alpha_head_box(idle,idle_actor,(40,idle_hair[1]-2,105,idle_hair[1]+24))
    scale=(idle_head[2]-idle_head[0])/statistics.median(head_widths) if scale_mode=='head' else 73/height
    column_roots=[origin+col*step-(idle_head_x-72)/scale for col in range(cols)]
    config=dict(version=15,source=str(path.resolve().relative_to(B)).replace('\\','/'),sourceSha256=sha(path),
        state=state,direction=direction,kind=kind,count=count,columns=cols,sourceSize=list(raw.size),
        neutralFrames=neutral,measurements=measures,
        registration=dict(scale=scale,referenceBodyHeight=height,rootX=rootx,rowFloor=floors,
            columnRootX=column_roots,sourceGridHeadOrigin=origin,sourceGridHeadStep=step,idleHairBounds=idle_hair,
            scaleMode=scale_mode,idleHeadSilhouetteBounds=idle_head,sourceMedianHeadWidth=statistics.median(head_widths)),
        artApproved=False,registrationApproved=False)
    if overrides:config['registration'].update(overrides)
    name=path.stem;out=B/'traces'/name;out.mkdir(parents=True,exist_ok=True)
    config_path=out/'trace.json';config_path.write_text(json.dumps(config,indent=2)+'\n',encoding='utf8')
    render_trace(config_path,ordered)
    return config_path

def render_trace(config_path,known_components=None):
    cfg=json.loads(config_path.read_text(encoding='utf8'));path=B/cfg['source']
    if sha(path)!=cfg['sourceSha256']:raise ValueError('Candidate changed after trace')
    raw=Image.open(path).convert('RGBA');count=cfg['count'];cols=cfg['columns'];rows=count//cols;cw=raw.width/cols
    if known_components is None:
        found=components(raw);by_bounds={tuple(c['bounds']):c for c in found}
        known_components=[by_bounds[tuple(m['bounds'])] for m in cfg['measurements']]
    reg=cfg['registration'];scale=reg['scale'];out=config_path.parent
    idle=exact_idle(cfg['state'],cfg['direction'])
    contact=Image.new('RGBA',(144*(cols+1),174*rows),(29,31,34,255));draw=ImageDraw.Draw(contact)
    records=[]
    for row in range(rows):
        contact.alpha_composite(idle,(0,row*174));draw.text((3,row*174+140),'EXACT IDLE',font=FONT,fill='white')
        for col in range(cols):
            i=row*cols+col;c=known_components[i];tile=isolate(raw,c)
            source_root_x=reg.get('columnRootX',[col*cw+reg['rootX'] for col in range(cols)])[col]
            tx=72-source_root_x*scale;ty=reg.get('targetRootY',128)-reg['rowFloor'][row]*scale
            # Preserve prior trace receipts; new native-pixel traces can explicitly
            # select point sampling to avoid blending outlines during reduction.
            sampling=cfg.get('resampling','bicubic')
            if sampling not in ['nearest','bicubic']:raise ValueError('Unknown trace resampling: '+sampling)
            im=tile.transform((144,144),Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.NEAREST if sampling=='nearest' else Image.Resampling.BICUBIC)
            im.putalpha(im.getchannel('A').point(lambda v:255 if v>=96 else 0))
            im.save(out/f'frame-{i:02}.png');x=(col+1)*144;y=row*174;contact.alpha_composite(im,(x,y));draw.text((x+3,y+140),f"{cfg['kind']} {i:02}",font=FONT,fill='white')
            b=c['bounds'];mapped=[b[0]*scale+tx,b[1]*scale+ty,b[2]*scale+tx,b[3]*scale+ty]
            records.append(dict(frame=i,nativeBounds=im.getbbox(),sourceEdgeContact=(b[0]==0 or b[1]==0 or b[2]==raw.width or b[3]==raw.height),logicalClipping=not(0<=mapped[0]<=mapped[2]<=144 and 0<=mapped[1]<=mapped[3]<=144)))
        draw.line((0,row*174+128,contact.width,row*174+128),fill=(80,125,80))
    contact.convert('RGB').save(out/'contact-native.png');contact.resize((contact.width*4,contact.height*4),Image.Resampling.NEAREST).convert('RGB').save(out/'contact-4x.png')
    (out/'frame-checks.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf8')
    return cfg

def assemble(selection_path):
    selection=json.loads(selection_path.read_text(encoding='utf8'))
    traces=[]
    for item in selection['traces']:
        trace_path=B/item['path'];cfg=render_trace(trace_path)
        if not item.get('approved') or not cfg.get('artApproved') or not cfg.get('registrationApproved'):
            raise ValueError('Assembly requires explicitly approved art and registration: '+str(trace_path))
        checks=json.loads((trace_path.parent/'frame-checks.json').read_text())
        if any(c['logicalClipping'] for c in checks):raise ValueError('Clipped complete pose: '+str(trace_path))
        traces.append((trace_path,cfg))
    by_action={}
    lineage=[]
    for path,cfg in traces:
        suffix='' if cfg['state']=='none' else cfg['state']
        order=cfg.get('phaseOrder',list(range(cfg['count'])))
        if len(order)!=cfg['count'] or any(type(i)!=int or not 0<=i<cfg['count'] for i in order):
            raise ValueError('phaseOrder must select complete native frames within this candidate')
        lineage.append(dict(trace=str(path.resolve().relative_to(B)).replace('\\','/'),traceSha256=sha(path),
            source=cfg['source'],sourceSha256=cfg['sourceSha256'],state=cfg['state'],direction=cfg['direction'],kind=cfg['kind'],
            phaseOrder=order,registration=cfg['registration']))
        actions=[('walk'+suffix,0,8),('run'+suffix,8,8)] if cfg['kind']=='locomotion' else [(cfg['kind']+suffix if cfg['kind'] in ['walk','run'] else cfg['kind'],0,cfg['count'])]
        for action,start,count in actions:
            if (action,cfg['direction']) in by_action:raise ValueError('Duplicate action/direction selection')
            by_action[action,cfg['direction']]=(path,start,count,order)
    cfg14=json.loads((B.parent/'fullhero-v14/registration.json').read_text(encoding='utf8'))
    cfg14['id']='player_integrated';cfg14['artApproved']=False
    cfg14['pipelineVersion']=15
    cfg14['paletteReference']=dict(image='baseline/player_integrated.png',
        sha256=sha(B/'baseline/player_integrated.png'),colors='baseline/player_integrated.palette.json',
        atlas='baseline/player_integrated.json',proof='baseline/player_integrated.provenance.json',
        lockedActions=['idle','idlesword','idlestaff'])
    cfg14['completeSourceAssembly']=dict(wholeActorOnly=True,selectionSha256=sha(selection_path),records=lineage)
    cfg14['sheets']=[s for s in cfg14['sheets'] if s['groups'][0]['action'].startswith('idle') or s['groups'][0]['action'].startswith('hit') or s['groups'][0]['action'] in ['walk','run']]
    # Existing idle and reaction references are relative to their original V14 directory.
    for sheet in cfg14['sheets']:
        sheet['file']=str((B.parent/'fullhero-v14'/sheet['file']).resolve().relative_to(B.parent)).replace('\\','/')
        sheet['file']='../'+sheet['file']
    for action in ['walksword','runsword','walkstaff','runstaff','attack','cast']:
        if not all((action,d) in by_action for d in DIRS):raise ValueError('Missing selected complete direction: '+action)
        count=by_action[action,'S'][2];im=Image.new('RGBA',(144*count,144*5))
        for row,d in enumerate(DIRS):
            path,start,n,order=by_action[action,d]
            if n!=count:raise ValueError('Direction frame counts differ')
            for phase in range(n):im.paste(Image.open(path.parent/f'frame-{order[start+phase]:02}.png').convert('RGBA'),(phase*144,row*144))
        name=action+'-canonical.png';im.save(B/name)
        weapon='sword' if action.endswith('sword') or action=='attack' else 'staff' if action.endswith('staff') or action=='cast' else 'none'
        sheet=dict(file=name,columns=count,rows=5,directions=DIRS,referenceSize=[144,144],referenceRoot=[72,128],groups=[dict(action=action,firstColumn=0,frames=count,fps=16 if action in ['attack','cast'] else 12 if action.startswith('run') else 9,loop=action not in ['attack','cast'],hitFrame=7 if action=='attack' else 6 if action=='cast' else -1,weapon=weapon)])
        cfg14['sheets'].append(sheet)
    (B/'registration.json').write_text(json.dumps(cfg14,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('Canonical complete sheets assembled; artApproved remains false. No production export performed.')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);sub=parser.add_subparsers(dest='mode',required=True)
    t=sub.add_parser('trace');t.add_argument('--file',type=Path,required=True);t.add_argument('--state',choices=['none','sword','staff'],required=True);t.add_argument('--direction',choices=DIRS,required=True);t.add_argument('--kind',choices=['locomotion','walk','run','attack','cast'],required=True);t.add_argument('--neutral',type=json.loads);t.add_argument('--overrides',type=json.loads);t.add_argument('--scale-mode',choices=['head','neutral-body'],default='neutral-body')
    r=sub.add_parser('review');r.add_argument('--trace',type=Path,required=True)
    a=sub.add_parser('assemble');a.add_argument('--selection',type=Path,required=True)
    args=parser.parse_args()
    if args.mode=='trace':print(trace(args.file,args.state,args.direction,args.kind,args.neutral,args.overrides,args.scale_mode))
    elif args.mode=='review':render_trace(args.trace)
    else:assemble(args.selection)
