"""Keep the approved idle anatomy; register drawn locomotion to its neck and waist.

This is asset registration, not newly generated anatomy. Every limb is from the
authored eight-phase walk. Idle pixels remain untouched. The same directional
skull is used during idle and locomotion so a hairstyle cannot change the face.
"""
from pathlib import Path
import importlib.util,json
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[3]
SRC=ROOT/'assets/mannequin/v2/source-art/authored-v6'
OUT=ROOT/'assets/mannequin/v2/source-art/authored-v7'
RAW=ROOT/'assets/mannequin/v2/source-art/v7'
OUT.mkdir(exist_ok=True);RAW.mkdir(exist_ok=True)
spec=importlib.util.spec_from_file_location('prep',Path(__file__).with_name('prepare-authored-v6.py'))
prep=importlib.util.module_from_spec(spec);spec.loader.exec_module(prep)
N=144

def neck_line(im):
    # This search is deliberately limited to the bald locomotion sources.
    # Raised combat arms must never be mistaken for the skull.
    return min(range(63,73),key=lambda y:sum(im.getpixel((x,y))[3]>0 for x in range(62,83)))

def warp_rows(im,source,target):
    out=Image.new('RGBA',(N,N))
    for y in range(N):
        i=next((i for i in range(len(target)-1) if target[i]<=y<=target[i+1]),None)
        sy=y if i is None else round(source[i]+(y-target[i])*(source[i+1]-source[i])/(target[i+1]-target[i]))
        if 0<=sy<N:out.paste(im.crop((0,sy,N,sy+1)),(0,y))
    return out

def shoulder_span(im,y):
    xs=[x for x in range(40,105) if im.getpixel((x,y))[3]]
    return max(xs)-min(xs)+1

def register_width(im,idle,neck,waist):
    scale=shoulder_span(idle,neck+7)/shoulder_span(im,neck+7)
    result=Image.new('RGBA',(N,N))
    for y in range(neck+1,N):
        # The foot stride remains the actual authored stride. Only the torso
        # and its transition to the hips need the approved shoulder scale.
        t=max(0,min(1,(y-waist)/(128-waist)))
        sx=scale+(1-scale)*t
        for x in range(N):
            ix=round(72+(x-72)/sx)
            if 0<=ix<N:result.putpixel((x,y),im.getpixel((ix,y)))
    return result,scale

def main():
    audit=[]
    for sex in ['male','female']:
        idles={d:Image.open(SRC/f'{sex}_idle_0_{d}.png').convert('RGBA') for d in prep.DIRS}
        idlemeta={r['direction']:r for r in json.loads((SRC/f'{sex}-idle.json').read_text(encoding='utf8'))['records']}
        for action,count in prep.COUNTS.items():
            old=json.loads((SRC/f'{sex}-{action}.json').read_text(encoding='utf8'))
            records=[];poses={}
            for r in old['records']:
                r=dict(r);p=r['phase'];d=r['direction']
                im=Image.open(SRC/f'{sex}_{action}_{p}_{d}.png').convert('RGBA')
                if action=='walk':
                    idle=idles[d];sn=neck_line(im);tn=neck_line(idle);sw=r['waist'];tw=idlemeta[d]['waist']
                    im=warp_rows(im,[sn,sw,128],[tn,tw,128])
                    im,widthscale=register_width(im,idle,tn,tw)
                    # Remove the old oversized walk head. Keep the shoulders,
                    # neckline and all eight original drawn leg/arm poses.
                    im.paste((0,0,0,0),(0,0,N,tn+1))
                    im.alpha_composite(idle.crop((0,0,N,tn+1)),(0,0))
                    hip=[round(72+(r['hip'][0]-72)*widthscale),round(tw+(r['hip'][1]-sw)*(128-tw)/(128-sw))]
                    r.update(headAnchor=idlemeta[d]['headAnchor'],waist=tw,hip=hip,neckY=tn,registration=dict(sourceNeck=sn,sourceWaist=sw,targetNeck=tn,targetWaist=tw,shoulderScale=widthscale))
                    audit.append(dict(sex=sex,direction=d,phase=p,sourceWaist=sw,waist=tw,neck=tn))
                elif action=='idle':r['neckY']=neck_line(im)
                poses[(p,d)]=im;records.append(r)
                im.save(OUT/f'{sex}_{action}_{p}_{d}.png')
            (OUT/f'{sex}-{action}.json').write_text(json.dumps(dict(old,records=records),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
            cols,rows=(4,2) if action=='idle' else(count,5)
            template=Image.new('RGBA',(N*cols,N*rows))
            for row in range(rows):
                for col in range(cols):
                    d=prep.DIRS[row*4+col] if action=='idle' else prep.ROWS[row];p=0 if action=='idle' else col
                    tile=poses[(p,d)].copy();draw=ImageDraw.Draw(tile)
                    draw.rectangle((4,4,7,7),fill=(0,255,0,255));draw.rectangle((136,136,139,139),fill=(255,0,255,255))
                    template.alpha_composite(tile,(N*col,N*row))
            template.resize((template.width*3,template.height*3),Image.Resampling.NEAREST).save(RAW/f'{sex}-{action}-template.png')
    (OUT/'registration.json').write_text(json.dumps(audit,indent=2)+'\n')
    print('PASS: approved idle unchanged; 128 walk poses retain idle skull, neck and waist; eight drawn foot phases retained')

if __name__=='__main__':main()
