"""Arrange original complete PixelLab frames as pose references, never production art."""
from pathlib import Path
import json
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'assets/player-integrated/source-art/fullhero-v14'
SOURCE=ROOT/'packages/asset-pipeline/sources/pixellab/player_hero_adult'
DIRS=['south','east','north','south-east','north-east']
STATES={'none':('Idle','walk'),'sword':('Sword','walk-sword'),'staff':('Staff','walk-staff')}

def prepare():
    OUT.mkdir(parents=True,exist_ok=True)
    records=[]
    for state,(folder,animation) in STATES.items():
        sheet=Image.new('RGBA',(144*8,144*5))
        for row,direction in enumerate(DIRS):
            actual=animation+'2' if (SOURCE/folder/'animations'/(animation+'2')/direction).exists() else animation
            frames=sorted((SOURCE/folder/'animations'/actual/direction).glob('frame_*.png'))
            if len(frames)!=8:raise ValueError(f'{state}/{direction}: expected8actualwalkframes, got{len(frames)}')
            for phase,path in enumerate(frames):
                image=Image.open(path).convert('RGBA')
                if image.size not in [(80,80),(108,108),(112,112)]:raise ValueError(f'Unexpected native complete-sprite size: {path}: {image.size}')
                padding=(image.width-80)//2
                # The held-state112 exports pad the original80 canvas16peredge.
                # Native PixelLab root40,75 placed at shared guide root72,128.
                # Literal whole sprites only: no scaling, masks, parts or layers.
                sheet.alpha_composite(image,(phase*144+32-padding,row*144+53-padding))
                records.append(dict(state=state,direction=direction,phase=phase,source=str(path.relative_to(ROOT)).replace('\\','/')))
        sheet.save(OUT/f'guide-walk-{state}.png')
        sheet.resize((sheet.width*2,sheet.height*2),Image.Resampling.NEAREST).save(OUT/f'guide-walk-{state}-2x.png')
        print(f'READY guide-walk-{state}.png 1152x720: 8 genuine complete native frames x5directions')
    (OUT/'guide-walk-provenance.json').write_text(json.dumps(dict(referenceOnly=True,production=False,cellSize=[144,144],root=[72,128],directions=DIRS,records=records),indent=2)+'\n',encoding='utf8')

if __name__=='__main__':prepare()
