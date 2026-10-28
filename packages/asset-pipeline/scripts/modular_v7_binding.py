"""Registration of authored equipment and wigs onto the approved skeleton."""
from PIL import Image
import math
N=144

def equipment_sheet(path,action,prep):
    """Read complete painted cells before fitting. Export size is not rig size.

    Fiducials label cells, but a generative editor can enlarge a figure inside
    them. Cropping at native y134 used to cut feet and leave a gigantic torso.
    Keep the entire connected figure and fit its skull/sole span explicitly.
    """
    raw=Image.open(path).convert('RGBA');cols,rows=(4,2) if action=='idle' else(prep.COUNTS[action],5)
    result={}
    for row in range(rows):
        for col in range(cols):
            tile=raw.crop((round(col*raw.width/cols),round(row*raw.height/rows),round((col+1)*raw.width/cols),round((row+1)*raw.height/rows)))
            # Remove corner fiducials before finding the connected artwork.
            tile.paste((0,0,0,0),(0,0,round(tile.width*.18),round(tile.height*.18)))
            tile.paste((0,0,0,0),(round(tile.width*.80),round(tile.height*.80),tile.width,tile.height))
            tile=prep.clean(tile)
            p,d=(0,prep.DIRS[row*4+col]) if action=='idle' else(col,prep.ROWS[row])
            result[(p,d)]=tile
    return result

def fit_complete_figure(raw,base,record,action,prep):
    # Each exported figure is first uniformly registered at the real skull
    # and sole. The narrower belt/neck correction follows afterwards.
    box=raw.getbbox();height=box[3]-box[1]
    targetheight=81 if action in ['idle','walk'] else base.getbbox()[3]-base.getbbox()[1]
    scale=targetheight/height
    return prep.register(raw,scale,action)[0]

def hair_layers(tile,head,direction,neck):
    """Cap size follows the actual skull, with a protected forehead/eye area.

    A rear silhouette is behind the face; only the cap/fringe and side locks
    may be in front. The old whole-wig-in-front duplicated the rear layer over
    the forehead and made the character appear to sink inside the hairstyle.
    """
    box=head.getbbox();left,top,right,bottom=box
    # Lower rows contain neck pixels and possibly wider collars. Skull width
    # is measured only across its upper half, not across shoulders or fists.
    pts=[(x,y) for y in range(top,min(neck,top+12)) for x in range(left,right) if head.getpixel((x,y))[3]]
    skullleft=min(x for x,y in pts);skullright=max(x for x,y in pts)
    width=skullright-skullleft+1;cx=(skullleft+skullright)/2
    tb=tile.getbbox();tile=tile.crop(tb)
    pts=[(x,y) for y in range(max(1,round(tile.height*.48))) for x in range(tile.width) if tile.getpixel((x,y))[3]]
    cl=min(x for x,y in pts);cr=max(x for x,y in pts)
    scale=(width+3)/(cr-cl+1)
    resized=tile.resize((max(1,round(tile.width*scale)),max(1,round(tile.height*scale))),Image.Resampling.NEAREST)
    at=(round(cx-(cl+cr)/2*scale),top-4)
    back=Image.new('RGBA',(N,N));back.alpha_composite(resized,at)
    front=back.copy();rear=direction in ['N','NW','NE']
    # The protected centre is the forehead down through the chin. Side locks
    # can fall beside the ears, never across the eyes, nose, mouth or collar.
    forehead=top+6
    for y in range(N):
        for x in range(N):
            if rear:
                keep=y<neck
            else:
                # Side locks live outside the face silhouette. A profile eye
                # can be near the left/right edge, not in its central third.
                keep=y<forehead or ((x<skullleft or x>skullright) and y<top+14)
            if not keep:front.putpixel((x,y),(0,0,0,0))
    return front,back,dict(skull=[skullleft,top,skullright+1,neck],forehead=forehead,center=cx)

def row_warp(im,source,target):
    result=Image.new('RGBA',(N,N))
    for y in range(N):
        i=next((i for i in range(len(target)-1) if target[i]<=y<=target[i+1]),None)
        sy=y if i is None else round(source[i]+(y-target[i])*(source[i+1]-source[i])/(target[i+1]-target[i]))
        if 0<=sy<N:result.paste(im.crop((0,sy,N,sy+1)),(0,y))
    return result

def face_neck(full,record,skin):
    # Locomotion hands are below the neck. A narrow silhouette at the neck
    # is reliable here; colour is not: ivory cloth and gold clasps can be
    # close to skin tones. Never include them in a connected face region.
    top=full.getbbox()[1]
    rows=range(max(60,top+14),min(75,top+24))
    return min(rows,key=lambda y:sum(full.getpixel((x,y))[3]>0 for x in range(57,88)))


