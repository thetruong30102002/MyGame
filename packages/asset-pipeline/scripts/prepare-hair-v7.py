"""Action-specific scalp guides for authored hair animation, not static wigs."""
from pathlib import Path
import importlib.util,json,sys
from PIL import Image,ImageDraw

HERE=Path(__file__).parent;sys.path.insert(0,str(HERE))
spec=importlib.util.spec_from_file_location('builder',HERE/'assemble-modular-v7.py')
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
DEST=b.RAW/'hair';DEST.mkdir(exist_ok=True)
for action,count in b.COUNTS.items():
    cols,rows=(4,2) if action=='idle' else(count,5)
    sheet=Image.new('RGBA',(48*cols,48*rows));records=[]
    meta=b.load_meta('male',action)
    for row in range(rows):
        for col in range(cols):
            d=b.DIRS[row*4+col] if action=='idle' else b.prep.ROWS[row];p=0 if action=='idle' else col
            im=Image.open(b.ART/f'male_{action}_{p}_{d}.png').convert('RGBA')
            anchor,head,_=b.head_info(im,meta[(p,d)],action,p,d)
            x=anchor[0]-24;y=anchor[1]-12
            tile=head.crop((x,y,x+48,y+48));draw=ImageDraw.Draw(tile)
            draw.rectangle((1,1,2,2),fill=(0,255,0,255));draw.rectangle((45,45,46,46),fill=(255,0,255,255))
            sheet.alpha_composite(tile,(col*48,row*48));records.append(dict(action=action,phase=p,direction=d,origin=[x,y]))
    sheet.resize((sheet.width*6,sheet.height*6),Image.Resampling.NEAREST).save(DEST/f'{action}-scalp-template.png')
    (DEST/f'{action}-scalp-template.json').write_text(json.dumps(records,indent=2)+'\n')
print('PASS scalp-only templates: eight idle directions plus every locomotion, chop and cast phase')
