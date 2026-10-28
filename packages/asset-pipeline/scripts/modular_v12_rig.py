"""Native 80px, rigid articulated reference parts for modular v12.

No generation, palette classification, image fitting, or asset exports happen
here. Landmarks and geometric masks are authored in source-pixel coordinates.
All transforms have unit scale. Callers own action schedules and hair/weapons.

PixelLab label lists from south-rig.json use normalized coordinates on a112px
padded canvas. ``normalize_joints(records, space='normalized112')`` converts
them to native80; ordinary mappings default to native coordinates.
"""
from __future__ import annotations

import math
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw, ImageFilter

NATIVE_SIZE = 80
CANVAS_SIZE = 112
PAD = 16
SIDES = ("r", "l")
Point = tuple[float, float]

# Anatomical right/left, not screen right/left. These are explicit manual
# starting landmarks, to be checked against each returned rotation reference.
DEFAULT_JOINTS = {
    "S": {"neck": (39,27), "nose": (39,20), "r_shoulder": (30,29), "r_elbow": (27,39), "r_wrist": (26,48), "l_shoulder": (48,29), "l_elbow": (50,39), "l_wrist": (51,48), "r_hip": (34,47), "r_knee": (33,60), "r_ankle": (32,72), "l_hip": (44,47), "l_knee": (45,60), "l_ankle": (45,72)},
    "SE": {"neck": (39,27), "nose": (41,20), "r_shoulder": (33,29), "r_elbow": (31,39), "r_wrist": (30,48), "l_shoulder": (46,29), "l_elbow": (48,39), "l_wrist": (49,48), "r_hip": (35,47), "r_knee": (34,60), "r_ankle": (34,72), "l_hip": (43,47), "l_knee": (45,60), "l_ankle": (46,72)},
    "E": {"neck": (40,27), "nose": (44,20), "r_shoulder": (39,29), "r_elbow": (38,39), "r_wrist": (39,48), "l_shoulder": (43,29), "l_elbow": (44,39), "l_wrist": (45,48), "r_hip": (39,47), "r_knee": (38,60), "r_ankle": (38,72), "l_hip": (42,47), "l_knee": (43,60), "l_ankle": (43,72)},
    "NE": {"neck": (40,27), "nose": (43,20), "r_shoulder": (46,29), "r_elbow": (48,39), "r_wrist": (49,48), "l_shoulder": (34,29), "l_elbow": (32,39), "l_wrist": (31,48), "r_hip": (44,47), "r_knee": (45,60), "r_ankle": (45,72), "l_hip": (36,47), "l_knee": (35,60), "l_ankle": (35,72)},
    "N": {"neck": (39,27), "nose": (39,20), "r_shoulder": (48,29), "r_elbow": (50,39), "r_wrist": (51,48), "l_shoulder": (30,29), "l_elbow": (27,39), "l_wrist": (26,48), "r_hip": (44,47), "r_knee": (45,60), "r_ankle": (45,72), "l_hip": (34,47), "l_knee": (33,60), "l_ankle": (32,72)},
    "NW": {"neck": (39,27), "nose": (36,20), "r_shoulder": (46,29), "r_elbow": (48,39), "r_wrist": (49,48), "l_shoulder": (33,29), "l_elbow": (31,39), "l_wrist": (30,48), "r_hip": (43,47), "r_knee": (44,60), "r_ankle": (44,72), "l_hip": (35,47), "l_knee": (34,60), "l_ankle": (34,72)},
    "W": {"neck": (39,27), "nose": (35,20), "r_shoulder": (37,29), "r_elbow": (36,39), "r_wrist": (35,48), "l_shoulder": (41,29), "l_elbow": (42,39), "l_wrist": (41,48), "r_hip": (37,47), "r_knee": (36,60), "r_ankle": (36,72), "l_hip": (40,47), "l_knee": (41,60), "l_ankle": (41,72)},
    "SW": {"neck": (39,27), "nose": (37,20), "r_shoulder": (33,29), "r_elbow": (31,39), "r_wrist": (30,48), "l_shoulder": (46,29), "l_elbow": (48,39), "l_wrist": (49,48), "r_hip": (35,47), "r_knee": (34,60), "r_ankle": (33,72), "l_hip": (43,47), "l_knee": (44,60), "l_ankle": (44,72)},
}
_DIR = {"south":"S", "south-east":"SE", "east":"E", "north-east":"NE", "north":"N", "north-west":"NW", "west":"W", "south-west":"SW"}
_LABEL = {"NOSE":"nose", "NECK":"neck"}
for _side, _word in (("r","RIGHT"),("l","LEFT")):
    for _label, _joint in (("SHOULDER","shoulder"),("ELBOW","elbow"),("ARM","wrist"),("HIP","hip"),("KNEE","knee"),("LEG","ankle"),("EYE","eye"),("EAR","ear")):
        _LABEL[f"{_word} {_label}"] = f"{_side}_{_joint}"


