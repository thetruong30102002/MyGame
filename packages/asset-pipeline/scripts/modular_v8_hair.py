"""Hair root registration. Preserve the authored fringe and temple silhouette."""
from PIL import Image
N=144

def hair_layers(tile,head,direction,neck):
    left,top,right,bottom=head.getbbox()
    points=[(x,y) for y in range(top,min(neck,top+12)) for x in range(left,right) if head.getpixel((x,y))[3]]
    sl=min(x for x,y in points);sr=max(x for x,y in points);cx=(sl+sr)/2
    tile=tile.crop(tile.getbbox())
    points=[(x,y) for y in range(max(1,round(tile.height*.48))) for x in range(tile.width) if tile.getpixel((x,y))[3]]
    cl=min(x for x,y in points);cr=max(x for x,y in points)
    scale=(sr-sl+5)/(cr-cl+1)
    hair=tile.resize((max(1,round(tile.width*scale)),max(1,round(tile.height*scale))),Image.Resampling.NEAREST)
    at=(round(cx-(cl+cr)/2*scale),top-5)
    back=Image.new('RGBA',(N,N));back.alpha_composite(hair,at)
    front=back.copy()
    # The authored transparent opening is the face mask. Never cut a straight
    # line through the bangs to expose the whole forehead. In front views the
    # long tail passes behind the shoulders; rear views show it over the back.
    if direction not in ['N','NW','NE']:
        front.paste((0,0,0,0),(0,neck+1,N,N))
        # A swinging ponytail can cross the face opening in the source. Its
        # lower portion belongs behind the jaw, not over the chin. Protect a
        # tapering lower-face region, leaving the whole authored fringe above
        # the nose intact (unlike v7's full-width forehead rectangle).
        facecx=cx+({'W':-3,'SW':-2,'E':3,'SE':2}.get(direction,0))
        for y in range(top+11,min(N,neck+1)):
            half=max(2,(neck-y)*.5+2)
            for x in range(max(0,round(facecx-half)),min(N,round(facecx+half)+1)):
                front.putpixel((x,y),(0,0,0,0))
    fringe=sum(front.getpixel((x,y))[3]>0 for y in range(top+6,min(neck,top+11)) for x in range(sl,sr+1))
    return front,back,dict(skull=[sl,top,sr+1,neck],center=cx,forehead=top+6,eyeLine=top+10,origin=list(at),fringePixels=fringe,authoredFaceOpening=True)
