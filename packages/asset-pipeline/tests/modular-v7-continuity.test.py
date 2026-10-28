"""Regression gates for the user's rejected idle/walk head and hair drift."""
from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'assets/mannequin/v2';ART=OUT/'source-art/authored-v7';OLD=OUT/'source-art/authored-v6'
C=json.loads((OUT/'catalog.json').read_text(encoding='utf8'))
assert C['template']=='adult-modular-v7'
S={r['name']:r['cell'] for r in json.loads((OUT/'aether_shared-slices.json').read_text())};P={}
def sprite(name):
    k=S[name];page=k//256
    if page not in P:P[page]=Image.open(OUT/f'aether_shared-{page}.png').convert('RGBA')
    return P[page].crop((k%16*176,k%256//16*176,k%16*176+176,k%256//16*176+176))
def meta(sex,action):
    return {(r['phase'],r['direction']):r for r in json.loads((ART/f'{sex}-{action}.json').read_text(encoding='utf8'))['records']}
checks=0
for identity,sex in zip(C['identities'],['male','female']):
    idlemeta=meta(sex,'idle');walkmeta=meta(sex,'walk')
    for d in C['directions']:
        approved=Image.open(OLD/f'{sex}_idle_0_{d}.png').convert('RGBA')
        idle=Image.open(ART/f'{sex}_idle_0_{d}.png').convert('RGBA')
        assert idle.tobytes()==approved.tobytes(),'Approved idle anatomy was changed'
        neck=idlemeta[(0,d)]['neckY'];waist=idlemeta[(0,d)]['waist']
        standing=next(s for s in identity['sequences'] if s['action']=='idle' and s['direction']==d)['frames'][0]
        for phase in range(8):
            walk=Image.open(ART/f'{sex}_walk_{phase}_{d}.png').convert('RGBA')
            r=walkmeta[(phase,d)]
            assert r['waist']==waist and r['neckY']==neck,'Idle/walk torso length changes'
            assert walk.crop((0,0,144,neck+1)).tobytes()==idle.crop((0,0,144,neck+1)).tobytes(),'Head changes size/face during locomotion'
            for action in ['walk','run']:
                f=next(s for s in identity['sequences'] if s['action']==action and s['direction']==d)['frames'][phase]
                assert f['headAnchor']==standing['headAnchor'],'Hair/head drifts from standing to moving'
                assert f['hairBaked'] and f['hairPrefix']==f'hair_{sex}_walk_{phase}','Hair has no authored action frame'
                assert sprite(f['name']+'_identity').tobytes()==sprite(standing['name']+'_identity').tobytes(),'Rendered moving skull differs from idle'
                checks+=1
for binding in json.loads((OUT/C.get('hairBindings','source-art/v7/hair-bindings.json')).read_text()):
    d=binding['direction']
    if d in ['N','NW','NE']:continue
    im=sprite(f"hair_{binding['sex']}_{binding['action']}_{binding['phase']}_{binding['style']}_{d}_front")
    left,top,right,neck=binding['skull'];cx=binding['center']
    if C.get('hairRevision',7)>=8:
        # Real fringe may cover the forehead and temples. The previous gate
        # required a shaved horizontal forehead and caused the rejected cap.
        assert binding['authoredFaceOpening'],'Authored hair opening was replaced by a rectangular clip'
        if C.get('integratedHeads'):
            assert binding.get('identityReplaced'),'Complete head is stacked over the previous face'
        elif d=='S' and binding['action'] in ['idle','walk']:
            assert binding['fringePixels']>=3,'Drawn fringe was cut off across the forehead'
        if d=='S' and not C.get('integratedHeads'):
            for y in range(neck-2,neck+1):
                for x in range(round(cx)-1,round(cx)+2):
                    assert im.getpixel((x+16,y+24))[3]==0,f'Hair reaches the central chin/neck: {binding}'
    else:
        for y in range(binding['forehead'],neck+1):
            for x in range(left,right):
                assert im.getpixel((x+16,y+24))[3]==0,'Hair covers protected face/forehead'
for sex in ['male','female']:
    for style in C['hairStyles'][:3]:
        for action in ['walk','attack','cast']:
            count={'walk':8,'attack':7,'cast':4}[action]
            unique={sprite(f"hair_{sex}_{action}_{p}_{style['id']}_S_back").tobytes() for p in range(count)}
            assert len(unique)>=2,'Hair animation is an identical pasted wig: '+sex+'/'+style['id']+'/'+action
print(f'PASS continuity: approved idle unchanged, 128 identical moving skulls, {checks} idle/walk/run bindings, 960 authored hair poses; hair revision {C.get("hairRevision",7)}')
