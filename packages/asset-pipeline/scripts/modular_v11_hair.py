"""Complete, joined head/hairstyle masters; fixed identity across every action.

Register on the chin/neck, never on the asymmetric hairstyle bounding box.
The face and roots stay exact while the previously painted action ends move.
"""
from PIL import Image,ImageFilter
from modular_v9_hair import HairLibrary as Previous,STYLES,DIRS,prep,ROOT,skull
from modular_v11_continuity import harmonize
RAW=ROOT/'assets/mannequin/v2/source-art/v11'

def bright_skin(c):
    r,g,b,a=c
    return a and r>210 and g>140 and b>95 and r-b>55

def neck_center(tile,bottom):
    pts=[x for y in range(max(0,bottom-2),min(48,bottom)) for x in range(48) if bright_skin(tile.getpixel((x,y)))]
    return sum(pts)/len(pts) if pts else (tile.getbbox()[0]+tile.getbbox()[2]-1)/2

class IdentityHeads(Previous):
    def __init__(self,assembly,sex):
        super().__init__(assembly);self.sex=sex;self.refs={};self.necks={};self.capwidths={}
        raw=Image.open(RAW/f'{sex}-integrated-heads-raw.png').convert('RGBA');tiles={}
        for row,style in enumerate(STYLES):
            for col,d in enumerate(DIRS):
                t=raw.crop((round(col*raw.width/8),round(row*raw.height/3),round((col+1)*raw.width/8),round((row+1)*raw.height/3)))
                t.paste((0,0,0,0),(0,0,round(t.width*.14),round(t.height*.14)));t.paste((0,0,0,0),(round(t.width*.86),round(t.height*.86),t.width,t.height))
                tiles[(style,d)]=prep.clean(t).resize((48,48),Image.Resampling.NEAREST)
        reference_widths=sorted(tiles[('chestnut_short',d)].getbbox()[2]-tiles[('chestnut_short',d)].getbbox()[0] for d in DIRS)
        common_scale=22/reference_widths[len(reference_widths)//2]
        for d in DIRS:
            record=assembly.load_meta(sex,'idle')[(0,d)];im=Image.open(assembly.ART/f'{sex}_idle_0_{d}.png').convert('RGBA');_,head,_=assembly.head_info(im,record,'idle',0,d)
            self.skulls[d]=skull(head,record['neckY']);self.refs[d]=head
            bottom=head.getbbox()[3]-36;self.necks[d]=bottom
            neckpoints=[x-48 for y in range(head.getbbox()[3]-2,head.getbbox()[3]) for x in range(144) if head.getpixel((x,y))[3]]
            nc=sum(neckpoints)/len(neckpoints)
            cap=tiles[('chestnut_short',d)].getbbox();width=self.skulls[d][2]+6
            scale=common_scale;self.capwidths[d]=22
            for style in STYLES:
                tile=tiles[(style,d)]
                ends=[]
                for fd in ['S','SW','W','E','SE']:
                    t=tiles[(style,fd)];ys=[y for y in range(48) for x in range(48) if bright_skin(t.getpixel((x,y)))]
                    ends.append(max(ys)+1)
                sourcebottom=sorted(ends)[len(ends)//2]
                cx=neck_center(tile,sourcebottom)
                fitted=Image.new('RGBA',(48,48));fitted.alpha_composite(tile.resize((round(48*scale),round(48*scale)),Image.Resampling.NEAREST),(round(nc-cx*scale),round(bottom-sourcebottom*scale)))
                # Palette registration preserves the painted silhouette and
                # makes its skin/light/shadow match the approved body.
                fitted=harmonize(fitted,head,24,only=bright_skin)
                fitted=harmonize(fitted,fitted,64)
                self.masters[(style,d)]=fitted

    def transform_pose(self,tile,style,d):
        # Drawn action ends are registered to the same neck-sized head.
        width=self.capwidths[d];scale=width/25
        out=Image.new('RGBA',(48,48));out.alpha_composite(tile.resize((round(48*scale),round(48*scale)),Image.Resampling.NEAREST),(round(24*(1-scale)),round(self.necks[d]-27*scale)))
        return out

    def finalize_pose(self,tile,style,d):
        master=self.masters[(style,d)];cx,top,width=self.skulls[d];cx-=48;top-=36
        left=round(cx-(width-1)/2);right=left+width-1;neck=self.necks[d]
        alpha=master.getchannel('A');core=alpha.filter(ImageFilter.MinFilter(3));near=alpha.filter(ImageFilter.MaxFilter(3));tail=alpha.filter(ImageFilter.MaxFilter(5))
        tile=harmonize(tile,master,64)
        for y in range(48):
            for x in range(48):
                # The complete face, scalp and forehead seam are immutable.
                fixed=core.getpixel((x,y)) or y<top+5 or (left-1<=x<=right+1 and y<neck+1)
                if fixed:tile.putpixel((x,y),master.getpixel((x,y)));continue
                limit=tail if style=='brown_ponytail' and y>=neck else near
                if not limit.getpixel((x,y)):tile.putpixel((x,y),(0,0,0,0))
                if y<top+10 and not left-3<=x<=right+3:tile.putpixel((x,y),master.getpixel((x,y)))
        return tile

class HairLibrary:
    def __init__(self,assembly):
        self.identities={sex:IdentityHeads(assembly,sex) for sex in ['male','female']}
    def __call__(self,style,action,phase,d,head,neck,sex='male'):
        lib=self.identities[sex];tile=lib.painted(style,action,phase,d)
        cx,top,width=skull(head,neck);rcx,rt,rw=lib.skulls[d]
        # No per-action resize: the same master face is merely translated.
        dx,dy=round(cx-rcx),top-rt
        back=Image.new('RGBA',(144,144));back.alpha_composite(tile,(48+dx,36+dy));front=back.copy()
        if d not in ['N','NW','NE']:front.paste((0,0,0,0),(0,neck+2,144,144))
        l=round(cx-(width-1)/2)
        return front,back,dict(skull=[l,top,l+width,neck],center=cx,forehead=top+6,fringePixels=10,authoredFaceOpening=True,integratedReference=True,rootScale=1,identityReplaced=True,referenceSex=sex,capStandard='neck-and-face-anchors;skull+6px;fixed-action-size',translation=[dx,dy])
