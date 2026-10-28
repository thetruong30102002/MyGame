"""Natural fringe and crown registered to the actual eight-direction face rig.

A single uniform scale preserves each painted lock's proportions. The scalp
and face own the anchors; a bun or ponytail may extend past the common crown.
Hair-only alpha is retained verbatim so pale highlights cannot become holes.
The revised fringe reaches the eyebrow anchors and covers the upper forehead.
"""
from PIL import Image
from modular_v9_hair import HairLibrary as Previous,STYLES,DIRS,prep,ROOT

class HairLibrary(Previous):
    def __init__(self,assembly):
        super().__init__(assembly)
        original={k:v.copy() for k,v in self.masters.items()}
        raw=Image.open(ROOT/'assets/mannequin/v2/source-art/v10/natural-fringe-hair-raw.png').convert('RGBA')
        tiles={}
        for row,style in enumerate(STYLES):
            for col,d in enumerate(DIRS):
                tile=raw.crop((round(col*raw.width/8),round(row*raw.height/3),round((col+1)*raw.width/8),round((row+1)*raw.height/3)))
                tile.paste((0,0,0,0),(0,0,round(tile.width*.12),round(tile.height*.12)))
                tile.paste((0,0,0,0),(round(tile.width*.88),round(tile.height*.88),tile.width,tile.height))
                tiles[(style,d)]=prep.clean(tile).resize((48,48),Image.Resampling.NEAREST)
        self.fits={};self.references={}
        for d in DIRS:
            reference=original[('chestnut_short',d)].getbbox()
            source=tiles[('chestnut_short',d)].getbbox()
            scale=1.0
            # Same scale for all three styles. Never shrink X and Y
            # independently or include the ponytail in a crown width metric.
            at=(round((reference[0]+reference[2]-1)/2-(source[0]+source[2]-1)/2*scale),round(reference[1]+1-source[1]*scale))
            self.references[d]=reference
            for style in STYLES:
                fitted=Image.new('RGBA',(48,48))
                resized=tiles[(style,d)].resize((round(48*scale),round(48*scale)),Image.Resampling.NEAREST)
                fitted.alpha_composite(resized,at)
                self.masters[(style,d)]=fitted
                # Register the independently painted animation ends to the
                # same natural crown, then Previous.painted locks the roots.
                old=original[(style,d)].getbbox()
                if style=='chestnut_short':self.fits[(style,d)]=(1,0,0)
                else:
                    sx=(reference[2]-reference[0])/(27 if style=='brown_ponytail' else old[2]-old[0])
                    cx=(self.skulls[d][0]-48)
                    y=26 if style=='brown_ponytail' else old[1]
                    ty=(26 if style=='brown_ponytail' else reference[1])-y*sx
                    self.fits[(style,d)]=(sx,cx*(1-sx),ty)

    def transform_pose(self,tile,style,d):
        scale,tx,ty=self.fits[(style,d)]
        out=Image.new('RGBA',(48,48))
        out.alpha_composite(tile.resize((round(48*scale),round(48*scale)),Image.Resampling.NEAREST),(round(tx),round(ty)))
        return out

    def finalize_pose(self,tile,style,d):
        # Preserve the whole attachment zone, including transparent face
        # openings. Eroding alpha alone loses one-pixel fringe connections.
        cx,top,width=self.skulls[d];cx-=48;top-=36
        left=round(cx-(width-1)/2)-1;right=round(cx+(width-1)/2)+1
        master=self.masters[(style,d)]
        for y in range(round(top)-1,round(top)+10):
            for x in range(left,right+1):tile.putpixel((x,y),master.getpixel((x,y)))
        return tile

    def __call__(self,*args):
        front,back,meta=super().__call__(*args)
        d=args[3];l,t,r,b=self.references[d];cx,top,width=self.skulls[d]
        meta['capStandard']='natural-fringe;uniform-scale;fixed-forehead-and-ear-anchors'
        meta['capRect']=[l+48,t+36,r+48,b+36]
        meta['crownReference']='v10-hairline-face-guide'
        return front,back,meta
