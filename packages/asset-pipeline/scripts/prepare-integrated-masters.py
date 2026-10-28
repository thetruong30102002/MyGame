"""Register 15 complete source poses once, using traced anatomy landmarks.

Head/boot inspection windows below measure anatomy while excluding the painted
sword/staff. No pixels are split, masked, recoloured separately or composited.
Each entire finished pose receives exactly one uniform nearest transform.
"""
from pathlib import Path
import importlib.util,json
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
SOURCE=ROOT/'assets/player-integrated/source-art'
OUT=SOURCE/'fullhero-v14'
DIRS=['S','E','N','SE','NE'];STATES=['none','sword','staff']
# Actual scalp/boot centres traced from the full 5-column x3-state source.
# Windows are anatomical measurement guides, never runtime/image layer masks.
CENTRES={
 'none':[180,170,160,160,155],
 'sword':[177,169,160,160,155],
 'staff':[195,182,160,177,150],
}

def prepare():
    path=SOURCE/'master-states-drawn.png';source=Image.open(path).convert('RGBA')
    states={};images=[];entries=[]
    for row,state in enumerate(STATES):
        states[state]={}
        for col,d in enumerate(DIRS):
            rect=(round(col*source.width/5),round(row*source.height/3),round((col+1)*source.width/5),round((row+1)*source.height/3))
            tile=source.crop(rect);tile.putalpha(tile.getchannel('A').point(lambda a:255 if a>=235 else 0))
            centre=CENTRES[state][col]
            crown_window=[centre-35,0,centre+35,100]
            crown=tile.crop(tuple(crown_window)).getbbox()
            if not crown:raise ValueError('Missing traced scalp '+state+'/'+d)
            crown_y=crown[1]
            boot_window=[centre-42,240,centre+42,tile.height]
            boots=tile.crop(tuple(boot_window)).getbbox()
            if not boots:raise ValueError('Missing traced boots '+state+'/'+d)
            floor=240+boots[3]-1
            # Include BOTH boot soles on diagonal stances, even when one sole
            # is several pixels higher; anchoring only the lowest boot would
            # move the whole actor sideways when changing weapon state.
            foot_band=tile.crop((centre-42,floor-22,centre+42,floor+1)).getbbox()
            foot_x=centre-42+(foot_band[0]+foot_band[2]-1)/2
            height=floor-crown_y+1;scale=73/height
            tx=72-foot_x*scale;ty=128-floor*scale
            # One true uniform affine nearest transform, including all painted
            # body, outfit, hair and held weapon pixels as a complete sprite.
            final=tile.transform((144,144),Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),resample=Image.Resampling.NEAREST)
            states[state][d]=dict(sourceRect=list(rect),crownWindow=crown_window,bootWindow=boot_window,
                crownY=crown_y,footRoot=[foot_x,floor],anatomyHeight=height,
                uniformScale=scale,destinationTranslate=[tx,ty],destinationRoot=[72,128],targetBodyHeight=73)
            images.append(final);entries.append((state,d))
    spec=importlib.util.spec_from_file_location('integrated_export',Path(__file__).with_name('export-player-integrated.py'))
    export=importlib.util.module_from_spec(spec);spec.loader.exec_module(export)
    # Median cut alone can discard rare blue gem pixels among fifteen bodies.
    # Reserve eight colours sampled from the actual painted blue accents, then
    # quantize the entire complete-sprite family through one shared64 palette.
    body=export.palette_family(images,56)
    base_colors=set(c[:3] for im in body for _,c in im.getcolors(144*144) if c[3])
    blues=[]
    for im in images:
        for number,c in im.getcolors(144*144):
            r,g,b,a=c
            if a and b>140 and b-r>50 and b>g*1.12:blues.extend([c[:3]]*number)
    if blues:
        sample=Image.new('RGB',(len(blues),1));sample.putdata(blues)
        accent=sample.quantize(colors=8,dither=Image.Dither.NONE).convert('RGB')
        accents=set(c for _,c in accent.getcolors(len(blues)))
        colors=sorted(base_colors)+sorted(accents-base_colors)
        palette=Image.new('P',(1,1));palette.putpalette([v for c in colors for v in c]+[0]*(768-3*len(colors)))
        mapped=[]
        for image in images:
            out=image.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA')
            out.putalpha(image.getchannel('A'));mapped.append(out)
        images=mapped
    else:colors=sorted(base_colors);images=body
    contacts={state:Image.new('RGBA',(144*5,144),(30,32,35,255)) for state in STATES}
    transparent={state:Image.new('RGBA',(144*5,144)) for state in STATES}
    for image,(state,d) in zip(images,entries):
        output=OUT/'masters'/state/f'{d}.png';output.parent.mkdir(parents=True,exist_ok=True);image.save(output)
        contacts[state].alpha_composite(image,(DIRS.index(d)*144,0));transparent[state].alpha_composite(image,(DIRS.index(d)*144,0))
    for state,contact in contacts.items():
        contact.save(OUT/f'master-{state}-native.png')
        contact.resize((contact.width*4,contact.height*4),Image.Resampling.NEAREST).save(OUT/f'master-{state}-4x.png')
        transparent[state].save(OUT/f'master-{state}-reference.png')
    (OUT/'master-registration.json').write_text(json.dumps(dict(source=str(path.relative_to(ROOT)),sourceGrid=[5,3],frameSize=[144,144],root=[72,128],ppu=48,bodyHeight=73,maxColors=64,palette=['#%02x%02x%02x'%c for c in colors],states=states),indent=2)+'\n',encoding='utf8')
    print('Registered 15 complete native144 masters; shared64colours; body73, root72,128; no part layers')

if __name__=='__main__':prepare()