def _add(a: Point, b: Point) -> Point: return a[0]+b[0], a[1]+b[1]
def _sub(a: Point, b: Point) -> Point: return a[0]-b[0], a[1]-b[1]
def _mul(a: Point, k: float) -> Point: return a[0]*k, a[1]*k
def _length(a: Point) -> float: return math.hypot(*a)
def _mid(a: Point, b: Point) -> Point: return (a[0]+b[0])/2, (a[1]+b[1])/2
def _rotate(v: Point, angle: float) -> Point:
    c,s=math.cos(angle), math.sin(angle)
    return c*v[0]-s*v[1], s*v[0]+c*v[1]
def _angle(a: Point, b: Point) -> float: return math.atan2(b[1]-a[1], b[0]-a[0])
def _project(origin: Point, desired: Point, length: float, fallback: Point) -> Point:
    delta=_sub(desired, origin)
    if _length(delta)<1e-8: delta=fallback
    return _add(origin, _mul(delta, length/max(_length(delta),1e-8)))


def normalize_joints(joints: Any, space: str | None = None) -> dict[str, Point]:
    """Parse native dicts, native dict-with-x/y, or normalized112 label lists.

    Explicit spaces: native, padded112, normalized112, normalized80. Underscore
    metadata in mappings is ignored. Label lists default normalized112; mappings
    default native. No coordinate-space guessing based on body bounds occurs.
    """
    if joints is None: return {}
    if isinstance(joints, Mapping) and "reference" in joints:
        return normalize_joints(joints["reference"], space or "normalized112")
    if isinstance(joints, Mapping):
        space=space or joints.get("_space", "native")
        items=[(key,value) for key,value in joints.items() if not key.startswith("_")]
    else:
        space=space or "normalized112"
        items=[(item.get("label",item.get("name")),item) for item in joints]
    result={}
    for name,value in items:
        if name is None: continue
        name=_LABEL.get(str(name).upper(), str(name).lower().replace(" ","_"))
        if isinstance(value,Mapping):
            if "x" not in value or "y" not in value: continue
            xy=float(value["x"]),float(value["y"])
        elif isinstance(value,(list,tuple)) and len(value)>=2:
            xy=float(value[0]),float(value[1])
        else: continue
        if space=="normalized112": xy=xy[0]*112-PAD,xy[1]*112-PAD
        elif space=="padded112": xy=xy[0]-PAD,xy[1]-PAD
        elif space=="normalized80": xy=xy[0]*80,xy[1]*80
        elif space!="native": raise ValueError(f"Unknown joint space: {space}")
        result[name]=xy
    return result


def reference_joints(direction: str="S", overrides: Any=None) -> dict[str,Point]:
    direction=_DIR.get(direction,direction.upper())
    result={key:tuple(map(float,value)) for key,value in DEFAULT_JOINTS[direction].items()}
    result.update(normalize_joints(overrides))
    result["pelvis"]=_mid(result["r_hip"],result["l_hip"])
    for side in SIDES:
        wrist,elbow=result[f"{side}_wrist"],result[f"{side}_elbow"]
        result.setdefault(f"{side}_fingertip",_project(wrist,_add(wrist,_sub(wrist,elbow)),3,(0,1)))
        ankle=result[f"{side}_ankle"]
        toe_dx=(2 if direction in ("E","SE","NE") else -2 if direction in ("W","SW","NW") else -2 if side=="r" else 2)
        result.setdefault(f"{side}_toe",_add(ankle,(toe_dx,2)))
    return result


