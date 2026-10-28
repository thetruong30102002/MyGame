"""Fixed-length native pixel poses, shared by skin and every wearable.

No pose is fitted to its bounds. Feet, hips, elbows and wrists have actual
tracks. Two-bone IK brings both hands onto the same rigid sword handle.
"""
import math

DIRS=['S','SW','W','NW','N','NE','E','SE']
ANGLES={'S':math.pi/2,'SE':math.pi/4,'E':0,'NE':-math.pi/4,'N':-math.pi/2,'NW':-3*math.pi/4,'W':math.pi,'SW':3*math.pi/4}

def lerp(a,b,t):return tuple(x+(y-x)*t for x,y in zip(a,b))
def length(a,b):return math.dist(a,b)
def add(a,b):return (a[0]+b[0],a[1]+b[1])
def sub(a,b):return (a[0]-b[0],a[1]-b[1])

def ik(root,end,a,b,bend=1):
    dx,dy=sub(end,root);r=math.hypot(dx,dy)
    if r<.01:dx,dy,r=0,1,1
    d=max(abs(a-b)+.02,min(a+b-.02,r));ux,uy=dx/r,dy/r
    end=(root[0]+ux*d,root[1]+uy*d)
    c=(a*a+d*d-b*b)/(2*d);h=math.sqrt(max(0,a*a-c*c))*bend
    return (root[0]+ux*c-uy*h,root[1]+uy*c+ux*h),end


def _circle_intersections(c0,r0,c1,r1):
    """All intersection points of two circle boundaries, without fitting."""
    dx,dy=sub(c1,c0);d=math.hypot(dx,dy)
    if d<1e-9 or d>r0+r1+1e-8 or d<abs(r0-r1)-1e-8:return []
    along=(r0*r0-r1*r1+d*d)/(2*d)
    h=math.sqrt(max(0,r0*r0-along*along));ux,uy=dx/d,dy/d
    mid=(c0[0]+ux*along,c0[1]+uy*along)
    return [(mid[0]-uy*h,mid[1]+ux*h),(mid[0]+uy*h,mid[1]-ux*h)]


def shared_grip(desired,near_shoulder,far_shoulder,near_lengths,far_lengths,axis,span=4):
    """Nearest feasible rigid handle grip for BOTH two-bone arm chains.

    The far wrist is grip-axis*span, so its reach annulus is shifted by
    axis*span in grip space. Project once into the intersection, rather than
    clamping two wrists independently and changing the handle's hand span.
    Boundary projections and circle intersections contain the closest point
    of the two closed annuli. The small margin matches ``ik`` exactly.
    """
    centers=[near_shoulder,add(far_shoulder,(axis[0]*span,axis[1]*span))]
    radii=[(abs(a-b)+.02,a+b-.02) for a,b in [near_lengths,far_lengths]]
    def valid(p):
        return all(lo-1e-8<=length(p,c)<=hi+1e-8 for c,(lo,hi) in zip(centers,radii))
    if valid(desired):return desired
    candidates=[]
    for center,bounds in zip(centers,radii):
        dx,dy=sub(desired,center);distance=math.hypot(dx,dy)
        ux,uy=(dx/distance,dy/distance) if distance>1e-9 else (1,0)
        for radius in bounds:
            point=add(center,(ux*radius,uy*radius))
            if valid(point):candidates.append(point)
    for r0 in radii[0]:
        for r1 in radii[1]:
            candidates.extend(p for p in _circle_intersections(centers[0],r0,centers[1],r1) if valid(p))
    if not candidates:
        raise ValueError('No common two-hand grip: authored shoulders/arm lengths cannot reach a rigid handle')
    return min(candidates,key=lambda p:length(p,desired))


def _ik_near(root,end,a,b,previous):
    """Keep the elbow/knee branch nearest its previous actual joint."""
    candidates=[ik(root,end,a,b,bend) for bend in [-1,1]]
    return min(candidates,key=lambda pair:length(pair[0],previous))


def _smooth(t):return t*t*(3-2*t)


