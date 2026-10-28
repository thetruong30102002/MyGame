"""Bind the inspected 30 turnarounds to their exported art status."""
from pathlib import Path
import hashlib,json
B=Path(__file__).resolve().parent;roster=json.loads((B/'roster.json').read_text(encoding='utf8'));review=[];jobs=[]
combat={'sword':'attack','staff':'cast','bow':'shoot','spear':'thrust','shield':'bash'}
poses={
 'walk':'8 gentle alternating leg phases: right contact, down, passing, up, left contact, down, passing, up. No half-cycle mirroring of weapon hand.',
 'run':'8 controlled running phases: near-leg contact, compression, passing/push-off, flight; far-leg contact, compression, passing/push-off, flight. Preserve skull/torso size, allow natural knee bend and small hip lean.',
 'attack':'12 phases of a single decisive TWO-HANDED overhead chop: master, grip joins, lift, hands above forehead, high anticipation, blade behind crown, downstroke, impact, low follow-through, recover, return, master. Hands wrap the same hilt.',
 'cast':'12 phases: master, settle, free hand to chest, gather gesture, lift staff, extend free palm, point/release, release hold, follow-through, lower, return, master. Exactly one rigid staff enclosed in gripping hand; effects are drawn by game.',
 'shoot':'12 phases: master, raise bow, string hand approaches, nock one arrow, half draw, full draw, aim, release, free-hand follow-through, lower bow, return, master. Bow is one rigid held weapon; string connects both tips and bends naturally when drawn.',
 'thrust':'12 phases: master, settle, front grip, back hand joins shaft, lower spear, coil back, straight two-handed thrust, impact, pull back, raise/recover, return, master. One rigid straight shaft with unchanged length; no extra weapon.',
 'bash':'12 phases: master, widen stance, bend knees, raise shield, brace, drive hip forward, decisive forearm shield bash, impact hold, withdraw shield, settle, return, master. Shield strapped firmly to ONE forearm, free hand remains empty.'}
facing={'S':'exactly FRONT facing viewer, two eyes equally visible','SE':'front-right three-quarter','E':'RIGHT side profile','NE':'back-right three-quarter','N':'exactly BACK away from viewer, no face visible; front hands naturally occluded by torso'}
for c in roster['characters']:
    native=B/'native'/c['id'];reg=json.loads((native/'registration.json').read_text());sheet=native/'idle-8views.png'
    assert sheet.exists() and not any(f['clipped'] or f['sourceEdge'] for f in reg.get('frames',[]))
    c.update(masterStatus='user-approved-v17' if c.get('reference') else 'drawn-native-reviewed',nativeSheet=f"native/{c['id']}/idle-8views.png",selectedMasterFile=reg.get('source',c['masterFile']),turnaroundFrameCount=8)
    review.append({'id':c['id'],'classId':c['role'],'gender':c['gender'],'directions':['S','SE','E','NE','N','NW','W','SW'],'nativeSheetSha256':hashlib.sha256(sheet.read_bytes()).hexdigest(),'visualReview':'inspected complete native turnarounds','userApproved':bool(c.get('reference')),'coreMotionReady':bool(c.get('reference'))})
    if c.get('reference'):continue
    for direction in ['S','SE','E','NE','N']:
        for action,n,fps in [('walk',8,8),('run',8,11),(combat[c['role']],12,16)]:
            prompt=f"Use Image1 as the exact complete {c['gender']} {c['role']} character master. Draw {n} sequential {action} frames in {facing[direction]} direction. {poses[action]} Layout 4 columns by {n//4} rows, order left to right then down. All frames are complete hair/face/body/clothes/hands/one weapon drawings. Match master face, hair shape, fitted outfit, limb lengths and body proportions, approximately75 native pixels crown to sole and23px head width on144px logical canvas, root72/128. Keep a SINGLE physical camera scale and palette across phases; crouching does not enlarge the actor. Hands visibly enclose grip, weapon remains the same rigid shape and same anatomical hand across all frames. Generous blank margins including above sword tips and beside spear thrusts. Crisp detailed game pixel clusters, transparent background, no blur, gradient smoothing, detached parts, body overlays, extra weapons, text, motion trails or ground circles. Camera never changes within this sheet."
            jobs.append({'id':f"{c['id']}-{action}-{direction}",'character':c['id'],'classId':c['role'],'direction':direction,'action':action,'frames':n,'fps':fps,'master':f"action-references/{c['id']}/{direction}-master.png",'prompt':prompt,'status':'planned-not-generated','artApproved':False})
roster['stage']='30 turnarounds drawn and reviewed; 28 new core motion sets pending'
(B/'roster.json').write_text(json.dumps(roster,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(B/'art-review.json').write_text(json.dumps({'date':'2026-10-25','turnaroundsReviewed':30,'framesReviewed':240,'newUserApprovalClaimed':False,'characters':review},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(B/'motion-jobs.json').write_text(json.dumps({'version':18,'approvedExistingCharacters':2,'newCharacterMotionSetsPending':28,'authoringDirections':['S','SE','E','NE','N'],'reflections':{'W':'E','SW':'SE','NW':'NE'},'jobs':jobs},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Recorded30 native art reviews; prepared',len(jobs),'per-direction motion jobs (not generated).')