def _bones() -> dict[str,tuple[str,str,str]]:
    result={"head":("neck","nose","head"), "torso":("pelvis","neck","upper"), "pelvis":("pelvis","neck","pants")}
    for side in SIDES:
        for name,a,b,group in (("upper_arm","shoulder","elbow","upper"),("forearm","elbow","wrist","upper"),("hand","wrist","fingertip","grip"),("thigh","hip","knee","pants"),("shin","knee","ankle","pants"),("boot","knee","ankle","boots"),("foot","ankle","toe","boots"),("coat","hip","knee","upper")):
            result[f"{side}_{name}"]=(f"{side}_{a}",f"{side}_{b}",group)
    return result


BONES=_bones()


def _segment_distance(p: Point,a: Point,b: Point) -> tuple[float,float]:
    d=_sub(b,a); l2=d[0]*d[0]+d[1]*d[1]
    t=((p[0]-a[0])*d[0]+(p[1]-a[1])*d[1])/max(l2,1e-8)
    q=_add(a,_mul(d,min(1,max(0,t))))
    return _length(_sub(p,q)),t


class ReferenceParts(dict):
    """dict[name, image80] plus .joints/.kind/.direction/.groups/.masks."""
    def __init__(self,images,joints,direction,kind,masks,metadata):
        super().__init__(images)
        self.joints=joints; self.direction=direction; self.kind=kind
        self.masks=masks; self.metadata=metadata
        self.groups={key:BONES[key][2] for key in images}


