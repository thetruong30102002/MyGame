from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,statistics,importlib.util
root=Path.cwd();b=root/'assets/player-integrated/source-art/wholecast-v17'
spec=importlib.util.spec_from_file_location('p',root/'packages/asset-pipeline/scripts/prepare-integrated-v15.py');p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
records=[]
for char in ['swordsman','mage']:
 path=b/(char+'-8views.png');raw=Image.open(path).convert('RGBA');found=p.components(raw)[:8];found.sort(key=lambda c:(c['bounds'][1]+c['bounds'][3])/2);actors=[]
 for row in [found[:4],found[4:]]:actors.extend(sorted(row,key=lambda c:c['bounds'][0]))
 heights=[c['bounds'][3]-c['bounds'][1] for c in actors];scale=75/statistics.median(heights);sheet=Image.new('RGBA',(448,224));checks=[]
 for i,c in enumerate(actors):
  box=c['bounds'];tile=p.isolate(raw,c)
  # Whole actor only. Shared isotropic scale; no part masks/compositing or smoothing.
  head=tile.crop((box[0],box[1],box[2],box[1]+round((box[3]-box[1])*.24))).getbbox();cx=box[0]+(head[0]+head[2])/2
  tx=56-cx*scale;ty=100-(box[3]-1)*scale
  im=tile.transform((112,112),Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.NEAREST);im.putalpha(im.getchannel('A').point(lambda a:255 if a>=128 else 0));sheet.paste(im,((i%4)*112,(i//4)*112));checks.append({'direction':['S','SE','E','NE','N','NW','W','SW'][i],'sourceBounds':box,'nativeBounds':im.getbbox(),'logicalCanvas':[112,112],'root':[56,100]})
 sheet.paste((0,0,0,0),(0,0),sheet.getchannel('A').point(lambda a:255 if a==0 else 0))
 sheet.save(b/(char+'-native-8views.png'));sheet.resize((1344,672),Image.Resampling.NEAREST).save(b/(char+'-native-preview-3x.png'))
 records.append({'character':char,'weapon':'sword' if char=='swordsman' else 'staff','source':path.name,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'uniformScale':scale,'resampling':'nearest','wholeCharacter':True,'modularLayers':False,'frames':checks,'movementFramesCreated':False,'runtimeImported':False})
(b/'drawing-manifest.json').write_text(json.dumps({'provider':'ImageGen','stage':'complete character turnarounds; movement pending','characters':records},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(b)
