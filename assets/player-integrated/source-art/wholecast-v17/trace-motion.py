from pathlib import Path
import json,hashlib,statistics,importlib.util,colorsys,sys
from PIL import Image,ImageDraw,ImageFont
root=Path.cwd();b=root/'assets/player-integrated/source-art/wholecast-v17'
options=json.loads((b/'registration-options.json').read_text()) if (b/'registration-options.json').exists() else {}
spec=importlib.util.spec_from_file_location('p',root/'packages/asset-pipeline/scripts/prepare-integrated-v15.py');p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
def hair_box(raw,c,char):
 pts=[]
 for x,y in c['pixels']:
  r,g,bb,a=raw.getpixel((x,y));h,s,v=colorsys.rgb_to_hsv(r/255,g/255,bb/255)
  if a>=128 and ((.52<h<.72 and s>.12 and v>.13) if char=='swordsman' else (.035<h<.16 and .1<s<.55 and v>.3)):pts.append((x,y))
 mask=Image.new('RGBA',raw.size);px=mask.load()
 for x,y in pts:px[x,y]=(255,255,255,255)
 cc=p.components(mask)
 if not cc:raise ValueError('Cannot identify hair '+char)
 return cc[0]['bounds']
def trace(job):
 opt=options.get(job['name'],{});path=b/'motion'/opt.get('source',f"{job['name']}.png");raw=Image.open(path).convert('RGBA');cs=p.components(raw)[:job['frames']]
 if len(cs)!=job['frames']:raise ValueError('Actor count mismatch '+job['name'])
 cs.sort(key=lambda c:(c['bounds'][1]+c['bounds'][3])/2);ordered=[]
 for r in range(job['frames']//4):ordered.extend(sorted(cs[r*4:r*4+4],key=lambda c:c['bounds'][0]))
 hb=[hair_box(raw,c,job['character']) for c in ordered];cw=raw.width/4
 reference=Image.open(b/'action-references'/f"{job['character']}-{job['direction']}-master.png").convert('RGBA').resize((112,112),Image.Resampling.NEAREST)
 refs=Image.new('RGBA',(144,144));refs.alpha_composite(reference,(16,28))
 rc=p.components(refs)[0];rh=hair_box(refs,rc,job['character']);targetw=rh[2]-rh[0];targeth=rh[3]-rh[1]
 neutral=[0,job['frames']-1] if job['action'] in ['attack','cast'] else [0,4]
 # One complete-actor scale. Hair dimensions constrain head inflation; never fit every phase.
 sw=statistics.median(hb[i][2]-hb[i][0] for i in neutral);sh=statistics.median(hb[i][3]-hb[i][1] for i in neutral)
 scale=min(targetw/sw,targeth/sh)
 floors=[]
 for row in range(job['frames']//4):
  values=[]
  for i in range(row*4,row*4+4):
   c=ordered[i];box=c['bounds'];head=hb[i];cx=(head[0]+head[2])/2;a=p.isolate(raw,c).getchannel('A');win=(round(cx-35/scale*.25),round(box[1]+(box[3]-box[1])*.65),round(cx+35/scale*.25),box[3]);bb=a.crop(win).getbbox();values.append(win[1]+bb[3]-1)
  floors.append(statistics.median(values))
 # Match upright contact/ready body height; color-cluster sizes are diagnostic only.
 targetcrown=rc['bounds'][1]
 if job['action']!='run':scale=(127-targetcrown)/statistics.median(floors[i//4]-ordered[i]['bounds'][1] for i in neutral)
 if 'scale' in opt:scale=opt['scale']
 centers=[(i%4,(h[0]+h[2])/2) for i,h in enumerate(hb)];mx=statistics.mean(x for x,y in centers);my=statistics.mean(y for x,y in centers);step=sum((x-mx)*(y-my) for x,y in centers)/sum((x-mx)**2 for x,y in centers);origin=my-step*mx
 targetx=(rh[0]+rh[2])/2;out=b/'traces'/job['name'];out.mkdir(parents=True,exist_ok=True);card=Image.new('RGBA',(144*5,170*(job['frames']//4)),(29,31,34,255));dr=ImageDraw.Draw(card);records=[]
 for row in range(job['frames']//4):
  card.alpha_composite(refs,(0,row*170));dr.text((3,row*170+148),'MASTER',fill='white')
  for col in range(4):
   i=row*4+col;c=ordered[i];tx=targetx-(origin+step*col)*scale+opt.get('translate',[0,0])[0];ty=127-floors[row]*scale+opt.get('translate',[0,0])[1]
   if job['action'] in ['walk','run']:
    ground=124 if job['action']=='run' and i in [3,7] else 127
    ty=ground-(c['bounds'][3]-1)*scale+opt.get('translate',[0,0])[1]
   tile=p.isolate(raw,c);im=tile.transform((144,144),Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.NEAREST);im.putalpha(im.getchannel('A').point(lambda a:255 if a>=128 else 0));im.paste((0,0,0,0),(0,0),im.getchannel('A').point(lambda a:255 if a==0 else 0))
   if i in opt.get('mirrorFrames',[]):im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   im.save(out/f'frame-{i:02}.png');card.alpha_composite(im,((col+1)*144,row*170));dr.text(((col+1)*144+3,row*170+148),str(i),fill='white');bb=c['bounds'];mapped=[bb[0]*scale+tx,bb[1]*scale+ty,bb[2]*scale+tx,bb[3]*scale+ty];records.append({'frame':i,'hairWidth':round((hb[i][2]-hb[i][0])*scale,2),'hairHeight':round((hb[i][3]-hb[i][1])*scale,2),'sourceEdge':bb[0]==0 or bb[1]==0 or bb[2]==raw.width or bb[3]==raw.height,'clipped':min(mapped)<0 or mapped[2]>144 or mapped[3]>144,'nativeBounds':im.getbbox(),'wholeActorMirrored':i in opt.get('mirrorFrames',[])})
  dr.line((0,row*170+128,719,row*170+128),fill=(80,120,80))
 card.resize((2160,card.height*3),Image.Resampling.NEAREST).convert('RGB').save(out/'review-3x.png')
 cfg={'job':job['name'],'source':str(path.relative_to(root)).replace('\\','/'),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'uniformScale':scale,'rowFloor':floors,'gridOrigin':origin,'gridStep':step,'masterHair':[targetw,targeth],'resampling':'nearest','frameSize':[144,144],'root':[72,128],'frames':records,'approved':False};(out/'trace.json').write_text(json.dumps(cfg,indent=2)+'\n');print(job['name'],scale,cfg['masterHair'])
if __name__=='__main__':
 jobs=json.loads((b/'motion-jobs.json').read_text());names=sys.argv[1:]
 for j in jobs:
  if (not names or j['name'] in names) and (b/'motion'/f"{j['name']}.png").exists():trace(j)
