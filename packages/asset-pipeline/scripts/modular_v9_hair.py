"""Extract hair from a complete painted character at the body's real rig scale.

The skull, not the hairstyle's bounding box, owns scale and position. Hair root
pixels are shared with the complete character; only drawn outer tips animate.
"""
from pathlib import Path
from PIL import Image,ImageFilter
import importlib.util,json
ROOT=Path(__file__).resolve().parents[3];RAW=ROOT/'assets/mannequin/v2/source-art/v9'
spec=importlib.util.spec_from_file_location('hairprep',Path(__file__).with_name('prepare-authored-v6.py'));prep=importlib.util.module_from_spec(spec);spec.loader.exec_module(prep)
DIRS=prep.DIRS;STYLES={'chestnut_short':'chestnut','silver_swept':'silver','brown_ponytail':'ponytail'}

def extract(tile,style='chestnut_short'):
    """Retain the connected painted hair, discarding the visible skin/neck."""
    tile=tile.convert('RGBA');points=[]
    for y in range(tile.height):
        for x in range(tile.width):
            r,g,b,a=tile.getpixel((x,y))
            skin=r>185 and g>120 and b>65 and r-g>15 and g-b>8
            colour=(b>=r*.75 and g>=r*.73 and b<=max(35,r*1.3)) if style=='silver_swept' else (g<=r*.76 and b<max(15,g*.95))
            marker=(g>180 and r<75 and b<75) or (r>180 and b>160 and g<90)
            artifact=(r>175 and g<60 and b<75) or (r>170 and g>170 and b<70 and abs(r-g)<40)
            if a>=235 and colour and not skin and not marker and not artifact:points.append((x,y))
    groups=prep.components(points)
    if not groups:raise ValueError('No painted hair')
    result=Image.new('RGBA',tile.size)
    for x,y in groups[0]:result.putpixel((x,y),(*tile.getpixel((x,y))[:3],255))
    return result

def source_character_head(style,d):
    source=Image.open(RAW/f'{STYLES[style]}-integrated-idle-raw.png').convert('RGBA');i=DIRS.index(d);col,row=i%4,i//4
    cell=source.crop((round(col*source.width/4),round(row*source.height/2),round((col+1)*source.width/4),round((row+1)*source.height/2)))
    cell.paste((0,0,0,0),(0,0,round(cell.width*.1),round(cell.height*.1)))
    cell.paste((0,0,0,0),(round(cell.width*.9),round(cell.height*.9),cell.width,cell.height))
    # Fixed grid registration: do not crop the hair and invent a second scale.
    cell=cell.resize((144,144),Image.Resampling.NEAREST)
    cell=cell.crop((48,36,96,84))
    if style!='brown_ponytail':cell.paste((0,0,0,0),(0,31,48,48))
    else:
        cell.paste((0,0,0,0),(0,38,48,48))
        # The full reference includes the gold cape clasp. It is equipment,
        # even where it touches a dark ponytail or the neck outline.
        for y in range(29,38):
            for x in range(48):
                r,g,b,a=cell.getpixel((x,y))
                if r>170 or g>r*.65:cell.putpixel((x,y),(0,0,0,0))
    neck_ranges={'S':(18,30),'SW':(12,28),'W':(12,28),'E':(20,37),'SE':(20,37),'NW':(15,27),'NE':(22,35)}
    if d in neck_ranges:
        l,r=neck_ranges[d];cell.paste((0,0,0,0),(l,27,r,48))
    return cell

def source_master(style,d):
    return extract(source_character_head(style,d),style)

def skull(head,neck):
    l,t,r,b=head.getbbox();pts=[(x,y) for y in range(t,min(neck,t+12)) for x in range(l,r) if head.getpixel((x,y))[3]]
    l=min(x for x,y in pts);r=max(x for x,y in pts)
    return (l+r)/2,t,r-l+1

