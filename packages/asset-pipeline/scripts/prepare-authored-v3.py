"""Register drawn clothed/bare pose pairs to the shared 112px equipment grid.

Only source cleanup, uniform nearest-neighbour scaling and root placement happen
here. Animation never creates anatomy by recolouring or deforming another pose.
"""
from pathlib import Path
from statistics import median
from collections import deque
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
ART = ROOT / 'assets/mannequin/v2/source-art'
OUT = ART / 'authored-v3'
OUT.mkdir(exist_ok=True)
DIRS = ['S','SW','W','NW','N','NE','E','SE']

def clean(image):
    image = image.convert('RGBA')
    data = []
    for r,g,b,a in image.getdata():
        artifact = (r>175 and g<85 and b<85) or (r>160 and g>r*.91 and b<95) or (b>190 and r<70 and g<85)
        data.append((r,g,b,255) if a>=235 and not artifact else (0,0,0,0))
    image.putdata(data)
    pixels=image.load(); seen=set(); largest=[]
    for y in range(image.height):
        for x in range(image.width):
            if (x,y) in seen or not pixels[x,y][3]: continue
            queue=deque([(x,y)]); seen.add((x,y)); group=[]
            while queue:
                xx,yy=queue.popleft(); group.append((xx,yy))
                for nx,ny in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
                    if 0<=nx<image.width and 0<=ny<image.height and (nx,ny) not in seen and pixels[nx,ny][3]:
                        seen.add((nx,ny)); queue.append((nx,ny))
            if len(group)>len(largest): largest=group
    keep=set(largest)
    for y in range(image.height):
        for x in range(image.width):
            if pixels[x,y][3] and (x,y) not in keep: pixels[x,y]=(0,0,0,0)
    assert image.getbbox(), 'Empty pose after cleanup'
    x0,y0,x1,y1=image.getbbox()
    spans=[]
    for y in range(y0,y0+max(2,round((y1-y0)*.30))):
        xs=[x for x in range(x0,x1) if pixels[x,y][3]]
        spans.append((y,max(xs)-min(xs)+1 if xs else 0))
    threshold=max(width for _,width in spans)*.4
    first=next(y for y,width in spans if width>=threshold)
    for y in range(first):
        for x in range(image.width): pixels[x,y]=(0,0,0,0)
    return image

def roots(image):
    x0,y0,x1,y1=image.getbbox()
    points=[]
    for y in range(y0, y0+max(4,round((y1-y0)*.24))):
        for x in range(x0,x1):
            if image.getpixel((x,y))[3]: points.append(x)
    return sum(points)/len(points), y1-1