def split_reference(im: Image.Image, joints: Any=None, direction: str="S", kind: str="base") -> ReferenceParts:
    """Split using authored landmarks/geometry; never inspect pixel RGB.

    Optional joints metadata: _masks={part: polygon or list of polygons},
    _neck_y, _waist_y, _pelvis_bottom, _boot_fraction (knee-to-ankle),
    _coat_panels=True, _foreground='r'/'l'. Polygon masks have last priority.
    Landmarks define ownership; a1px source seam is shared only at joints.
    kind base retains anatomy/head; outfit/navy/silver/upper/pants/boots strips
    the head and hands. Per-source differences are reported by render_parts.
    """
    if im.size!=(80,80): raise ValueError(f"Expected native80x80 reference, got {im.size}; pad, do not resize")
    im=im.convert("RGBA")
    direction=_DIR.get(direction,direction.upper())
    j=reference_joints(direction,joints)
    meta=dict(joints) if isinstance(joints,Mapping) else {}
    neck_y=float(meta.get("_neck_y",j["neck"][1]))
    waist_y=float(meta.get("_waist_y",j["pelvis"][1]))
    pelvic_bottom=float(meta.get("_pelvis_bottom",waist_y+5))
    boot_fraction=float(meta.get("_boot_fraction",.18))
    masks={name:Image.new("L",(80,80)) for name in BONES}
    pixels={name:mask.load() for name,mask in masks.items()}
    alpha=im.getchannel("A").load()
    coat=bool(meta.get("_coat_panels",kind=="navy"))
    shoulder_l=min(j["r_shoulder"][0],j["l_shoulder"][0]); shoulder_r=max(j["r_shoulder"][0],j["l_shoulder"][0])
    hip_l=min(j["r_hip"][0],j["l_hip"][0]); hip_r=max(j["r_hip"][0],j["l_hip"][0])
    for y in range(80):
        for x in range(80):
            if not alpha[x,y]: continue
            p=(float(x),float(y))
            if y<=neck_y: owner="head"
            else:
                arm=[]
                for side in SIDES:
                    for segment in ("upper_arm","forearm","hand"):
                        name=f"{side}_{segment}"; a,b,_=BONES[name]
                        distance,t=_segment_distance(p,j[a],j[b])
                        arm.append((distance,name,t))
                ad,an,at=min(arm,key=lambda item:item[0])
                # Authored torso quadrilateral; sleeves live outside this core.
                blend=min(1,max(0,(y-neck_y)/max(waist_y-neck_y,1)))
                core_l=shoulder_l+2+(hip_l-shoulder_l-1)*blend
                core_r=shoulder_r-2+(hip_r-shoulder_r+1)*blend
                if y<=waist_y+1 and core_l<=x<=core_r: owner="torso"
                elif ad<=4 and (y<waist_y+1 or x<hip_l-2 or x>hip_r+2): owner=an
                elif y<=pelvic_bottom and hip_l-4<=x<=hip_r+4: owner="pelvis"
                else:
                    legs=[]
                    for side in SIDES:
                        for segment in ("thigh","shin","foot"):
                            name=f"{side}_{segment}"; a,b,_=BONES[name]
                            distance,t=_segment_distance(p,j[a],j[b]); legs.append((distance,name,t))
                    _,owner,t=min(legs,key=lambda item:item[0])
                    if owner.endswith("shin") and t>=boot_fraction: owner=owner.replace("shin","boot")
                    # Native long coat side panels: geometric hip rails, attached
                    # to the thigh, not painted over the complete pants sprite.
                    if coat and waist_y-1<=y<=waist_y+14 and (x<hip_l-1 or x>hip_r+1):
                        side=min(SIDES,key=lambda s:abs(x-j[f"{s}_hip"][0])); owner=f"{side}_coat"
            pixels[owner][x,y]=255
    # Explicit hand-authored polygons override default geometry if supplied.
    for name,polygon in meta.get("_masks",{}).items():
        if name not in masks: raise ValueError(f"Unknown manual mask part: {name}")
        custom=Image.new("L",(80,80)); draw=ImageDraw.Draw(custom)
        polygons=[polygon] if polygon and isinstance(polygon[0][0],(int,float)) else polygon
        for poly in polygons: draw.polygon([tuple(point) for point in poly],fill=255)
        custom=ImageChops.multiply(custom,im.getchannel("A"))
        for other in masks:
            if other!=name: masks[other]=ImageChops.subtract(masks[other],custom)
        masks[name]=ImageChops.lighter(masks[name],custom)
    # One source-pixel seam only around shared joints. Original source pixels
    # are copied, never extrapolated with a flat color or blurred.
    seam_masks={name:mask.copy() for name,mask in masks.items()}
    for name,(a,b,_) in BONES.items():
        for other,(oa,ob,_) in BONES.items():
            if name>=other: continue
            shared=set((a,b))&set((oa,ob))
            if not shared or "head" in (name,other): continue
            disk=Image.new("L",(80,80)); draw=ImageDraw.Draw(disk)
            for joint in shared:
                q=j[joint]; draw.ellipse((q[0]-5,q[1]-5,q[0]+5,q[1]+5),fill=255)
            near=ImageChops.multiply(disk,masks[other])
            seam_masks[name]=ImageChops.lighter(seam_masks[name],ImageChops.multiply(masks[name].filter(ImageFilter.MaxFilter(3)),near))
            near=ImageChops.multiply(disk,masks[name])
            seam_masks[other]=ImageChops.lighter(seam_masks[other],ImageChops.multiply(masks[other].filter(ImageFilter.MaxFilter(3)),near))
    images={}
    is_base=kind=="base"
    for name,mask in seam_masks.items():
        group=BONES[name][2]
        if not is_base and group in ("head","grip"): mask=Image.new("L",(80,80))
        if kind in ("upper","pants","boots") and group!=kind: mask=Image.new("L",(80,80))
        part=im.copy(); part.putalpha(ImageChops.multiply(im.getchannel("A"),mask))
        images[name]=part
    return ReferenceParts(images,j,direction,kind,seam_masks,{key:value for key,value in meta.items() if key.startswith("_")})


