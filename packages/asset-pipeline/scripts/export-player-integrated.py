"""Export ONE fully drawn character through the standard character pipeline.

Every input cell is a complete clothed person, optionally holding one baked
weapon. No body-part masks, attachment points, weapon sprites or compositing.
Only a fixed full-family registration and exact westward raster reflection.
"""
from pathlib import Path
import argparse,hashlib,json,math
from PIL import Image,ImageChops

ROOT=Path(__file__).resolve().parents[3]
DEFAULT=ROOT/'assets/player-integrated/source-art/fullhero-v14/registration.json'
ID='player_integrated';N=144;ROOT_POINT=(72,128)
DIRS=['S','SW','W','NW','N','NE','E','SE'];DRAWN=['S','E','N','SE','NE']
MIRROR={'W':'E','SW':'SE','NW':'NE'}
CORE={'idle':4,'walk':8,'run':8,'idlesword':4,'walksword':8,'runsword':8,
      'idlestaff':4,'walkstaff':8,'runstaff':8,'attack':12,'cast':12}

def example():
    sheets=[]
    for state,suffix in [('none',''),('sword','sword'),('staff','staff')]:
        for action,count,fps in [('idle',4,6),('walk',8,9),('run',8,12)]:
            sheets.append(dict(file=f'../{action}-{state}-drawn.png',columns=count,rows=5,directions=DRAWN,
                groups=[dict(action=action+suffix,firstColumn=0,frames=count,fps=fps,loop=True,hitFrame=-1,weapon=state)]))
    for action,state in [('attack','sword'),('cast','staff')]:
        sheets.append(dict(file=f'../{action}-{state}-drawn.png',columns=12,rows=5,directions=DRAWN,
            groups=[dict(action=action,firstColumn=0,frames=12,fps=16,loop=False,hitFrame=6,weapon=state)]))
    for state,suffix in [('none',''),('sword','sword'),('staff','staff')]:
        sheets.append(dict(file=f'../reactions-{state}-drawn.png',columns=12,rows=5,directions=DRAWN,
            groups=[dict(action=a+suffix,firstColumn=i*4,frames=4,fps=10,loop=False,hitFrame=-1,weapon=state)
                    for i,a in enumerate(['hit','dodge','death'])]))
    return dict(id=ID,displayName='Lữ khách · bản liền nét',role='player',fullyDrawn=True,
        frameSize=[N,N],root=list(ROOT_POINT),bodyHeight=74,ppu=48,maxColors=128,alphaThreshold=235,
        registration={d:dict(scale=1.0,translate=[0,0]) for d in DRAWN},
        sheets=sheets,aliases={},artApproved=False)