class HairLibrary:
    def transform_pose(self,tile,style,d):return tile
    def finalize_pose(self,tile,style,d):return tile
    def __init__(self,assembly):
        self.A=assembly;self.masters={};self.skulls={};self.poses={}
        for d in DIRS:
            r=assembly.load_meta('male','idle')[(0,d)];im=Image.open(assembly.ART/f'male_idle_0_{d}.png').convert('RGBA');_,h,_=assembly.head_info(im,r,'idle',0,d)
            self.skulls[d]=skull(h,r['neckY'])
            for style in STYLES:self.masters[(style,d)]=source_master(style,d)

    def painted(self,style,action,phase,d):
        canonical=self.masters[(style,d)]
        if action=='idle':return canonical
        key=(style,action,phase,d)
        if key in self.poses:return self.poses[key]
        original=d;mirror=d in ['E','SE','NE'];d={'E':'W','SE':'SW','NE':'NW'}.get(d,d)
        source=Image.open(RAW/f'hair-{style}-{action}-raw.png').convert('RGBA');count=prep.COUNTS[action];row=prep.ROWS.index(d)
        tile=source.crop((round(phase*source.width/count),round(row*source.height/5),round((phase+1)*source.width/count),round((row+1)*source.height/5)))
        tile=extract(tile.resize((48,48),Image.Resampling.NEAREST),style)
        if mirror:tile=tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        tile=self.transform_pose(tile,style,original)
        # Hair roots cannot change with every footstep. Preserve the complete
        # character's root pixels; use newly painted phases only at the ends.
        alpha=canonical.getchannel('A');core=alpha.filter(ImageFilter.MinFilter(3))
        limit=alpha.filter(ImageFilter.MaxFilter(7 if style=='brown_ponytail' else 3))
        # Facial openings belong to the master. Never grow a second fringe
        # into an exposed eye or introduce disconnected strands over cheeks.
        for y in range(48):
            for x in range(48):
                if not limit.getpixel((x,y)):tile.putpixel((x,y),(0,0,0,0))
                if core.getpixel((x,y)):tile.putpixel((x,y),canonical.getpixel((x,y)))
                if 15<=x<=33 and 18<=y<27:
                    # Solid scalp and the hairline remain exactly registered.
                    tile.putpixel((x,y),canonical.getpixel((x,y)))
                if style=='brown_ponytail' and y<27 and alpha.getpixel((x,y)):
                    # Preserve thin temple/tie connections too. Erosion alone
                    # loses single-pixel roots on the mirrored ponytail side.
                    tile.putpixel((x,y),canonical.getpixel((x,y)))
        points=[(x,y) for y in range(48) for x in range(48) if tile.getpixel((x,y))[3]]
        groups=prep.components(points);connected=set(groups[0])
        for x,y in points:
            if (x,y) not in connected:tile.putpixel((x,y),(0,0,0,0))
        tile=self.finalize_pose(tile,style,original)
        self.poses[key]=tile
        return tile

    def __call__(self,style,action,phase,d,head,neck):
        tile=self.painted(style,action,phase,d);cx,top,width=skull(head,neck);scx,st,sw=self.skulls[d];scale=width/sw
        resized=tile.resize((round(48*scale),round(48*scale)),Image.Resampling.NEAREST)
        at=(round(cx-(scx-48)*scale),round(top-(st-36)*scale))
        back=Image.new('RGBA',(144,144));back.alpha_composite(resized,at);front=back.copy()
        if d not in ['N','NW','NE']:
            front.paste((0,0,0,0),(0,neck+1,144,144))
            facecx=cx+({'W':-3,'SW':-2,'E':3,'SE':2}.get(d,0))
            for y in range(top+11,min(144,neck+1)):
                half=max(2,(neck-y)*.5+2)
                for x in range(max(0,round(facecx-half)),min(144,round(facecx+half)+1)):
                    front.putpixel((x,y),(0,0,0,0))
        l=round(cx-(width-1)/2);r=l+width
        fringe=sum(front.getpixel((x,y))[3]>0 for y in range(top+6,min(neck,top+11)) for x in range(l,r))
        return front,back,dict(skull=[l,top,r,neck],center=cx,forehead=top+6,fringePixels=fringe,authoredFaceOpening=True,integratedReference=True,rootScale=scale)
