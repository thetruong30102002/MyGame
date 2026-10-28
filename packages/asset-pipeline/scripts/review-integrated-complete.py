"""Mechanical contact sheets and animation previews from complete painted frames."""
from PIL import Image,ImageDraw
from pathlib import Path
P=Path(__file__).resolve().parents[3]
B=P/'assets/player-integrated/source-art/fullhero-v14/review'
sources=[['idle-none','idle-sword','idle-staff'],['walk-none','walk-sword','walk-staff'],['run-none','run-sword','run-staff'],['idle-none','attack-sword','cast-staff'],['reactions-none','reactions-sword','reactions-staff']]
for direction in ['S','E','N','SE','NE']:
 contact=Image.new('RGBA',(144*4,144*5),(32,34,37,255));draw=ImageDraw.Draw(contact)
 npc=Image.open(P/'packages/asset-pipeline/sources/pixellab/npc_silver_youth/Idle/rotations'/({'S':'south','E':'east','N':'north','SE':'south-east','NE':'north-east'}[direction]+'.png')).convert('RGBA')
 for row,names in enumerate(sources):
  contact.alpha_composite(npc,(72-40,row*144+128-74));draw.text((5,row*144+4),'Original NPC',fill='white')
  for col,name in enumerate(names):
   path=B/(name+'-drawn')/(direction+'-00.png')
   if path.exists():contact.alpha_composite(Image.open(path),(144*(col+1),144*row))
   draw.text((144*(col+1)+5,row*144+4),name,fill='white')
 contact.resize((contact.width*3,contact.height*3),Image.Resampling.NEAREST).save(B/('compare-'+direction+'-3x.png'))
for folder in B.iterdir():
 if not folder.is_dir():continue
 for direction in ['S','E','N','SE','NE']:
  files=sorted(folder.glob(direction+'-*.png'))
  if not files:continue
  frames=[]
  for file in files:
   frame=Image.new('RGBA',(144,144),(32,34,37,255));frame.alpha_composite(Image.open(file))
   frames.append(frame.resize((432,432),Image.Resampling.NEAREST).convert('RGB'))
  frames[0].save(folder/(direction+'-loop.gif'),save_all=True,append_images=frames[1:],duration=110 if 'walk' in folder.name else 83 if 'run' in folder.name else 65 if 'attack' in folder.name or 'cast' in folder.name else 165,loop=0)
print('Complete-sprite contacts and GIFs ready')