def resolve_pose(ref: Any, pose: Any=None, direction: str="S") -> dict[str,Point]:
    """Return padded112 joints with exact reference lengths; no bone stretching.

    Pose mappings are padded112 by default. Set _space='native' explicitly for
    native poses. Label lists are normalized112. Shoulder/hip attachment is one
    rigid torso; limb targets provide direction only, preserving every length.
    Hands/feet follow their parent bone unless their endpoint names are listed
    explicitly in pose['_end_targets']; this prevents stale neutral endpoints
    from turning a raised hand back toward its old location.
    """
    r=reference_joints(direction,ref)
    if pose is None: return {key:_add(value,(PAD,PAD)) for key,value in r.items()}
    if isinstance(pose,Mapping):
        p=normalize_joints(pose,pose.get("_space","padded112"))
    else: p=normalize_joints(pose,"normalized112")
    pivot=p.get("pelvis",_mid(p.get("r_hip",r["r_hip"]),p.get("l_hip",r["l_hip"])))
    desired_neck=p.get("neck",_add(r["neck"],_sub(pivot,r["pelvis"])))
    angle=_angle(pivot,desired_neck)-_angle(r["pelvis"],r["neck"])
    q={key:_add(pivot,_rotate(_sub(value,r["pelvis"]),angle)) for key,value in r.items()}
    end_targets=set(pose.get("_end_targets",())) if isinstance(pose,Mapping) else set()
    for side in SIDES:
        for a,b in (("shoulder","elbow"),("elbow","wrist"),("wrist","fingertip"),("hip","knee"),("knee","ankle"),("ankle","toe")):
            ak,bk=f"{side}_{a}",f"{side}_{b}"
            if b in ("fingertip","toe") and (bk not in p or bk not in end_targets):
                parent_a,parent_b=(f"{side}_elbow",f"{side}_wrist") if b=="fingertip" else (f"{side}_knee",f"{side}_ankle")
                delta=_angle(q[parent_a],q[parent_b])-_angle(r[parent_a],r[parent_b])
                desired=_add(q[ak],_rotate(_sub(r[bk],r[ak]),delta))
            else: desired=p.get(bk,q[bk])
            q[bk]=_project(q[ak],desired,_length(_sub(r[bk],r[ak])),_sub(r[bk],r[ak]))
    q["nose"]=_project(q["neck"],p.get("nose",q["nose"]),_length(_sub(r["nose"],r["neck"])),_sub(r["nose"],r["neck"]))
    return {key:_add(value,(PAD,PAD)) for key,value in q.items()}


def _transform(image: Image.Image, a: Point,b: Point, qa: Point,qb: Point) -> Image.Image:
    delta=_angle(qa,qb)-_angle(a,b); c,s=math.cos(delta),math.sin(delta)
    # Shared rounded joint anchor for adjacent parts; the rotation is unitary.
    tx,ty=round(qa[0]),round(qa[1])
    matrix=(c,s,a[0]-c*tx-s*ty,-s,c,a[1]+s*tx-c*ty)
    return image.transform((CANVAS_SIZE,CANVAS_SIZE),Image.Transform.AFFINE,matrix,resample=Image.Resampling.NEAREST)