def fit_equipment(full,base,record,action,skin):
    box=full.getbbox();aligned=Image.new('RGBA',(N,N))
    aligned.alpha_composite(full,(0,128-(box[3]-1)));full=aligned
    if action not in ['idle','walk']:return full
    tn=record['neckY'];sn=face_neck(full,record,skin)
    # The horizontal brown leather belt is distinct from a vertical sash.
    # A sash-colour peak previously registered its bottom as the waist.
    candidates=[]
    for y in range(record['waist']-7,record['waist']+9):
        n=0
        for x in range(64,81):
            r,g,b,a=full.getpixel((x,y))
            if a and r>65 and r>g*1.2 and g>b*1.3:n+=1
        if n>=5:candidates.append((n-abs(y-record['waist'])*.1,y))
    sw=max(candidates)[1] if candidates else record['waist']
    sn=max(tn-6,min(tn+8,sn));sw=max(sn+12,sw)
    full=row_warp(full,[sn,sw,128],[tn,record['waist'],128])
    y=tn+7
    bx=[x for x in range(35,110) if base.getpixel((x,y))[3]]
    sx=[x for x in range(35,110) if full.getpixel((x,y))[3]]
    if bx and sx:
        bc=(min(bx)+max(bx))/2;sc=(min(sx)+max(sx))/2
        scale=(max(bx)-min(bx)+5)/(max(sx)-min(sx)+1)
        fitted=Image.new('RGBA',(N,N))
        for y in range(N):
            # Keep the approved foot stride and boot scale. Shoulder padding
            # is fixed to two pixels on each side of the approved body.
            t=max(0,min(1,(y-record['waist'])/(128-record['waist'])))
            widthscale=scale+(1-scale)*t;shift=(bc-sc)*(1-t)
            for x in range(N):
                ix=round(sc+(x-sc-shift)/widthscale)
                if 0<=ix<N:fitted.putpixel((x,y),full.getpixel((ix,y)))
        full=fitted
    return full

def fit_pants(full,base,record,action,skin):
    if action not in ['idle','walk']:return full
    tn=record['neckY']
    sn=min(range(63,74),key=lambda y:sum(full.getpixel((x,y))[3]>0 for x in range(60,85)))
    # In pants-only art the waistband is the highest neutral/dark trouser
    # run, unambiguous against bare skin. Avoid bracelet pixels at the sides.
    rows=[]
    for y in range(record['waist']-8,record['waist']+10):
        xs=[]
        for x in range(64,81):
            r,g,b,a=full.getpixel((x,y))
            if a and r<100 and b>=r and g>=r*.9:xs.append(x)
        if len(xs)>=6:rows.append(y)
    sw=min(rows) if rows else record['waist']
    return row_warp(full,[sn,sw,128],[tn,record['waist'],128])

def bind_wrists(full,base,hands,skin):
    """Keep the actual authored bare hands; no second source hand can remain.

    Equipment artwork supplies sleeves/bracers. The common body supplies the
    palm and fingers, ensuring the hilt always crosses the gripping hand.
    """
    result=full.copy()
    for hx,hy in hands:
        # Source skin near a cuff is removed before the approved hand is
        # composited. Metal and cloth highlights are retained.
        for y in range(max(0,hy-8),min(N,hy+9)):
            for x in range(max(0,hx-9),min(N,hx+10)):
                r,g,b,a=full.getpixel((x,y))
                if a and r>140 and b>50 and 18<r-g<100 and 8<g-b<65:
                    result.putpixel((x,y),(0,0,0,0))
        for y in range(max(0,hy-3),min(N,hy+4)):
            for x in range(max(0,hx-3),min(N,hx+4)):
                c=base.getpixel((x,y))
                if skin(c):result.putpixel((x,y),c)
    return result

def arm_foreground(full,anchor,action,phase,prep):
    """A raised sleeved forearm may pass IN FRONT of the scalp/hair."""
    out=Image.new('RGBA',(N,N))
    if action!='attack' or phase not in [1,2]:return out
    points=[]
    for y in range(N):
        for x in range(N):
            r,g,b,a=full.getpixel((x,y))
            cloth=(b>r*1.15 and b>g*1.03) or (b>=r*.95 and g>=r*.95 and abs(r-g)<20)
            if a and cloth:points.append((x,y))
    cx,top=anchor
    for group in prep.components(points):
        if len(group)<8:continue
        # Eye/face highlights are isolated. A sleeve is connected to clothing
        # outside the head region, and can occlude the hair naturally.
        if not any(abs(x-cx)>12 or y<top-1 or y>top+19 for x,y in group):continue
        for x,y in group:
            if abs(x-cx)<=12 and top-1<=y<=top+19:out.putpixel((x,y),full.getpixel((x,y)))
    return out
