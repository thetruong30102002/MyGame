"""Prepare head-and-hair painting templates from the complete reference model."""
from pathlib import Path
from PIL import Image,ImageDraw
import importlib.util
from modular_v9_hair import HairLibrary,STYLES,RAW
spec=importlib.util.spec_from_file_location('assembly',Path(__file__).with_name('assemble-modular-v7.py'));A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A)
H=HairLibrary(A)
preview=Image.new('RGBA',(48*8,48*3),(26,32,40,255))
for row,style in enumerate(STYLES):
    for col,d in enumerate(A.DIRS):
        record=A.load_meta('male','idle')[(0,d)];base=Image.open(A.ART/f'male_idle_0_{d}.png').convert('RGBA');_,head,_=A.head_info(base,record,'idle',0,d)
        im=head.crop((48,36,96,84));im.alpha_composite(H.masters[(style,d)]);preview.alpha_composite(im,(col*48,row*48))
    for action in ['walk','attack','cast']:
        count=A.COUNTS[action];sheet=Image.new('RGBA',(48*count,48*5))
        for r,d in enumerate(A.prep.ROWS):
            for phase in range(count):
                # The animation is drawn around one canonical skull: a step
                # must never change the hair roots, cap scale or face opening.
                record=A.load_meta('male','idle')[(0,d)];base=Image.open(A.ART/f'male_idle_0_{d}.png').convert('RGBA');_,head,_=A.head_info(base,record,'idle',0,d)
                tile=head.crop((48,36,96,84));tile.alpha_composite(H.masters[(style,d)])
                dr=ImageDraw.Draw(tile);dr.rectangle((1,1,2,2),fill=(0,255,0,255));dr.rectangle((45,45,46,46),fill=(255,0,255,255))
                sheet.alpha_composite(tile,(phase*48,r*48))
        sheet.resize((sheet.width*6,sheet.height*6),Image.Resampling.NEAREST).save(RAW/f'{style}-{action}-template.png')
preview.resize((1536,576),Image.Resampling.NEAREST).save(RAW/'canonical-heads-preview.png')
print('Prepared three integrated hairstyles and nine rooted animation templates')