layout=json.loads((ART/'layout.json').read_text(encoding='utf8'))
specs=[
 ('idle','warden-sheet.png','warden-bare-core-v3.png',1,None),
 ('walk','warden-walk-frames.png','warden-bare-walk-v3.png',4,[0,238,463,682,887]),
 ('run','warden-run-v3.png','warden-bare-run-v3.png',4,[0,244,474,695,887]),
 ('attack','warden-attack-v3.png','warden-bare-attack-v3.png',7,[0,179,350,522,687,856,1027,1241]),
 ('cast','warden-cast-frames.png','warden-bare-cast-v3.png',4,[0,262,482,686,887]),
]
records=[]
for action,dressed_name,bare_name,rows,bands in specs:
    dressed=Image.open(ART/dressed_name).convert('RGBA')
    bare=Image.open(ART/bare_name).convert('RGBA')
    silver=Image.open(ART/f'warden-silver-{"core" if action=="idle" else action}-v3.png').convert('RGBA')
    assert dressed.size==bare.size, (action,dressed.size,bare.size)
    assert dressed.size==silver.size, (action,dressed.size,silver.size)
    pairs=[]
    for phase in range(rows):
        for d,direction in enumerate(DIRS):
            if action=='idle':
                r=layout['rects'][d]; box=(r['x'],r['y'],r['x']+r['w'],r['y']+r['h'])
            else:
                box=(round(d*dressed.width/8),bands[phase],round((d+1)*dressed.width/8),bands[phase+1])
            pairs.append((phase,direction,clean(dressed.crop(box)),clean(bare.crop(box)),clean(silver.crop(box))))
    # One fixed scale for all directions/poses in the action, never per-item fitting.
    scale=72/median(p.getbbox()[3]-p.getbbox()[1] for _,_,p,_,_ in pairs)
    dressed_sheet=Image.new('RGBA',(8*112,rows*112))
    bare_sheet=Image.new('RGBA',dressed_sheet.size)
    silver_sheet=Image.new('RGBA',dressed_sheet.size)
    for phase,direction,coat,body,metal in pairs:
        d=DIRS.index(direction); normalized=[]
        for source in [coat,body,metal]:
            rx,ry=roots(coat if source is metal else source)
            cell=Image.new('RGBA',(112,112))
            # Inverse nearest-neighbour sample keeps every layer on the same grid.
            for y in range(112):
                sy=round(ry+(y-100)/scale)
                if not 0<=sy<source.height: continue
                for x in range(112):
                    sx=round(rx+(x-56)/scale)
                    if 0<=sx<source.width: cell.putpixel((x,y),source.getpixel((sx,sy)))
            normalized.append(cell)
        # The final source run row has cropped feet; use the drawn passing pose,
        # reversing only the lower-leg phase on both registered layers together.
        if (action=='run' and phase==3) or (action in ['walk','run'] and phase>=2 and direction in ['S','N']):
            source_phase=phase-2
            previous=[Image.open(OUT/f'{action}_{source_phase}_{direction}_{kind}.png').convert('RGBA') for kind in ['clothed','bare','silver']]
            if action=='run' and phase==3:
                # This source row was cropped at its feet. Reuse the complete
                # drawn passing pose with a one-pixel airborne bob, not a short body.
                normalized=[]
                for prior in previous:
                    cell=Image.new('RGBA',(112,112)); cell.alpha_composite(prior,(0,-1)); normalized.append(cell)
            for cell,prior in zip(normalized,previous):
                legs=(cell if action=='run' and phase==3 else prior).crop((0,78,112,112))
                if direction in ['S','N']: legs=legs.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                cell.paste((0,0,0,0),(0,78,112,112)); cell.alpha_composite(legs,(0,78))
        for kind,cell,sheet in zip(['clothed','bare','silver'],normalized,[dressed_sheet,bare_sheet,silver_sheet]):
            cell.save(OUT/f'{action}_{phase}_{direction}_{kind}.png')
            sheet.alpha_composite(cell,(d*112,phase*112))
        bounds=normalized[0].getbbox(); height=bounds[3]-bounds[1]
        bare_bounds=normalized[1].getbbox(); bh=bare_bounds[3]-bare_bounds[1]
        neck_rows=[]
        for y in range(bare_bounds[1]+round(bh*.20),bare_bounds[1]+round(bh*.42)):
            xs=[x for x in range(37,76) if normalized[1].getpixel((x,y))[3]]
            if xs: neck_rows.append((max(xs)-min(xs)+1,-y))
        neck=-min(neck_rows)[1]+1
        records.append(dict(action=action,phase=phase,direction=direction,neck=neck,waist=bounds[1]+round(height*.62),boot=89,sourceScale=scale))
    dressed_sheet.save(OUT/f'{action}-clothed.png')
    bare_sheet.save(OUT/f'{action}-bare.png')
    silver_sheet.save(OUT/f'{action}-silver.png')
    dressed_sheet.resize((dressed_sheet.width*2,dressed_sheet.height*2),Image.Resampling.NEAREST).save(OUT/f'{action}-clothed-2x.png')
    bare_sheet.resize((bare_sheet.width*2,bare_sheet.height*2),Image.Resampling.NEAREST).save(OUT/f'{action}-bare-2x.png')
    silver_sheet.resize((silver_sheet.width*2,silver_sheet.height*2),Image.Resampling.NEAREST).save(OUT/f'{action}-silver-2x.png')
(OUT/'layout.json').write_text(json.dumps(dict(frameSize=[112,112],anchor=[56,100],directions=DIRS,poses=records),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'Prepared {len(records)} drawn clothed/bare pose pairs on the 112px grid')
