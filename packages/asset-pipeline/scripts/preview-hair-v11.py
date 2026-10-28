from pathlib import Path
from PIL import Image
import importlib.util,sys
from modular_v11_hair import HairLibrary,STYLES,DIRS
spec=importlib.util.spec_from_file_location('A',Path(__file__).with_name('assemble-modular-v7.py'));A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A);H=HairLibrary(A)
DEST=A.ROOT/'.aether-stage/mannequin/modular-v11-review';DEST.mkdir(exist_ok=True)
plain=Image.new('RGBA',(48*8,48*6),(26,32,40,255))
for si,sex in enumerate(['male','female']):
 for row,style in enumerate(STYLES):
  for col,d in enumerate(DIRS):
   r=A.load_meta(sex,'idle')[(0,d)];base=Image.open(A.ART/f'{sex}_idle_0_{d}.png').convert('RGBA');_,head,_=A.head_info(base,r,'idle',0,d)
   f,b,m=H(style,'idle',0,d,head,r['neckY'],sex);im=b.copy();im.alpha_composite(f)
   plain.alpha_composite(im.crop((48,36,96,84)),(col*48,(si*3+row)*48))
plain.resize((1536,1152),Image.Resampling.NEAREST).save(DEST/'integrated-heads.png')
print(DEST)