def train_palette(images,count):
    """Keep the original V14 training order when locking its palette for new art."""
    from collections import Counter
    colors=Counter()
    for im in images:
        for number,c in im.getcolors(N*N):
            if c[3]:colors[c[:3]]+=number
    if len(colors)<=count:return None
    divisor=max(1,sum(colors.values())//150000);samples=[]
    for c,n in colors.items():samples.extend([c]*max(1,n//divisor))
    sample=Image.new('RGB',(len(samples),1));sample.putdata(samples)
    return sample.quantize(colors=count,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)

def load_palette_reference(reference,source,count):
    """Load a fixed palette, optionally retaining the original Pillow index order.

    Config accepts an image path, or {image, sha256, colors}. ``colors`` is a JSON
    sidecar with imageSha256 and the original 768-byte Pillow palette. Reordering
    an otherwise identical set of RGB colors can change Pillow's lookup results,
    and its internal lookup cache can still change results. Exact legacy-frame
    preservation therefore uses explicit lockedActions and the native pixel gate.
    """
    spec=dict(image=reference) if isinstance(reference,str) else reference
    if not isinstance(spec,dict) or not spec.get('image'):
        raise ValueError('paletteReference requires an image path')
    path=(source/spec['image']).resolve();digest=hashlib.sha256(path.read_bytes()).hexdigest()
    if spec.get('sha256') and spec['sha256']!=digest:
        raise ValueError('Locked palette reference image SHA256 differs')
    reference_image=Image.open(path).convert('RGBA')
    colors=sorted({c[:3] for c in reference_image.getdata() if c[3]})
    if not colors or len(colors)>256 or (count and len(colors)>count):
        raise ValueError('Palette reference exceeds the configured color limit')
    metadata=dict(image=spec['image'],sha256=digest,colorCount=len(colors))
    if spec.get('colors'):
        sidecar_path=(source/spec['colors']).resolve();sidecar=json.loads(sidecar_path.read_text(encoding='utf-8-sig'))
        entries=sidecar.get('palette')
        if sidecar.get('imageSha256')!=digest or not isinstance(entries,list) or len(entries)!=768 or any(type(v)!=int or not 0<=v<=255 for v in entries):
            raise ValueError('Palette sidecar is invalid or not bound to the reference image')
        active=sidecar.get('activeColors',len(colors))
        if active!=len(colors) or {tuple(entries[i:i+3]) for i in range(0,active*3,3)}!=set(colors):
            raise ValueError('Palette sidecar colors differ from the locked image')
        metadata.update(colors=spec['colors'],colorsSha256=hashlib.sha256(sidecar_path.read_bytes()).hexdigest(),originalIndexOrder=True)
    else:
        entries=[v for c in colors for v in c]
        entries+=entries[-3:]*(256-len(colors))
        metadata['originalIndexOrder']=False
    palette=Image.new('P',(1,1));palette.putpalette(entries)
    return palette,metadata

def preserve_reference_actions(images,records,reference,source,metadata):
    """Retain complete approved frames whose source/registration is unchanged.

    Pillow quantization uses a palette lookup cache as well as RGB entries; a
    fixed RGB palette alone cannot guarantee byte-identical old idle frames.
    Explicit lockedActions copy whole native baseline frames after quantization,
    guarded by the original source hash and exact registration for every frame.
    """
    if not isinstance(reference,dict) or not reference.get('lockedActions'):return images
    actions=reference['lockedActions']
    if not isinstance(actions,list) or not actions or any(a not in ('idle','idlesword','idlestaff') for a in actions):
        raise ValueError('Only approved idle actions may be locked to a palette reference')
    if not reference.get('atlas'):raise ValueError('lockedActions requires the reference atlas JSON')
    atlas_path=(source/reference['atlas']).resolve();data=json.loads(atlas_path.read_text(encoding='utf-8-sig'))
    image_path=(atlas_path.parent/data['meta']['image']).resolve()
    if hashlib.sha256(image_path.read_bytes()).hexdigest()!=metadata['sha256']:
        raise ValueError('Locked frame atlas differs from the palette reference image')
    proof_path=(source/reference['proof']).resolve() if reference.get('proof') else atlas_path.with_suffix('.provenance.json')
    proof=json.loads(proof_path.read_text(encoding='utf-8-sig'))
    if proof.get('atlasSha256')!=metadata['sha256'] or not proof.get('artApproved') or proof.get('pending'):
        raise ValueError('Locked idle frames require approved provenance for the reference image')
    old_records={r['name']:r for r in proof['records']};atlas=Image.open(image_path).convert('RGBA')
    source_hashes={};locked_names=set();out=list(images)
    for i,record in enumerate(records):
        if record['action'] not in actions:continue
        old=old_records.get(record['name'])
        if old is None:raise ValueError('Locked idle frame missing from baseline: '+record['name'])
        for key in ('action','direction','phase','sourceCell','registrationDirection','registration','mirrored','weapon'):
            if record.get(key)!=old.get(key):raise ValueError('Locked idle registration changed: '+record['name']+'/'+key)
        expected=[v for k,v in proof['sourceSha256'].items() if Path(k).name==Path(old['source']).name]
        if len(expected)!=1:raise ValueError('Ambiguous locked idle source hash: '+old['source'])
        path=(ROOT/record['source']).resolve()
        if path not in source_hashes:source_hashes[path]=hashlib.sha256(path.read_bytes()).hexdigest()
        if source_hashes[path]!=expected[0]:raise ValueError('Locked idle source pixels changed: '+str(path))
        f=data['frames'][record['name']];r=f['frame'];s=f['spriteSourceSize']
        if f.get('rotated') or f['sourceSize']!={'w':N,'h':N} or f['anchor']!={'x':ROOT_POINT[0]/N,'y':ROOT_POINT[1]/N}:
            raise ValueError('Locked idle canvas/root contract differs: '+record['name'])
        restored=Image.new('RGBA',(N,N));restored.paste(atlas.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])),(s['x'],s['y']))
        out[i]=restored;record['paletteReferenceLocked']=True
        record['nativeRgbaSha256']=hashlib.sha256(restored.tobytes()).hexdigest();locked_names.add(record['name'])
    expected_names={r['name'] for r in proof['records'] if r['action'] in actions}
    if locked_names!=expected_names:raise ValueError('Candidate does not contain every locked idle frame')
    metadata.update(atlas=reference['atlas'],atlasJsonSha256=hashlib.sha256(atlas_path.read_bytes()).hexdigest(),
                    proofSha256=hashlib.sha256(proof_path.read_bytes()).hexdigest(),lockedActions=actions,lockedFrameCount=len(locked_names))
    return out

