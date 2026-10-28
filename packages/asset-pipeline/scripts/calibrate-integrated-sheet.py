"""Measure fixed whole-row sprite registration and render complete-sprite reviews.

Measurement windows locate actual crown/soles; they never alter source pixels.
One scale and translation per direction applies to every complete source pose.
"""
from pathlib import Path
import argparse,importlib.util,json,statistics
from PIL import Image,ImageChops

ROOT=Path(__file__).resolve().parents[3]
DEFAULT=ROOT/'assets/player-integrated/source-art/fullhero-v14/registration.json'
spec=importlib.util.spec_from_file_location('full_export',Path(__file__).with_name('export-player-integrated.py'))
exporter=importlib.util.module_from_spec(spec);spec.loader.exec_module(exporter)

def calibrate(config_path,filename,row_ranges=None):
    cfg=json.loads(config_path.read_text(encoding='utf-8-sig'))
    sheet=next(s for s in cfg['sheets'] if Path(s['file']).name==filename)
    raw=Image.open((config_path.parent/sheet['file']).resolve()).convert('RGBA')
    if row_ranges:sheet['rowRanges']=dict(zip(sheet['directions'],row_ranges))
    report={};sheet['rawRegistration']={}
    for row,direction in enumerate(sheet['directions']):
        measured=[]
        for col in sheet.get('registrationColumns',range(sheet['columns'])):
            box=exporter.source_cell_box(raw,sheet,col,row,direction)
            tile=raw.crop(box)
            if sheet.get('selectCompleteActor'):tile=exporter.select_complete_actor(tile)
            alpha=tile.getchannel('A').point(lambda a:255 if a>=cfg.get('alphaThreshold',235) else 0)
            bounds=alpha.getbbox()
            if not bounds:raise ValueError(f'Empty source {direction}/{col}')
            windows=sheet.get('landmarkWindows',{}).get(direction,{})
            crown_region=windows.get('crownWindow',[0,0,tile.width,tile.height])
            boots_region=windows.get('bootWindow',[0,0,tile.width,tile.height])
            crown=alpha.crop(crown_region).getbbox();boots=alpha.crop(boots_region).getbbox()
            if not crown or not boots:raise ValueError(f'Empty traced anatomy window {direction}/{col}')
            top=crown[1]+crown_region[1];floor=boots[3]+boots_region[1]-1
            sole_region=[boots_region[0],max(boots_region[1],floor-windows.get('soleBand',22)),boots_region[2],floor+1]
            soles=alpha.crop(sole_region).getbbox()
            root_x=(soles[0]+soles[2]-1)/2+sole_region[0]
            measured.append(dict(column=col,sourceCell=list(box),crownY=top,soleY=floor,rootX=root_x,height=floor-top+1,alphaBounds=list(bounds)))
        height=statistics.median(m['height'] for m in measured)
        floor=statistics.median(m['soleY'] for m in measured)
        root_x=statistics.median(m['rootX'] for m in measured)
        scale=73/height;tx=72-root_x*scale;ty=128-floor*scale
        sheet['rawRegistration'][direction]=dict(scale=scale,translate=[tx,ty],anatomyHeight=height,sourceRoot=[root_x,floor],targetBodyHeight=73)
        report[direction]=dict(registration=sheet['rawRegistration'][direction],measured=measured)
    config_path.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    name=Path(filename).stem;out=config_path.parent/'review'/name;out.mkdir(parents=True,exist_ok=True)
    images=[];positions=[]
    for row,direction in enumerate(sheet['directions']):
        for col in range(sheet['columns']):
            box=exporter.source_cell_box(raw,sheet,col,row,direction)
            im,_=exporter.register_complete(raw.crop(box),cfg,sheet,direction)
            images.append(im);positions.append((row,direction,col))
    images=exporter.palette_family(images,cfg.get('maxColors',128))
    contact=Image.new('RGBA',(144*sheet['columns'],144*sheet['rows']))
    for im,(row,direction,col) in zip(images,positions):
        alpha=im.getchannel('A');im=Image.merge('RGBA',tuple(ImageChops.multiply(c,alpha) for c in im.split()[:3])+(alpha,))
        im.save(out/f'{direction}-{col:02}.png');contact.paste(im,(col*144,row*144))
    contact.save(out/'native.png')
    contact.resize((contact.width*4,contact.height*4),Image.Resampling.NEAREST).save(out/'4x.png')
    report_path=config_path.parent/f'{name}-registration.json'
    report_path.write_text(json.dumps(dict(file=filename,sourceSize=list(raw.size),rowRanges=sheet.get('rowRanges'),directions=report),indent=2)+'\n',encoding='utf8')
    print(f'READY {out}/native.png; fixed whole-row transforms recorded in {config_path}')
    print(json.dumps({d:report[d]['registration'] for d in report},indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--config',type=Path,default=DEFAULT)
    parser.add_argument('--file',required=True);parser.add_argument('--row-ranges',type=json.loads)
    args=parser.parse_args();calibrate(args.config,args.file,args.row_ranges)
