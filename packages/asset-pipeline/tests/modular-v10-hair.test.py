"""Natural reference volume, covered scalp, rooted hairline and animated ends."""
from pathlib import Path
import sys,importlib.util
from PIL import ImageFilter
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from modular_v10_hair import HairLibrary,STYLES,DIRS
from modular_v9_hair import prep,source_master
spec=importlib.util.spec_from_file_location('assembly',Path(__file__).resolve().parents[1]/'scripts/assemble-modular-v7.py');A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A);H=HairLibrary(A)
checks=0
for style in STYLES:
    for d in DIRS:
        master=H.masters[(style,d)];cx,top,width=H.skulls[d];cx-=48;top-=36
        reference=source_master('chestnut_short',d)
        assert master.getbbox(), 'Empty painted hair'
        # A natural crown has the brown reference's volume. Tail/bun extents
        # never become a scale metric and no rectangular cap crops the paint.
        if style!='brown_ponytail':
            box=master.getbbox();ref=reference.getbbox()
            assert abs((box[2]-box[0])-(ref[2]-ref[0]))<=3,'Crown width differs from reference'
            assert abs(box[1]-ref[1])<=2,'Crown top differs from reference'
        core=master.getchannel('A').filter(ImageFilter.MinFilter(3))
        for action,count in prep.COUNTS.items():
            states=set()
            for phase in range(count):
                im=H.painted(style,action,phase,d);states.add(im.tobytes())
                for y in range(round(top),round(top)+4):
                    for x in range(round(cx)-2,round(cx)+3):
                        assert im.getpixel((x,y))[3],f'Cracked scalp: {style}/{d}/{action}/{phase}/{x}/{y}'
                for y in range(48):
                    for x in range(48):
                        if core.getpixel((x,y)) or (15<=x<=33 and 18<=y<27) or (round(top)-1<=y<round(top)+10 and round(cx-(width-1)/2)-1<=x<=round(cx+(width-1)/2)+1):assert im.getpixel((x,y))==master.getpixel((x,y)),f'Root drift: {style}/{d}/{action}/{phase}'
                checks+=1
            if action!='idle':assert len(states)>=2,f'Static hair: {style}/{d}/{action}'
print(f'PASS v10 natural crown: {checks} poses, natural volume, corrected forehead, covered scalp, fixed roots, drawn tips')