def _attack_pose(ref,d,phase,near,v):
    """Solve entry and release from actual preceding poses, never a fake grip.

    Phase0 is the exact one-hand resting pose. Phases1..13 hold one rigid
    two-handed handle; phases14..17 release into the exact reference rest.
    Replay the short deterministic track so random-access frame export has
    the same elbow branch and actual recovery source as sequential playback.
    """
    if not 0<=phase<18:raise ValueError('attack phase must be in 0..17')
    front=1 if v[0]>=0 else -1;far='LEFT' if near=='RIGHT' else 'RIGHT'
    idle_angle=-90+45*front;raised_angle=-90-5*front
    # Left-facing must take the mirrored arc (-85 -> -245), not a 200deg
    # clockwise sweep through the back of the character.
    impact_angle=-90+155*front
    lengths={side:(length(ref[side+' SHOULDER'],ref[side+' ELBOW']),length(ref[side+' ELBOW'],ref[side+' ARM'])) for side in ['RIGHT','LEFT']}
    pelvis=lerp(ref['RIGHT HIP'],ref['LEFT HIP'],.5)
    spine=length(pelvis,ref['NECK'])
    upper=[k for k in ['NOSE','NECK','RIGHT EYE','LEFT EYE','RIGHT EAR','LEFT EAR','RIGHT SHOULDER','LEFT SHOULDER'] if k in ref]
    def torso(theta):
        result={k:tuple(value) for k,value in ref.items()};co,si=math.cos(theta),math.sin(theta)
        for k in upper:
            x,y=sub(ref[k],pelvis);result[k]=add(pelvis,(co*x-si*y,si*x+co*y))
        return result
    previous={k:tuple(value) for k,value in ref.items()}
    if phase==0:return previous,idle_angle,False
    track=[(3,18),(2,12),(1,5),(0,-4),(0,-12),(0,-17),(0,-18),(1,-10),(3,5),(5,18),(5,23),(4,23),(3,21),(2,18)]
    for step in range(1,min(phase,13)+1):
        lean=0 if step<7 else min(2,(step-6)*.6) if step<11 else max(0,2-(step-10)*.4)
        theta=math.atan2(v[0]*lean,max(spine,.01));p=torso(theta)
        if step<3:angle=lerp((idle_angle,),(raised_angle,),step/3)[0]
        elif step<7:angle=raised_angle
        else:angle=lerp((raised_angle,),(impact_angle,),min(1,(step-6)/3))[0]
        axis=(math.cos(math.radians(angle)),math.sin(math.radians(angle)))
        tx,ty=track[step];neck=p['NECK']
        wanted=(neck[0]+front*tx*(.25 if d in ['S','N'] else 1),neck[1]+ty)
        grip=shared_grip(wanted,p[near+' SHOULDER'],p[far+' SHOULDER'],lengths[near],lengths[far],axis)
        far_grip=sub(grip,(axis[0]*4,axis[1]*4))
        for side,end in [(near,grip),(far,far_grip)]:
            a,b,c=[side+' '+s for s in ['SHOULDER','ELBOW','ARM']]
            p[b],p[c]=_ik_near(p[a],end,*lengths[side],previous[b])
        for side,sign in [('RIGHT',-1),('LEFT',1)]:
            a,b,c=[side+' '+s for s in ['HIP','KNEE','LEG']]
            target=add(ref[c],(v[0]*sign*min(2,lean),0))
            p[b],p[c]=_ik_near(p[a],target,length(ref[a],ref[b]),length(ref[b],ref[c]),previous[b])
        previous=p
    if phase<=13:return previous,angle,True
    joined=previous;joined_theta=theta
    for step in range(14,phase+1):
        t=_smooth((step-13)/4);p=torso(joined_theta*(1-t))
        for side in ['RIGHT','LEFT']:
            for upper_joint,middle,end_joint in [('SHOULDER','ELBOW','ARM'),('HIP','KNEE','LEG')]:
                a,b,c=[side+' '+s for s in [upper_joint,middle,end_joint]]
                target=lerp(joined[c],ref[c],t)
                p[b],p[c]=_ik_near(p[a],target,length(ref[a],ref[b]),length(ref[b],ref[c]),previous[b])
        previous=p
    # Exact source rest at both ends. Releasing hands can cease to be collinear;
    # sword grip always remains the actual near wrist during this transition.
    if phase==17:previous={k:tuple(value) for k,value in ref.items()}
    return previous,lerp((impact_angle,),(idle_angle,),_smooth((phase-13)/4))[0],False

def joint_pose(ref,d,action,phase):
    """ref is native80 COCO-name dict. All output values stay native pixels."""
    p={k:tuple(v) for k,v in ref.items()};v=(math.cos(ANGLES[d]),math.sin(ANGLES[d]))
    near='RIGHT' if d in ['E','SE','NE','S','N'] else 'LEFT'
    grip=None;angle=-45 if v[0]>=0 else -135;trail=False;two_hand=False
    if action in ['walk','run']:
        t=2*math.pi*phase/8;wave=math.sin(t);bob=-1 if phase in [1,2,5,6] else 0
        # Small, soft planted steps. Front/back leg depth is a 3px track;
        # side travel uses 5px. The sole itself is never enlarged.
        for k in p:
            if not any(k.endswith(x) for x in ['KNEE','LEG']):p[k]=add(p[k],(0,bob))
        for side,sign in [('RIGHT',1),('LEFT',-1)]:
            a,b,c=[side+' '+s for s in ['HIP','KNEE','LEG']]
            swing=wave*sign
            target=add(ref[c],(v[0]*5*swing,v[1]*3*swing-max(0,-swing)*2))
            elbow,end=ik(p[a],target,length(ref[a],ref[b]),length(ref[b],ref[c]),-1 if v[0]>=0 else 1)
            p[b],p[c]=elbow,end
            a,b,c=[side+' '+s for s in ['SHOULDER','ELBOW','ARM']]
            # Weapon-side wrist is deliberately quiet so the handle remains
            # readable. The far arm counter-swings at the same walk tempo.
            amp=1.0 if side==near else 2.0
            target=add(ref[c],(-v[0]*amp*swing,-v[1]*amp*.5*swing+bob))
            elbow,end=ik(p[a],target,length(ref[a],ref[b]),length(ref[b],ref[c]),1 if side=='RIGHT' else -1)
            p[b],p[c]=elbow,end
    elif action=='attack':
        p,angle,two_hand=_attack_pose(ref,d,phase,near,v)
        trail=phase in [8,9]
    elif action=='cast':
        t=math.sin(math.pi*phase/9);neck=ref['NECK']
        for side in ['RIGHT','LEFT']:
            a,b,c=[side+' '+s for s in ['SHOULDER','ELBOW','ARM']]
            target=add(ref[c],(v[0]*t*(8 if side==near else 3),-t*(10 if side==near else 6)))
            p[b],p[c]=ik(p[a],target,length(ref[a],ref[b]),length(ref[b],ref[c]),1 if side=='RIGHT' else -1)
    if grip is None or action=='attack':grip=p[near+' ARM']
    return {'joints':p,'grip':grip,'swordAngle':angle,'trailActive':trail,'nearSide':near,'twoHandGrip':two_hand}

SCHEDULES=[('idle',6,-1,4),('walk',9,-1,8),('run',9,-1,8),('attack',20,9,18),('cast',12,5,10)]
