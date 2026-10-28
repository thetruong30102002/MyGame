"""Shared palette and exact directional head for every action."""
from PIL import Image

def palette_reference(image,colours=64):
    points=[c[:3] for c in image.getdata() if c[3]]
    strip=Image.new('RGB',(len(points),1));strip.putdata(points)
    return strip.quantize(colors=colours,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)

def harmonize(image,reference,colours=64,only=None):
    quantized=image.convert('RGB').quantize(palette=palette_reference(reference,colours),dither=Image.Dither.NONE).convert('RGB')
    result=image.copy()
    for y in range(image.height):
        for x in range(image.width):
            old=image.getpixel((x,y))
            if old[3] and (only is None or only(old)):result.putpixel((x,y),(*quantized.getpixel((x,y)),old[3]))
    return result

def canonical_actions(bodies,heads,anchors,metadata,skull):
    """Reuse exact idle face pixels. No per-action rescaling or new anatomy."""
    for key in list(heads):
        sex,action,phase,d=key
        if action in ['idle','walk']:continue
        idle=(sex,'idle',0,d);old=heads[key];reference=heads[idle]
        oldcx,oldtop,_=skull(old,metadata[key].get('neckY',anchors[key][1]+18))
        cx,top,_=skull(reference,metadata[idle]['neckY'])
        dx,dy=round(oldcx-cx),oldtop-top
        fixed=Image.new('RGBA',(144,144));fixed.alpha_composite(reference,(dx,dy))
        result=bodies[key].copy()
        # Remove the obsolete face rather than stacking a second head on it.
        for y in range(144):
            for x in range(144):
                if old.getpixel((x,y))[3]:result.putpixel((x,y),(0,0,0,0))
        # Retain the actual original neck below the copied directional face.
        stop=fixed.getbbox()[3]
        result.alpha_composite(bodies[key].crop((0,stop,144,144)),(0,stop))
        result.alpha_composite(fixed)
        bodies[key]=harmonize(result,reference,24,only=lambda c:c[0]>100 and c[0]-c[1]>20 and c[1]-c[2]>8)
        heads[key]=fixed
        anchors[key]=[anchors[idle][0]+dx,anchors[idle][1]+dy]
