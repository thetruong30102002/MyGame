"""Trace complete source rows; uniform registration, never pose/body-part fitting."""
from pathlib import Path
import importlib.util,json
from PIL import Image
P=Path(__file__).resolve().parents[3]
C=P/'assets/player-integrated/source-art/fullhero-v14/registration.json'
spec=importlib.util.spec_from_file_location('calibrate',Path(__file__).with_name('calibrate-integrated-sheet.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
cfg=json.loads(C.read_text(encoding='utf-8-sig'))
for sheet in cfg['sheets']:
 if sheet.get('rawRegistration'):continue
 file=C.parent/sheet['file']
 if not file.exists():continue
 raw=Image.open(file).convert('RGBA');a=raw.getchannel('A').point(lambda v:255 if v>=235 else 0)
 bands=[];start=None
 for y in range(raw.height):
  count=a.crop((0,y,raw.width,y+1)).histogram()[255]
  if count>=4 and start is None:start=y
  elif count<4 and start is not None:bands.append([start,y]);start=None
 if start is not None:bands.append([start,raw.height])
 if len(bands)!=5:raise ValueError(f'Need manual five row cuts: {file.name} {bands}')
 cuts=[0]+[(bands[i-1][1]+bands[i][0])//2 for i in range(1,5)]+[raw.height]
 sheet['rowRanges']={d:[cuts[i],cuts[i+1]] for i,d in enumerate(sheet['directions'])}
 sheet['registrationColumns']=[0,4] if sheet['columns']==8 else [0,11] if sheet['columns']==12 and not file.name.startswith('reactions') else [0,3]
 sheet['landmarkWindows']={}
 cw=raw.width/sheet['columns'];pad=sheet.get('cellPadding',0)
 for i,d in enumerate(sheet['directions']):
  h=cuts[i+1]-cuts[i]
  # Central crown sample excludes the lateral staff crystal; lower central
  # boot window excludes the held weapon's projecting blade/shaft.
  staff='staff' in sheet['file']
  sheet['landmarkWindows'][d]={
   'crownWindow':[round(cw*(.46 if staff else .42))+pad,0,round(cw*(.55 if staff else .61))+pad,h],
   'bootWindow':[round(cw*.36)+pad,round(h*.48),round(cw*.66)+pad,h],
   'soleBand':max(5,round(h*.08))}
cfg['maxColors']=128
for sheet in cfg['sheets']:
 for g in sheet['groups']:
  if g['action']=='attack':g['hitFrame']=7
cfg['bodyHeight']=73
cfg['aliases'].update({
 'revive':{'source':'death','reverse':True},
 'revivesword':{'source':'deathsword','reverse':True},
 'revivestaff':{'source':'deathstaff','reverse':True}})
C.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for sheet in cfg['sheets']:
 if not sheet.get('rawRegistration') and (C.parent/sheet['file']).exists():
  m.calibrate(C,Path(sheet['file']).name)
