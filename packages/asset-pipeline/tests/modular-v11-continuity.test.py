"""One face/scale through locomotion, chop/cast and exact entry/exit poses."""
from pathlib import Path
import sys,importlib.util,json
from PIL import Image,ImageFilter
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from modular_v11_hair import HairLibrary,STYLES,DIRS,prep
spec=importlib.util.spec_from_file_location('A',Path(__file__).resolve().parents[1]/'scripts/assemble-modular-v7.py');A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A);H=HairLibrary(A)
count=0
for sex,lib in H.identities.items():
 for d in DIRS:
  cx,top,width=lib.skulls[d];cx-=48;top-=36;l=round(cx-(width-1)/2);r=l+width-1
  for style in STYLES:
   master=lib.masters[(style,d)];core=master.getchannel('A').filter(ImageFilter.MinFilter(3))
   for action,phases in prep.COUNTS.items():
    states=set()
    for p in range(phases):
     frame=lib.painted(style,action,p,d);states.add(frame.tobytes())
     assert set(frame.getchannel('A').tobytes())<=set([0,255]),'Blurry alpha on character'
     for y in range(48):
      for x in range(48):
       if core.getpixel((x,y)) or y<top+5 or (l-1<=x<=r+1 and y<lib.necks[d]+1):
        assert frame.getpixel((x,y))==master.getpixel((x,y)),f'Identity/forehead drift {sex}/{style}/{d}/{action}/{p}'
     count+=1
    if action!='idle':assert len(states)>=2,f'No authored end movement {sex}/{style}/{d}/{action}'
print(f'PASS v11 source: {count} complete-head poses, immutable face/scalp, binary alpha, moving painted ends')
# Atlas checks run only when V11 has been assembled.
C=json.loads((A.OUT/'catalog.json').read_text(encoding='utf8'))
if C.get('hairRevision')!=11:sys.exit(0)
assert C['integratedHeads'] and C['canonicalActionHeads'] and C['transitionPoses']
lookup={r['name']:r['cell'] for r in json.loads((A.OUT/'aether_shared-slices.json').read_text())};pages={}
def sprite(name):
 k=lookup[name];page=k//256
 if page not in pages:pages[page]=Image.open(A.OUT/f'aether_shared-{page}.png').convert('RGBA')
 return pages[page].crop((k%16*176,k%256//16*176,k%16*176+176,k%256//16*176+176))
transitions=0
for identity in C['identities']:
 for d in DIRS:
  idle=next(s for s in identity['sequences'] if s['action']=='idle' and s['direction']==d)['frames'][0]
  for action in ['attack','cast']:
   seq=next(s for s in identity['sequences'] if s['action']==action and s['direction']==d)
   for frame in [seq['frames'][0],seq['frames'][-1]]:
    assert frame['transitionPose']
    for key in ['bodyPrefix','garmentPrefix','hairPrefix','headAnchor','weaponGrips','weaponOrders']:assert frame[key]==idle[key],f'Entry/exit pops: {key}'
    for suffix in ['_identity','_identity_clothed','_sword','_staff','_hand_sword','_hand_staff']:
     assert sprite(frame['name']+suffix).tobytes()==sprite(idle['name']+suffix).tobytes(),f'Entry/exit sprite differs: {suffix}'
    transitions+=1
bindings=json.loads((A.OUT/C['hairBindings']).read_text())
for b in bindings:
 assert b['rootScale']==1 and b['identityReplaced'],'Head resized or duplicated on an action'
 name=f"hair_{b['sex']}_{b['action']}_{b['phase']}_{b['style']}_{b['direction']}_front"
 idle_name=f"hair_{b['sex']}_idle_0_{b['style']}_{b['direction']}_front"
 actual,standing=sprite(name),sprite(idle_name);dx,dy=b['translation']
 lib=H.identities[b['sex']];cx,top,w=lib.skulls[b['direction']];left=round(cx-(w-1)/2)
 for y in range(top,lib.refs[b['direction']].getbbox()[3]):
  for x in range(left,left+w):
   assert actual.getpixel((x+16+dx,y+24+dy))==standing.getpixel((x+16,y+24)),f'Exported face changes on action: {name}'

print(f'PASS v11 atlas: {transitions} exact idle-to-action entry/exit poses; {len(bindings)} fixed-scale head bindings; accepted hit timing')
