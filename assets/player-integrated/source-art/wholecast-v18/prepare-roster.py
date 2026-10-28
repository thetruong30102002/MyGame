"""Register complete ImageGen turnarounds and assemble the 30-character review.

The hair mask is ONLY a measurement diagnostic. Rendering always extracts and
uniformly scales the complete connected actor, never body parts or equipment.
"""
from pathlib import Path
import colorsys,hashlib,importlib.util,json,statistics,sys
from PIL import Image,ImageDraw,ImageFont

B=Path(__file__).resolve().parent;ROOT=B.parents[3]
spec=importlib.util.spec_from_file_location('whole_actor',ROOT/'packages/asset-pipeline/scripts/prepare-integrated-v15.py')
whole=importlib.util.module_from_spec(spec);spec.loader.exec_module(whole)
DIRS=['S','SE','E','NE','N','NW','W','SW']
FONT=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)

def hair_color(rgb,kind):
    r,g,b=rgb;h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
    return {'silver':s<.27 and v>.43,'blue':.52<h<.77 and s>.1 and .08<v<.76,'black':v<.38 and s<.62,
        'auburn':.015<h<.155 and s>.2 and .10<v<.85,'blonde':.035<h<.18 and .10<s<.67 and v>.35,
        'rose':(h<.045 or h>.83) and s>.12 and v>.25}[kind]