def render_parts(parts: ReferenceParts, refjoints: Any=None, posejoints: Any=None) -> dict[str,Any]:
    """Render detailed layers with common canonical rig and fixed native scale.

    refjoints is the CANONICAL body rig; parts.joints remains source-local.
    Per-source length discrepancies >.75px are returned in bone_mismatches,
    never repaired by scaling. Local source bone rotations follow the canonical
    pose and attach at the same target pivot as the body. For exact identity
    use refjoints=None. All RGBA layers have112x112 dimensions.
    """
    canonical=reference_joints(parts.direction,refjoints if refjoints is not None else parts.joints)
    q=resolve_pose(canonical,posejoints,parts.direction)
    layers={}; mismatches=[]
    for name,image in parts.items():
        a,b,_=BONES[name]
        source_len=_length(_sub(parts.joints[b],parts.joints[a])); body_len=_length(_sub(canonical[b],canonical[a]))
        if abs(source_len-body_len)>.75 and name not in ("head","pelvis"):
            mismatches.append({"part":name,"source":source_len,"canonical":body_len,"delta":source_len-body_len})
        layers[name]=_transform(image,parts.joints[a],parts.joints[b],q[a],q[b])
    foreground=parts.metadata.get("_foreground", "r" if parts.direction in ("S","SE","E","NE") else "l")
    rear="l" if foreground=="r" else "r"
    order=[f"{rear}_upper_arm",f"{rear}_forearm",f"{rear}_hand",f"{rear}_thigh",f"{rear}_shin",f"{rear}_boot",f"{rear}_foot",f"{rear}_coat",f"{foreground}_thigh",f"{foreground}_shin",f"{foreground}_boot",f"{foreground}_foot", "pelvis", "torso", f"{foreground}_coat", "head",f"{foreground}_upper_arm",f"{foreground}_forearm",f"{foreground}_hand"]
    def merge(names):
        result=Image.new("RGBA",(112,112))
        for name in order:
            if name in names: result.alpha_composite(layers[name])
        return result
    result={"composite":merge(layers),"layers":layers,"joints":q,"zorder":order,"bone_mismatches":mismatches,"direction":parts.direction,"kind":parts.kind,"scale":1.0}
    result["head"]=layers["head"]
    result["base_headless"]=merge([name for name in layers if name!="head"]) if parts.kind=="base" else Image.new("RGBA",(112,112))
    for group in ("upper","pants","boots","grip"):
        result[group]=merge([name for name in layers if BONES[name][2]==group])
    result["arm_foreground"]=merge([f"{foreground}_{segment}" for segment in ("upper_arm","forearm","hand")])
    result["hands"]={side:layers[f"{side}_hand"] for side in SIDES}
    # Fingers: last native2px of the palm patch, useful above weapon hilt. This
    # remains a geometry mask; caller may override hand polygons for a new grip.
    finger_layers={}
    for side in SIDES:
        name=f"{side}_hand"; image=parts[name].copy(); mask=Image.new("L",(80,80)); m=mask.load()
        wrist,tip=parts.joints[f"{side}_wrist"],parts.joints[f"{side}_fingertip"]
        for y in range(80):
            for x in range(80):
                _,t=_segment_distance((x,y),wrist,tip)
                if t>=.4: m[x,y]=255
        image.putalpha(ImageChops.multiply(image.getchannel("A"),mask))
        finger_layers[side]=_transform(image,wrist,tip,q[f"{side}_wrist"],q[f"{side}_fingertip"])
    result["fingers"]=Image.alpha_composite(finger_layers[rear],finger_layers[foreground])
    result["finger_layers"]=finger_layers
    return result


def length_report(refjoints: Any, posejoints: Any, direction: str="S") -> dict[str,float]:
    """Numerical fixed-length audit; values are target minus reference length."""
    r=reference_joints(direction,refjoints); q=resolve_pose(r,posejoints,direction)
    return {name:_length(_sub(q[b],q[a]))-_length(_sub(r[b],r[a])) for name,(a,b,_) in BONES.items()}


def compose_parts(base: dict[str,Any], garments: Any=(), groups=("upper","pants","boots")) -> Image.Image:
    """Replace covered body parts in the actual zorder, preserving bare hands.

    garments is one render_parts result or a list of results. Replacement, rather
    than overlay of the complete naked body, avoids feet/skin protruding beyond
    the equipped silhouette. For individual equipment slots pass the desired
    groups, e.g. ('boots',). All inputs must share the same canonical pose.
    """
    if isinstance(garments,Mapping): garments=[garments]
    result=Image.new("RGBA",(112,112))
    for name in base["zorder"]:
        layer=base["layers"][name]
        group=BONES[name][2]
        if group in groups:
            for garment in garments:
                candidate=garment["layers"][name]
                if candidate.getchannel("A").getbbox(): layer=candidate
        result.alpha_composite(layer)
    return result