def palette_family(images,count,palette=None):
    if palette is None:
        if not count:return images
        palette=train_palette(images,count)
        if palette is None:return images
    out=[]
    for im in images:
        mapped=im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGB');alpha=im.getchannel('A')
        out.append(Image.merge('RGBA',tuple(ImageChops.multiply(c,alpha) for c in mapped.split())+(alpha,)))
    return out

def source_cell_box(raw,sheet,col,row,direction):
    """Explicit row cuts handle generator margins without changing pose geometry."""
    cols,rows=sheet['columns'],sheet['rows']
    x_ranges=sheet.get('columnRanges')
    y_ranges=sheet.get('rowRanges',{}).get(direction)
    left,right=x_ranges[col] if x_ranges else (round(col*raw.width/cols),round((col+1)*raw.width/cols))
    top,bottom=y_ranges if y_ranges else (round(row*raw.height/rows),round((row+1)*raw.height/rows))
    padding=sheet.get('cellPadding',0)
    left-=padding;right+=padding
    if not (-padding<=left<right<=raw.width+padding and 0<=top<bottom<=raw.height):
        raise ValueError(f'Invalid authored grid cell: {left,top,right,bottom} within {raw.size}')
    return left,top,right,bottom

def select_complete_actor(tile):
    """Extract one painted actor, excluding a neighbouring cell's stray blade.

    Work before native resampling. No anatomy, weapon pixels or outlines are
    repainted; the main connected transparent-background object is retained.
    """
    alpha=tile.getchannel('A');coords=set()
    for y in range(tile.height):
        for x,v in enumerate(alpha.crop((0,y,tile.width,y+1)).getdata()):
            if v>=32:coords.add((x,y))
    largest=[]
    while coords:
        first=coords.pop();todo=[first];component=[first]
        while todo:
            x,y=todo.pop()
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1),(x-1,y-1),(x+1,y-1),(x-1,y+1),(x+1,y+1)):
                if (nx,ny) in coords:
                    coords.remove((nx,ny));todo.append((nx,ny));component.append((nx,ny))
        if len(component)>len(largest):largest=component
    if not largest:raise ValueError('No complete painted foreground object')
    mask=Image.new('L',tile.size);pixels=mask.load()
    for x,y in largest:pixels[x,y]=255
    result=tile.copy();result.putalpha(ImageChops.multiply(alpha,mask))
    return result

