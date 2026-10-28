from pathlib import Path
from PIL import Image,ImageDraw
import importlib.util
from modular_v9_hair import DIRS,STYLES,skull
spec=importlib.util.spec_from_file_location('assembly',Path(__file__).with_name('assemble-modular-v7.py'));A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A)
RAW=A.OUT/'source-art/v10';RAW.mkdir(exist_ok=True)
sheet=Image.new('RGBA',(48*8,48*3))
for row,style in enumerate(STYLES):
    for col,d in enumerate(DIRS):
        record=A.load_meta('male','idle')[(0,d)];base=Image.open(A.ART/f'male_idle_0_{d}.png').convert('RGBA');_,head,_=A.head_info(base,record,'idle',0,d)
        tile=head.crop((48,36,96,84));cx,top,w=skull(head,record['neckY']);cx-=48;top-=36;dr=ImageDraw.Draw(tile)
        l=round(cx-(w-1)/2)-2;r=l+w+3
        dr.arc((l,top-4,r,top+16),180,360,fill=(0,220,255,255),width=1)
        dr.line((l,top+6,l,top+10),fill=(0,220,255,255));dr.line((r,top+6,r,top+10),fill=(0,220,255,255))
        dr.rectangle((1,1,2,2),fill=(0,255,0,255));dr.rectangle((45,45,46,46),fill=(255,0,255,255))
        sheet.alpha_composite(tile,(col*48,row*48))
sheet.resize((2304,864),Image.Resampling.NEAREST).save(RAW/'fixed-scalp-guide.png')
print(RAW/'fixed-scalp-guide.png')
