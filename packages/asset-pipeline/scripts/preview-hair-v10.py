from pathlib import Path
from PIL import Image,ImageDraw
import importlib.util
from modular_v10_hair import HairLibrary,STYLES,DIRS
spec=importlib.util.spec_from_file_location('assembly',Path(__file__).with_name('assemble-modular-v7.py'));A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A);H=HairLibrary(A)
DEST=A.ROOT/'.aether-stage/mannequin/modular-v10-review';DEST.mkdir(exist_ok=True)
plain=Image.new('RGBA',(48*8,48*3),(26,32,40,255));guide=plain.copy()
for row,style in enumerate(STYLES):
    for col,d in enumerate(DIRS):
        record=A.load_meta('male','idle')[(0,d)];base=Image.open(A.ART/f'male_idle_0_{d}.png').convert('RGBA');_,head,_=A.head_info(base,record,'idle',0,d)
        f,b,meta=H(style,'idle',0,d,head,record['neckY']);im=b.copy();im.alpha_composite(head);im.alpha_composite(f);im=im.crop((48,36,96,84))
        plain.alpha_composite(im,(col*48,row*48));guide.alpha_composite(im,(col*48,row*48))
        l,t,r,b=meta['capRect'];ImageDraw.Draw(guide).rectangle((col*48+l-48,row*48+t-36,col*48+r-49,row*48+b-37),outline=(75,190,210,255),width=1)
plain.resize((1536,576),Image.Resampling.NEAREST).save(DEST/'standard-heads.png');guide.resize((1536,576),Image.Resampling.NEAREST).save(DEST/'standard-heads-guide.png')
print(DEST)