def register_complete(tile,cfg,sheet,direction):
    """One uniform whole-sprite affine, fixed for every phase in this source row."""
    tile=tile.copy()
    if sheet.get('selectCompleteActor'):tile=select_complete_actor(tile)
    for rect in sheet.get('clearRects',[]):tile.paste((0,0,0,0),tuple(rect))
    coverage=cfg.get('coverageResampling',False)
    if not coverage:tile.putalpha(tile.getchannel('A').point(lambda a:255 if a>=cfg.get('alphaThreshold',235) else 0))
    bounds=tile.getbbox()
    if not bounds:raise ValueError(f'Empty complete source actor: {direction}')
    raw_registration=sheet.get('rawRegistration',{}).get(direction)
    if raw_registration:
        scale=raw_registration['scale'];tx,ty=raw_registration['translate']
        # Raw pixels retain their aspect ratio even when the generated grid is rectangular.
        # This traced row transform is reused unchanged for every animation phase.
        mapped=(bounds[0]*scale+tx,bounds[1]*scale+ty,bounds[2]*scale+tx,bounds[3]*scale+ty)
        if mapped[0]<-.5 or mapped[1]<-.5 or mapped[2]>N+.5 or mapped[3]>N+.5:
            raise ValueError(f'Fixed raw whole-row transform clips {direction}: {mapped}')
        im=tile.transform((N,N),Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.BICUBIC if coverage else Image.Resampling.NEAREST)
        if coverage:im.putalpha(im.getchannel('A').point(lambda a:255 if a>=cfg.get('coverageAlphaThreshold',96) else 0))
        return im,dict(mode='uniform-raw-affine',**raw_registration)
    transform=cfg['registration'][direction];scale=transform['scale']
    reference_size=sheet.get('referenceSize',cfg['frameSize']);reference_root=sheet.get('referenceRoot',cfg['root'])
    tx=ROOT_POINT[0]-round(reference_root[0]*scale)+transform['translate'][0]
    ty=ROOT_POINT[1]-round(reference_root[1]*scale)+transform['translate'][1]
    tile=tile.resize((round(reference_size[0]*scale),round(reference_size[1]*scale)),Image.Resampling.NEAREST)
    bounds=tile.getbbox()
    if bounds[0]+tx<0 or bounds[1]+ty<0 or bounds[2]+tx>N or bounds[3]+ty>N:
        raise ValueError(f'Fixed whole-family transform clips {direction}: {bounds}, {tx,ty}')
    im=Image.new('RGBA',(N,N));im.alpha_composite(tile,(tx,ty))
    return im,dict(mode='known-reference-grid',**transform,referenceSize=reference_size,referenceRoot=reference_root,destinationTranslate=[tx,ty])

def crop_box(im):
    b=im.getbbox()
    if not b:raise ValueError('An authored full-character frame is empty')
    l=max(0,min(b[0],ROOT_POINT[0])-1);t=max(0,min(b[1],ROOT_POINT[1])-1)
    r=min(N,max(b[2],ROOT_POINT[0]+1)+1);bottom=min(N,max(b[3],ROOT_POINT[1]+1)+1)
    return l,t,r,bottom

def pack(images):
    rects=[(i,crop_box(im)) for i,im in enumerate(images)]
    for size in [2048,4096]:
        x=y=shelf=0;placements={};valid=True
        for i,b in sorted(rects,key=lambda pair:(-(pair[1][3]-pair[1][1]),-(pair[1][2]-pair[1][0]),pair[0])):
            w,h=b[2]-b[0],b[3]-b[1]
            if x+w>size:x=0;y+=shelf;shelf=0
            if y+h>size:valid=False;break
            placements[i]=(x,y,b);x+=w;shelf=max(shelf,h)
        if valid:
            atlas=Image.new('RGBA',(size,size))
            for i,(x,y,b) in placements.items():
                crop=images[i].crop(b);atlas.paste(crop,(x,y))
                restored=Image.new('RGBA',(N,N));restored.paste(crop,(b[0],b[1]))
                if hashlib.sha256(restored.tobytes()).digest()!=hashlib.sha256(images[i].tobytes()).digest():
                    raise ValueError('Full-character compact packing changed RGBA pixels')
            return atlas,placements
    raise ValueError('Complete character exceeds one 4096 atlas; review drawing/frame count before changing importer')

