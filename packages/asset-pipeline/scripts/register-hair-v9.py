"""Compare complete paintings to the actual rig and separated hair layers."""
from pathlib import Path
from PIL import Image,ImageDraw
import importlib.util
from modular_v9_hair import HairLibrary,STYLES,RAW
from modular_v8_hair import hair_layers as v8_hair
ROOT=Path(__file__).resolve().parents[3];DEST=ROOT/'.aether-stage/mannequin/modular-v9-review';DEST.mkdir(exist_ok=True)
P=Path(__file__).with_name('review-modular-v7.py');scope={'__file__':str(P)};exec(compile(P.read_text(encoding='utf8').split('for i,identity')[0],str(P),'exec'),scope)
spec=importlib.util.spec_from_file_location('assembly',Path(__file__).with_name('assemble-modular-v7.py'));A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A);H=HairLibrary(A)
oldraw=Image.open(A.OLD/'hair-three-styles-raw.png').convert('RGBA')
for style,stem in STYLES.items():
    raw=Image.open(RAW/f'{stem}-integrated-idle-raw.png').convert('RGBA')
    sheet=Image.new('RGBA',(80*8,110*3),(26,32,40,255));labels=ImageDraw.Draw(sheet)
    for row,text in enumerate(['V8','PAINTED','IN GAME']):labels.text((2,row*110+2),text,fill=(220,225,230))
    for i,d in enumerate(A.DIRS):
        seq=next(s for s in scope['C']['identities'][0]['sequences'] if s['action']=='idle' and s['direction']==d)
        col,row=i%4,i//4
        tile=raw.crop((round(col*raw.width/4),round(row*raw.height/2),round((col+1)*raw.width/4),round((row+1)*raw.height/2)))
        tile.paste((0,0,0,0),(0,0,round(tile.width*.1),round(tile.height*.1)));tile.paste((0,0,0,0),(round(tile.width*.9),round(tile.height*.9),tile.width,tile.height))
        tile=tile.resize((144,144),Image.Resampling.NEAREST)
        bald=scope['draw'](scope['C']['identities'][0],seq,0,0,7,3,False).crop((16,24,160,168))
        record=A.load_meta('male','idle')[(0,d)];base=Image.open(A.ART/f'male_idle_0_{d}.png').convert('RGBA');_,head,_=A.head_info(base,record,'idle',0,d)
        si=list(STYLES).index(style)
        oldtile=A.prep.clean(oldraw.crop((round(i*oldraw.width/8),round(si*oldraw.height/3),round((i+1)*oldraw.width/8),round((si+1)*oldraw.height/3))))
        of,ob,_=v8_hair(oldtile,head,d,record['neckY']);old=ob.copy();old.alpha_composite(bald);old.alpha_composite(of)
        front,back,_=H(style,'idle',0,d,head,record['neckY']);assembled=back.copy();assembled.alpha_composite(bald);assembled.alpha_composite(front)
        if scope['C'].get('hairRevision')==9:
            actual=scope['draw'](scope['C']['identities'][0],seq,0,0,7,list(STYLES).index(style),False).crop((16,24,160,168))
            assert actual.tobytes()==assembled.tobytes(),'Game layers differ from the integrated reference registration'
            assembled=actual
        for row,im in enumerate([old,tile,assembled]):sheet.alpha_composite(im.crop((32,32,112,142)),(i*80,row*110))
    sheet.resize((sheet.width*3,sheet.height*3),Image.Resampling.NEAREST).save(DEST/f'{style}-integrated-comparison.png')
print('Compared v8, complete painting, and separated in-game hair at the same root and pixel scale')
