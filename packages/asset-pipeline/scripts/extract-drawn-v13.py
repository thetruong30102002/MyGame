"""Extract drawn grids with one explicit transform per paired sheet family.

No pose bbox fitting, limb warping, recolouring, or head replacement. A body's
clothed pair MUST reference the same transform ID. Input config contains:
  transforms: {id: {scale: 0.5, translate: [0,0]}}
  sheets: [{input, transform, columns, rows, directions, output,
            layout: 'directions-rows' | 'directions-columns',
            clearRects: [[l,t,r,b],...], background: [255,255,255]}]
Coordinates for clearRects are inside a source tile. 'output' is a format string
containing {phase} and {direction}; all paths are relative to the config.
"""
from pathlib import Path
from collections import deque
import argparse,json
from PIL import Image


def edge_matte(image,background,tolerance):
    """Remove only edge-connected matte, preserving enclosed pale highlights."""
    image=image.copy();w,h=image.size;pixels=image.load();seen=set();queue=deque()
    def candidate(x,y):
        r,g,b,a=pixels[x,y]
        return a==0 or max(abs(c-t) for c,t in zip((r,g,b),background))<=tolerance
    for x in range(w):queue.append((x,0));queue.append((x,h-1))
    for y in range(h):queue.append((0,y));queue.append((w-1,y))
    while queue:
        x,y=queue.popleft()
        if (x,y) in seen or not candidate(x,y):continue
        seen.add((x,y));pixels[x,y]=(0,0,0,0)
        for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
            if 0<=nx<w and 0<=ny<h and (nx,ny) not in seen:queue.append((nx,ny))
    return image


def extract(config_path):
    base=config_path.resolve().parent
    config=json.loads(config_path.read_text(encoding='utf-8-sig'))
    records=[]
    for sheet in config['sheets']:
        source=(base/sheet['input']).resolve()
        image=Image.open(source).convert('RGBA')
        columns,rows=sheet['columns'],sheet['rows']
        transform=config['transforms'][sheet['transform']]
        scale=transform['scale'];tx,ty=transform['translate']
        if scale<=0:raise ValueError('Scale must be positive')
        row_dirs=sheet.get('layout','directions-rows')=='directions-rows'
        count=columns if row_dirs else rows
        if len(sheet['directions'])!=(rows if row_dirs else columns):raise ValueError('Direction count differs from grid')
        for dindex,direction in enumerate(sheet['directions']):
            for phase in range(count):
                col,row=(phase,dindex) if row_dirs else (dindex,phase)
                bounds=[round(col*image.width/columns),round(row*image.height/rows),round((col+1)*image.width/columns),round((row+1)*image.height/rows)]
                tile=image.crop(tuple(bounds))
                if 'background' in sheet:tile=edge_matte(tile,sheet['background'],sheet.get('matteTolerance',8))
                for rect in sheet.get('clearRects',[]):tile.paste((0,0,0,0),tuple(rect))
                # Same scale / placement applies to every tile and its paired
                # body, clothes and body variant. Never crop to content bounds.
                tile=tile.resize((round(tile.width*scale),round(tile.height*scale)),Image.Resampling.NEAREST)
                tile.putalpha(tile.getchannel('A').point(lambda a:255 if a>=sheet.get('alphaThreshold',128) else 0))
                canvas=Image.new('RGBA',(144,144))
                b=tile.getbbox()
                if b and (b[0]+tx<0 or b[1]+ty<0 or b[2]+tx>144 or b[3]+ty>144):
                    raise ValueError(f'Explicit shared transform clips {source}/{phase}/{direction}: {b}, translation={tx,ty}')
                canvas.alpha_composite(tile,(tx,ty))
                output=(base/sheet['output'].format(phase=phase,direction=direction)).resolve()
                output.parent.mkdir(parents=True,exist_ok=True);canvas.save(output)
                records.append(dict(source=str(source),output=str(output),phase=phase,direction=direction,
                    transformId=sheet['transform'],scale=scale,translate=[tx,ty],sourceTile=bounds,bounds=canvas.getbbox()))
    audit=(base/config.get('audit','extraction-audit.json')).resolve()
    audit.parent.mkdir(parents=True,exist_ok=True)
    audit.write_text(json.dumps(records,indent=2)+'\n',encoding='utf8')
    print(f'Extracted {len(records)} drawn frames with explicit shared transforms; audit={audit}')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('config',type=Path)
    extract(parser.parse_args().config)
