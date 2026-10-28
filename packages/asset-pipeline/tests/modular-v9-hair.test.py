"""Hair coherence: complete-character root pixels survive every drawn phase."""
from pathlib import Path
import sys,importlib.util
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from modular_v9_hair import HairLibrary,STYLES,DIRS,prep
from PIL import ImageFilter
spec=importlib.util.spec_from_file_location('assembly',Path(__file__).resolve().parents[1]/'scripts/assemble-modular-v7.py');A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A)
H=HairLibrary(A);count=0
for style in STYLES:
    for d in DIRS:
        master=H.masters[(style,d)]
        root=master.getchannel('A').filter(ImageFilter.MinFilter(3))
        for action in ['walk','attack','cast']:
            states=[]
            for phase in range(prep.COUNTS[action]):
                frame=H.painted(style,action,phase,d)
                for y in range(48):
                    for x in range(48):
                        if root.getpixel((x,y)) or (15<=x<=33 and 18<=y<27):
                            assert frame.getpixel((x,y))==master.getpixel((x,y)),f'Hair root/face opening changes: {style}/{action}/{d}/{phase}'
                states.append(frame.tobytes());count+=1
            assert len(set(states))>=2,f'No drawn tip movement: {style}/{action}/{d}'
print(f'PASS v9 complete-character hair: {count} action/direction poses keep the painted root and face opening; drawn ends animate')
