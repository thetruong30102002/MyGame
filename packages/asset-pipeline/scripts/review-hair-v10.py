"""Review rooted secondary hair motion before rebuilding the whole atlas."""
from pathlib import Path
from PIL import Image,ImageDraw
import importlib.util,sys
from modular_v10_hair import HairLibrary,STYLES
spec=importlib.util.spec_from_file_location('assembly',Path(__file__).with_name('assemble-modular-v7.py'));A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A)
H=HairLibrary(A);DEST=A.ROOT/'.aether-stage/mannequin/modular-v10-review';DEST.mkdir(exist_ok=True)
styles=[sys.argv[1]] if len(sys.argv)>1 else list(STYLES)
for style in styles:
    for d in A.DIRS:
        frames=[];contact=Image.new('RGBA',(40*20,48),(26,32,40,255));column=0
        record=A.load_meta('male','idle')[(0,d)];base=Image.open(A.ART/f'male_idle_0_{d}.png').convert('RGBA');_,head,_=A.head_info(base,record,'idle',0,d)
        for action,count in A.COUNTS.items():
            states=[]
            for phase in range(count):
                hair=H.painted(style,action,phase,d);states.append(hair.tobytes())
                im=head.crop((48,36,96,84));im.alpha_composite(hair)
                bg=Image.new('RGBA',im.size,(26,32,40,255));bg.alpha_composite(im);frames.append(bg.resize((240,240),Image.Resampling.NEAREST).convert('RGB'))
                contact.alpha_composite(im.crop((4,0,44,48)),(column*40,0));column+=1
            print(style,d,action,len(set(states)))
        contact.resize((1600,96),Image.Resampling.NEAREST).save(DEST/f'{style}-head-{d}.png')
        frames[0].save(DEST/f'{style}-head-{d}.gif',save_all=True,append_images=frames[1:],duration=120,loop=0,disposal=2)