def export(config_path,merge=True,allow_pending=False):
    config_path=config_path.resolve()
    cfg=json.loads(config_path.read_text(encoding='utf-8-sig'));source=config_path.resolve().parent
    assembly=cfg.get('completeSourceAssembly')
    if assembly:
        if not assembly.get('wholeActorOnly') or not assembly.get('records'):
            raise ValueError('Complete source assembly must retain whole-actor lineage')
        for item in assembly['records']:
            for key,hash_key in [('source','sourceSha256'),('trace','traceSha256')]:
                path=(source/item[key]).resolve()
                if hashlib.sha256(path.read_bytes()).hexdigest()!=item[hash_key]:
                    raise ValueError('Approved complete source changed after assembly: '+str(path))
            traced=json.loads((source/item['trace']).read_text(encoding='utf-8-sig'))
            if not traced.get('artApproved') or not traced.get('registrationApproved'):
                raise ValueError('Complete source assembly has an unapproved trace')
    if cfg.get('id')!=ID or cfg.get('frameSize')!=[N,N] or cfg.get('root')!=list(ROOT_POINT) or cfg.get('ppu')!=48:
        raise ValueError('Integrated character contract is 144x144 / root72,128 / PPU48 / player_integrated')
    if not cfg.get('fullyDrawn'):raise ValueError('Only fully drawn complete-character source cells are supported')
    images=[];records=[];animation_specs={};animations={};lookup={}
    for sheet in cfg['sheets']:
        path=(source/sheet['file']).resolve()
        if not path.exists():
            if allow_pending:continue
            raise FileNotFoundError(path)
        raw=Image.open(path).convert('RGBA');cols,rows=sheet['columns'],sheet['rows']
        if len(sheet['directions'])!=rows:raise ValueError('One source direction per row is required')
        for group in sheet['groups']:
            action=group['action'];count=group['frames'];start=group.get('firstColumn',0)
            if action in animation_specs:raise ValueError('Duplicate drawn action '+action)
            if start+count>cols:raise ValueError('Action column group exceeds sheet')
            animation_specs[action]=dict(fps=group['fps'],frames=count,hitFrame=group.get('hitFrame',-1),loop=group['loop'],directions=DIRS)
            for direction in DIRS:
                sd=MIRROR.get(direction,direction);row=sheet['directions'].index(sd)
                names=[]
                for phase in range(count):
                    col=start+phase
                    box=source_cell_box(raw,sheet,col,row,sd)
                    im,transform=register_complete(raw.crop(box),cfg,sheet,sd)
                    if direction in MIRROR:im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                    name=f'{ID}/{action}_{direction}_{phase}';lookup[name]=len(images);images.append(im);names.append(name)
                    records.append(dict(name=name,action=action,direction=direction,phase=phase,source=str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path),
                        sourceCell=list(box),registrationDirection=sd,registration=transform,mirrored=direction in MIRROR,
                        weapon=group['weapon'],fullyClothed=True,completeSprite=True))
                animations[action+'_'+direction]=names
    if not allow_pending:
        for action,count in CORE.items():
            if action not in animation_specs or animation_specs[action]['frames']!=count:raise ValueError(f'Missing genuine drawn core clip {action}/{count}')
    for action,alias in cfg.get('aliases',{}).items():
        if action in CORE:raise ValueError('Core locomotion/combat must be genuinely drawn; no aliases: '+action)
        original=alias['source']
        if original not in animation_specs:raise ValueError('Alias source missing: '+original)
        animation_specs[action]=dict(animation_specs[original],**alias.get('timing',{}))
        for d in DIRS:
            frames=animations[original+'_'+d]
            animations[action+'_'+d]=list(reversed(frames)) if alias.get('reverse') else list(frames)
    if not images:raise ValueError('No complete character images are available')
    reference_palette=reference_metadata=None
    if cfg.get('paletteReference'):
        reference_palette,reference_metadata=load_palette_reference(cfg['paletteReference'],source,cfg.get('maxColors',128))
    images=palette_family(images,cfg.get('maxColors',128),reference_palette)
    if reference_metadata is not None:images=preserve_reference_actions(images,records,cfg['paletteReference'],source,reference_metadata)
    unique=[];hashes={};indices=[]
    for im in images:
        alpha=im.getchannel('A');im=Image.merge('RGBA',tuple(ImageChops.multiply(c,alpha) for c in im.split()[:3])+(alpha,))
        digest=hashlib.sha256(im.tobytes()).hexdigest()
        if digest not in hashes:hashes[digest]=len(unique);unique.append(im)
        indices.append(hashes[digest])
    atlas,placements=pack(unique);out=ROOT/'assets/characters'/ID;out.mkdir(parents=True,exist_ok=True)
    atlas.save(out/f'{ID}.png');frames={}
    for name,index in lookup.items():
        x,y,b=placements[indices[index]];l,t,r,bottom=b;w,h=r-l,bottom-t
        frames[name]=dict(frame=dict(x=x,y=y,w=w,h=h),rotated=False,trimmed=True,
            spriteSourceSize=dict(x=l,y=t,w=w,h=h),sourceSize=dict(w=N,h=N),anchor=dict(x=ROOT_POINT[0]/N,y=ROOT_POINT[1]/N))
    data=dict(frames=frames,animations=animations,meta=dict(app='Aether fully drawn character exporter',version=str(cfg.get('pipelineVersion',14)),image=f'{ID}.png',format='RGBA8888',size=dict(w=atlas.width,h=atlas.height),scale='1'))
    (out/f'{ID}.json').write_text(json.dumps(data,separators=(',',':'))+'\n',encoding='utf8')
    entry=dict(displayName=cfg['displayName'],role='player',atlas=f'characters/{ID}/{ID}.json',frameSize=dict(width=N,height=N),anchor=dict(x=ROOT_POINT[0]/N,y=ROOT_POINT[1]/N),
        bodyHeight=cfg['bodyHeight'],directions=DIRS,animations=animation_specs,source=dict(provider='drawn-complete-character',ref=str(config_path.relative_to(ROOT)).replace('\\','/')),notes='One complete clothed sprite per frame; weapons baked into sword/staff clips. No modular layers or gear anchors.')
    source_hashes={sheet['file']:hashlib.sha256((source/sheet['file']).resolve().read_bytes()).hexdigest() for sheet in cfg['sheets'] if (source/sheet['file']).exists()}
    proof=dict(id=ID,fullyDrawn=True,bakedWeapons=True,frameSize=[N,N],root=list(ROOT_POINT),ppu=48,bodyHeight=cfg['bodyHeight'],
        sourceSha256=source_hashes,atlasSha256=hashlib.sha256((out/f'{ID}.png').read_bytes()).hexdigest(),
        coverageResampling=cfg.get('coverageResampling',False),coverageAlphaThreshold=cfg.get('coverageAlphaThreshold',96),maxColors=cfg.get('maxColors',128),
        physicalFrames=len(unique),logicalFrames=len(frames),artApproved=cfg.get('artApproved',False),pending=allow_pending,aliases=cfg.get('aliases',{}),records=records)
    if reference_metadata is not None:proof['paletteReference']=reference_metadata
    if assembly:proof['completeSourceAssembly']=assembly
    (out/f'{ID}.provenance.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    (out/'manifest-entry.json').write_text(json.dumps(entry,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    if merge:
        if allow_pending:raise ValueError('Pending source export cannot update the production manifest')
        path=ROOT/'assets/manifest.json';manifest=json.loads(path.read_text(encoding='utf8'));manifest['characters'][ID]=entry
        path.write_text(json.dumps(manifest,ensure_ascii=False,indent='\t')+'\n',encoding='utf8')
    print(f'COMPLETE-SPRITE export: {len(frames)} logical / {len(unique)} physical; atlas{atlas.width}x{atlas.height}; no attachment layers')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--config',type=Path,default=DEFAULT)
    parser.add_argument('--example',action='store_true');parser.add_argument('--no-merge',action='store_true');parser.add_argument('--allow-pending',action='store_true')
    args=parser.parse_args()
    if args.example:
        args.config.parent.mkdir(parents=True,exist_ok=True)
        if args.config.exists():raise FileExistsError('Example will not overwrite existing registration')
        args.config.write_text(json.dumps(example(),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    else:export(args.config,not args.no_merge,args.allow_pending)
