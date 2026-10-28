"""Đối chiếu file nguồn thực tế; không đánh dấu hoàn tất chỉ từ số job đã gửi."""
from pathlib import Path
import json,hashlib,datetime
B=Path(__file__).resolve().parent
def read(p):return json.loads(p.read_text(encoding='utf8'))
def save(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
jobs=read(B/'motion-jobs.json'); movement=[j for j in jobs['jobs'] if j['action'] in ('walk','run')]
missing=[]; drawn=[]; traced=[]
for j in movement:
    p=B/'motion'/(j['id']+'.png'); receipt=B/'movement-prompts'/(j['id']+'.json')
    proof=read(receipt) if receipt.exists() else {'id':j['id']}
    if p.exists():
        sha=hashlib.sha256(p.read_bytes()).hexdigest();drawn.append(j['id'])
        proof.update(status='generated-awaiting-native-review',sha256=sha,output='motion/'+p.name)
        trace=B/'movement-traces'/j['id']/'trace.json'
        if trace.exists():
            t=read(trace)
            if t.get('version')==2 and t.get('sha256')==sha and len(t['frames'])==8 and not any(f.get('clipped') or f.get('sourceEdge') for f in t['frames']):traced.append(j['id'])
    else:
        missing.append(j['id']);proof.update(status='blocked-imagegen-usage-limit',retryAfter='2026-10-26T18:01:26+07:00')
    save(receipt,proof)
    j['movementSourceStatus']=proof['status']
jobs.update(walkRunSourceSheetsDrawn=len(drawn),walkRunSourceSheetsMissing=len(missing),productionImport='pending-complete-motion-and-native-review')
save(B/'motion-jobs.json',jobs);save(B/'missing-movement.json',missing)
status={'version':18,'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'expectedNewMovementSheets':280,'drawnMovementSheets':len(drawn),'tracedMovementSheets':len(traced),'nativeMovementFrames':len(traced)*8,'missingMovementSheets':len(missing),'missingJobs':missing,'combatCharactersDrawn':30,'productionActivated':False,'unityBuildPerformed':False,'liveDatabaseResetPerformed':False,'blocker':'ImageGen HTTP 429 usage_limit_reached','retryAfter':'2026-10-26T18:01:26+07:00','nextSteps':['Generate missing jobs from saved movement-prompts, keeping exact identity and gait references.','Trace version 2; visually review complete walk/run cards, fix hand changes and scale errors.','Export all 30 models, review and activate manifest; import Unity, build Windows/Android and run roster runtime test.','Publish updater/Drive release and landing news, then final backup and authorized reset of live DB.']}
save(B/'movement-status.json',status)
print(json.dumps({k:v for k,v in status.items() if k not in ('missingJobs','nextSteps')},ensure_ascii=False))
