"""Review registered drawn body/dressed frame pairs without fitting or warping."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
ROOT=Path(__file__).resolve().parents[3]
ART=ROOT/'assets/mannequin/v13/source-art'
OUT=ROOT/'.aether-stage/mannequin/v13-review'
OUT.mkdir(parents=True,exist_ok=True)
body=Image.open(ART/'male-attack-east-candidate.png').convert('RGBA')
clothes=Image.open(ART/'male-attack-east-navy-candidate.png').convert('RGBA')
if clothes.size!=body.size:raise ValueError('Dressed source canvas differs from body master; reject, do not fit')
w,h=body.size;cols,rows=6,3
records=[];animations=[[],[]]
sheet=Image.new('RGB',(6*384,3*432),(24,27,32));draw=ImageDraw.Draw(sheet)
for i in range(18):
 x,y=i%6,i//6;box=(round(x*w/6),round(y*h/3),round((x+1)*w/6),round((y+1)*h/3))
 a=body.crop(box);b=clothes.crop(box)
 a.save(OUT/f'body-E-attack-{i:02}.png');b.save(OUT/f'navy-E-attack-{i:02}.png')
 overlay=Image.blend(a,b,.5)
 # Display-only zoom, never used for source registration/export.
 target=(384,384)
 overlay=overlay.resize(target,Image.Resampling.NEAREST)
 sheet.paste(overlay,(x*384,y*432+32),overlay)
 draw.text((x*384+8,y*432+8),f'frame {i}: body/dressed 50% overlay',fill='white')
 for k,im in enumerate([a,b]):animations[k].append(im)
 records.append(dict(poseId=f'male/attack/E/{i}',body=f'body-E-attack-{i:02}.png',dressed=f'navy-E-attack-{i:02}.png',sourceRect=box,bodyBounds=a.getbbox(),dressedBounds=b.getbbox(),registration='unchanged source grid; no per-frame transforms'))
sheet.save(OUT/'body-navy-registration.png')
for name,frames in zip(['body','navy'],animations):
 frames[0].save(OUT/f'{name}-attack-E.png',save_all=True,append_images=frames[1:],duration=65,loop=0)
(OUT/'frame-pairs.json').write_text(json.dumps(records,indent=2))
print('18 paired frames exported for visual alignment review; not approved or promoted')