def register(c):
    overrides=json.loads((B/'registration-sources.json').read_text()) if (B/'registration-sources.json').exists() else {}
    selected=overrides.get(c['id'],c['masterFile']);source=B/selected;raw=Image.open(source).convert('RGBA');found=whole.components(raw)[:8]
    if len(found)!=8 or min(v['area'] for v in found)<max(v['area'] for v in found)*.38:raise ValueError('Inspect actor count: '+c['id'])
    found.sort(key=lambda v:(v['bounds'][1]+v['bounds'][3])/2)
    actors=[]
    for r in range(2):actors.extend(sorted(found[r*4:r*4+4],key=lambda v:(v['bounds'][0]+v['bounds'][2])/2))
    heads=[];cw=raw.width/4;ch=raw.height/2
    for i,a in enumerate(actors):
        row,col=divmod(i,4);mask=Image.new('RGBA',raw.size);px=mask.load()
        # Restrict diagnostic search to the upper body. Clothing and tall weapon
        # tips must not determine the crown-to-sole scale.
        for x,y in a['pixels']:
            if (col+.2)*cw<x<(col+.8)*cw and row*ch<y<(row+.50)*ch and hair_color(raw.getpixel((x,y))[:3],c['hairColor']):px[x,y]=(255,255,255,255)
        candidates=whole.components(mask)
        if not candidates:raise ValueError('No hair landmark: '+c['id']+'/'+DIRS[i])
        heads.append(candidates[0]['bounds'])
    height=statistics.median(a['bounds'][3]-1-h[1] for a,h in zip(actors,heads));scale=75/height
    out=B/'native'/c['id'];out.mkdir(parents=True,exist_ok=True);sheet=Image.new('RGBA',(448,224));records=[]
    for i,(actor,head) in enumerate(zip(actors,heads)):
        cx=(head[0]+head[2])/2;tx=56-cx*scale;ty=99-(actor['bounds'][3]-1)*scale
        tile=whole.isolate(raw,actor);im=tile.transform((112,112),Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.NEAREST)
        im.putalpha(im.getchannel('A').point(lambda a:255 if a>=128 else 0));im.paste((0,0,0,0),(0,0),im.getchannel('A').point(lambda a:255 if a==0 else 0))
        im.save(out/f'idle-{DIRS[i]}.png');sheet.paste(im,(i%4*112,i//4*112))
        reference=B/'action-references'/c['id'];reference.mkdir(parents=True,exist_ok=True)
        if DIRS[i] in ['S','SE','E','NE','N']:im.resize((448,448),Image.Resampling.NEAREST).save(reference/f'{DIRS[i]}-master.png')
        bb=actor['bounds'];mapped=[bb[0]*scale+tx,bb[1]*scale+ty,bb[2]*scale+tx,bb[3]*scale+ty]
        records.append({'direction':DIRS[i],'sourceBounds':bb,'headDiagnostic':head,'nativeBounds':im.getbbox(),'wholeActorScale':scale,'translate':[tx,ty],'sourceEdge':min(bb[:2])==0 or bb[2]==raw.width or bb[3]==raw.height,'clipped':min(mapped)<0 or mapped[2]>112 or mapped[3]>112})
    sheet.save(out/'idle-8views.png');sheet.resize((1344,672),Image.Resampling.NEAREST).save(out/'preview-3x.png')
    receipt={'id':c['id'],'source':selected,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'uniformScale':scale,'frameSize':[112,112],'root':[56,100],'resampling':'nearest','modularLayers':False,'measurementOnlyHairMask':True,'frames':records,'visualReview':'pending'}
    (out/'registration.json').write_text(json.dumps(receipt,indent=2)+'\n');print(c['id'],round(scale,5))

def approved(c):
    out=B/'native'/c['id'];out.mkdir(parents=True,exist_ok=True);sheet=Image.open(B/c['masterFile']).convert('RGBA')
    sheet.save(out/'idle-8views.png');sheet.resize((1344,672),Image.Resampling.NEAREST).save(out/'preview-3x.png')
    for i,d in enumerate(DIRS):sheet.crop((i%4*112,i//4*112,i%4*112+112,i//4*112+112)).save(out/f'idle-{d}.png')
    (out/'registration.json').write_text(json.dumps({'id':c['id'],'reference':c['masterFile'],'sha256':hashlib.sha256((B/c['masterFile']).read_bytes()).hexdigest(),'visualReview':'user-approved-v17','frameSize':[112,112],'root':[56,100],'modularLayers':False},indent=2)+'\n')

def review(roster):
    review=B/'review';review.mkdir(exist_ok=True);metadata=[];contact=Image.new('RGB',(112*6,144*5),(26,31,32));dr=ImageDraw.Draw(contact)
    for c in roster['characters']:
        native=B/'native'/c['id'];drawn=(native/'idle-8views.png').exists();item=dict(c)
        if drawn:
            sheet=Image.open(native/'idle-8views.png');receipt=json.loads((native/'registration.json').read_text());issues=[f['direction'] for f in receipt.get('frames',[]) if f['sourceEdge'] or f['clipped']]
            item.update(masterStatus='review-needed' if issues else 'drawn',registrationIssues=issues,preview=sheet)
            row=roster['roles'].index(c['role']);col=(0 if c['gender']=='male' else 3)+c['index']-1
            labels={'sword':'Kiếm','bow':'Cung','staff':'Trượng','spear':'Thương','shield':'Khiên'}
            tile=Image.open(native/'idle-S.png');contact.paste(tile,(col*112,row*144),tile);dr.text((col*112+3,row*144+113),c['label'],font=FONT,fill=(232,220,176));dr.text((col*112+3,row*144+128),labels[c['role']]+' · '+('Nam ' if c['gender']=='male' else 'Nữ ')+str(c['index']),font=FONT,fill=(164,181,174))
            item.pop('preview');item['sheetData']='data:image/png;base64,'+__import__('base64').b64encode((native/'idle-8views.png').read_bytes()).decode()
        metadata.append(item)
    contact.resize((1344,1440),Image.Resampling.NEAREST).save(review/'roster-30-front-2x.png')
    combat=json.loads((review/'combat-data.json').read_text(encoding='utf8')) if (review/'combat-data.json').exists() else {}
    state={'version':18,'total':30,'mastersDrawn':sum('sheetData' in c for c in metadata),'coreAnimationsReady':2,'combatSheetsDrawn':len(combat),'characters':[{k:v for k,v in c.items() if k!='sheetData'} for c in metadata]}
    (B/'progress.json').write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    template=(B/('combat-review-template.html' if combat else 'review-template.html')).read_text(encoding='utf8');(review/'index.html').write_text(template.replace('__ROSTER_DATA__',json.dumps(metadata,ensure_ascii=False,separators=(',',':'))).replace('__COMBAT_DATA__',json.dumps(combat,ensure_ascii=False,separators=(',',':'))),encoding='utf8')

if __name__=='__main__':
    roster=json.loads((B/'roster.json').read_text(encoding='utf8'));wanted=sys.argv[1:]
    for c in roster['characters']:
        if wanted and c['id'] not in wanted:continue
        if c.get('reference'):approved(c)
        elif (B/c['masterFile']).exists():register(c)
    review(roster)
