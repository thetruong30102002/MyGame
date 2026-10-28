#!/usr/bin/env python3
"""Independent anatomical QA for a modular character export (Pillow only).

This deliberately does NOT fit, normalize, or accept a pose from its whole alpha
bounding box: raised arms change that box without changing a person's anatomy.
Bare lower legs use authored waist landmarks; boot layers are measured separately.
Connected/occluded legs are reported as unmeasurable, never as a passing sample.

The baked PixelLab reference has no semantic boot mask. Its manually inspected
S-view split landmarks below identify separated lower legs, not a guessed garment
boundary. A fixed 10-native-pixel sole band can then be compared with exported
boots without assuming identical boot shaft designs. Measurements are converted
to pixels at 48 PPU before comparison. PCA extents are diagnostics for legs,
because bending changes their extents. Local girth uses an inscribed-distance
measurement, and rigid boot length is checked separately against idle.

Run from any directory. Exit 0=PASS, 1=FAIL, 2=INCONCLUSIVE/error.
  python modular-v12-proportions.test.py --report D:/temp/proportions.json
  python modular-v12-proportions.test.py --catalog path/to/v12/catalog.json
"""

import argparse
from functools import lru_cache
import json
import math
from pathlib import Path
import re
import sys

from PIL import Image


REPO = Path(__file__).resolve().parents[3]
NATIVE_PPU = 48.0
NATIVE_LANDMARKS = {
    "male": {"id": "player_hero_adult", "separated_legs_y": 74},
    "female": {"id": "player_hero_adult_f", "separated_legs_y": 79},
}
LIMITS = {
    "leg_area_vs_idle": 1.50,
    "leg_girth_vs_idle": 1.35,
    "boot_area_vs_idle": 1.50,
    "boot_girth_vs_idle": 1.35,
    "boot_length_vs_idle": 1.25,
    "foot_area_vs_native": 1.65,
    "foot_girth_vs_native": 1.40,
    "dimension_tolerance_native_px": 1.0,
    "native_sole_band_px": 10,
    "idle_height_vs_native": [0.90, 1.10],
    "joint_bone_length_relative_tolerance": 0.03,
    "joint_bone_length_absolute_tolerance_native_px": 0.35,
}


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def alpha_points(image):
    return {(x, y) for y in range(image.height) for x in range(image.width)
            if image.getpixel((x, y))[3]}


def components(points, minimum=1):
    remaining = set(points)
    result = []
    while remaining:
        start = remaining.pop()
        found, stack = {start}, [start]
        while stack:
            x, y = stack.pop()
            for dx, dy in ((-1, -1), (0, -1), (1, -1), (-1, 0),
                           (1, 0), (-1, 1), (0, 1), (1, 1)):
                neighbor = (x + dx, y + dy)
                if neighbor in remaining:
                    remaining.remove(neighbor)
                    found.add(neighbor)
                    stack.append(neighbor)
        if len(found) >= minimum:
            result.append(found)
    return sorted(result, key=len, reverse=True)


def bounds(points):
    xs, ys = zip(*points)
    return min(xs), min(ys), max(xs) + 1, max(ys) + 1


def local_girth(points):
    """Largest inscribed width; two-pass Euclidean chamfer, no bbox fitting.

    The 1/sqrt(2) grid approximation has a small directional error. A generous
    multiplicative guard plus one native pixel covers ordinary pixel rotation.
    """
    x0, y0, x1, y1 = bounds(points)
    width, height = x1 - x0 + 2, y1 - y0 + 2
    distances = [[0.0] * width for _ in range(height)]
    for x, y in points:
        distances[y - y0 + 1][x - x0 + 1] = float("inf")
    diagonal = math.sqrt(2)
    for ys, xs, neighbors in (
        (range(1, height - 1), range(1, width - 1),
         ((-1, 0, 1), (0, -1, 1), (-1, -1, diagonal), (1, -1, diagonal))),
        (range(height - 2, 0, -1), range(width - 2, 0, -1),
         ((1, 0, 1), (0, 1, 1), (1, 1, diagonal), (-1, 1, diagonal))),
    ):
        for y in ys:
            for x in xs:
                if distances[y][x]:
                    distances[y][x] = min(
                        distances[y][x],
                        *(distances[y + dy][x + dx] + cost
                          for dx, dy, cost in neighbors))
    return max(0.0, 2 * max(map(max, distances)) - 1)


def measure(points, factor=1.0):
    x0, y0, x1, y1 = bounds(points)
    count = len(points)
    cx = sum(x for x, _ in points) / count
    cy = sum(y for _, y in points) / count
    xx = sum((x - cx) ** 2 for x, _ in points) / count
    yy = sum((y - cy) ** 2 for _, y in points) / count
    xy = sum((x - cx) * (y - cy) for x, y in points) / count
    angle = math.atan2(2 * xy, xx - yy) / 2
    c, s = math.cos(angle), math.sin(angle)
    major = [(x - cx) * c + (y - cy) * s for x, y in points]
    minor = [-(x - cx) * s + (y - cy) * c for x, y in points]
    values = {
        "area": count * factor ** 2,
        "width": (x1 - x0) * factor,
        "height": (y1 - y0) * factor,
        "pca_major": (max(major) - min(major) + 1) * factor,
        "pca_minor_diagnostic_only": (max(minor) - min(minor) + 1) * factor,
        "local_girth": local_girth(points) * factor,
    }
    return {"bbox_export_px": [x0, y0, x1, y1],
            **{key: round(value, 3) for key, value in values.items()}}


def two_feet(points, factor):
    """Reject merged legs and short floating fragments rather than inventing two."""
    groups = components(points, max(4, round(10 / factor ** 2)))
    if not groups:
        return None, "no opaque lower-leg components", groups
    floor = max(y for _, y in points)
    near_floor = [part for part in groups
                  if max(y for _, y in part) >= floor - 12 / factor]
    if len(near_floor) < 2:
        return None, "legs/boots overlap or only one reaches the sole region", groups
    pair = sorted(near_floor, key=len, reverse=True)[:2]
    if min(map(len, pair)) < max(map(len, pair)) * 0.25:
        return None, "second component too small to identify a second leg", groups
    return pair, None, groups


def foot_band(points, factor):
    last = max(y for _, y in points)
    return {(x, y) for x, y in points
            if y > last - LIMITS["native_sole_band_px"] / factor}


def appearance_metrics(image, factor=1.0):
    points = alpha_points(image)
    if not points:
        raise ValueError("empty character appearance")
    x0, y0, x1, y1 = bounds(points)
    edge = [p for p in points if any((p[0] + dx, p[1] + dy) not in points
                                   for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)))]
    return {
        "bbox_export_px": [x0, y0, x1, y1],
        "width": round((x1 - x0) * factor, 3),
        "height": round((y1 - y0) * factor, 3),
        "rgb_colors": len({image.getpixel(p)[:3] for p in points}),
        "dark_outline_fraction": round(sum(max(image.getpixel(p)[:3]) < 90
                                           for p in edge) / len(edge), 4),
    }


class Atlas:
    def __init__(self, catalog_path, texture, size):
        self.directory, self.texture, self.size = catalog_path.parent, texture, tuple(size)
        self.cells = {record["name"]: record["cell"] for record in
                      read_json(self.directory / (texture + "-slices.json"))}

    @lru_cache(maxsize=2)
    def page(self, index):
        with Image.open(self.directory / f"{self.texture}-{index}.png") as source:
            return source.convert("RGBA")

    @lru_cache(maxsize=128)
    def sprite(self, name):
        cell = self.cells[name]
        image = self.page(cell // 256)
        w, h = self.size
        x, y = cell % 16 * w, cell % 256 // 16 * h
        return image.crop((x, y, x + w, y + h))


def native_reference(sex):
    landmark = NATIVE_LANDMARKS[sex]
    name = landmark["id"]
    path = REPO / "assets" / "characters" / name / (name + ".json")
    record = read_json(path)["frames"][name + "/idle_S_0"]["frame"]
    with Image.open(path.with_suffix(".png")) as source:
        image = source.convert("RGBA").crop((record["x"], record["y"],
                                                record["x"] + record["w"],
                                                record["y"] + record["h"]))
    lower = {(x, y) for x, y in alpha_points(image)
             if y >= landmark["separated_legs_y"]}
    pair, reason, _ = two_feet(lower, 1.0)
    if pair is None:
        raise ValueError(f"Native reference landmark needs review: {name}: {reason}")
    return {
        "path": str(path), "frame": name + "/idle_S_0",
        "landmarks": landmark,
        "appearance": appearance_metrics(image),
        "separated_lower_legs": [measure(p) for p in pair],
        "sole_bands": [measure(foot_band(p, 1.0)) for p in pair],
    }


def source_waist(catalog_path, frame, body_image, body_dir):
    source = frame.get("source", "")
    parsed = re.fullmatch(r"(male|female)_(idle|walk|attack|cast)_(\d+)_([A-Z]+)",
                          Path(source).name)
    if not parsed:
        raise ValueError("missing recognized authored source and waist landmark")
    sex, action, phase, direction = parsed.groups()
    directory = body_dir or catalog_path.parent / "source-art" / Path(source).parent
    metadata = read_json(directory / f"{sex}-{action}.json")
    records = metadata["records"] if isinstance(metadata, dict) else metadata
    record = next((r for r in records if int(r["phase"]) == int(phase)
                   and r["direction"] == direction), None)
    if record is None or "waist" not in record:
        raise ValueError("authored source has no waist landmark for this pose")
    with Image.open(directory / (Path(source).name + ".png")) as authored:
        source_image = authored.convert("RGBA")
        source_box = source_image.getbbox()
    body_box = body_image.getbbox()
    if not source_box or not body_box:
        raise ValueError("empty body/source prevents waist registration")
    # The head may be removed from the base layer, so do NOT compare whole
    # source/export boxes to validate registration. Verify actual sole pixels
    # under a translation; scaling the source would fail this check.
    dy = body_box[3] - source_box[3]
    dx = (body_image.width - source_image.width) // 2
    depth = min(8, source_box[3] - source_box[1])
    source_sole = {(x + dx, y + dy) for x, y in alpha_points(source_image)
                   if y >= source_box[3] - depth}
    export_sole = {(x, y) for x, y in alpha_points(body_image)
                   if y >= body_box[3] - depth}
    overlap = len(source_sole & export_sole) / max(1, len(source_sole | export_sole))
    if overlap < 0.90:
        raise ValueError("source/export sole pixels differ: waist requires explicit registration")
    return record["waist"] + dy


def atlas_joints(frame):
    """Read declared atlas coordinates; no source-canvas/bbox coordinate guessing."""
    joints = {}
    names = {"neck": "neck", "nose": "nose", "pelvis": "pelvis"}
    for side, word in (("r", "right"), ("l", "left")):
        for name in ("shoulder", "elbow", "wrist", "hip", "knee", "ankle", "toe", "fingertip"):
            names[f"{side}_{name}"] = f"{side}_{name}"
            names[f"{word}_{name}"] = f"{side}_{name}"
        names[f"{word}_arm"] = f"{side}_wrist"
        names[f"{word}_leg"] = f"{side}_ankle"
    for key, value in frame.get("joints", {}).items():
        canonical = names.get(key.lower().replace(" ", "_"))
        if canonical is None:
            continue
        if isinstance(value, dict):
            value = (value["x"], value["y"])
        if not isinstance(value, (list, tuple)) or len(value) < 2:
            raise ValueError("invalid joint coordinate: " + key)
        point = float(value[0]), float(value[1])
        if not all(math.isfinite(v) for v in point):
            raise ValueError("non-finite joint coordinate: " + key)
        joints[canonical] = point
    return joints


def segment_distance(point, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0.0, min(1.0, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy)
                         / max(dx * dx + dy * dy, 1e-8)))
    return math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy)


def joint_bone_lengths(joints, factor):
    """Compute physical lengths independently of exporter anatomyMetrics claims."""
    required = [f"{side}_{name}" for side in ("r", "l")
                for name in ("hip", "knee", "ankle", "shoulder", "elbow", "wrist")]
    if any(key not in joints for key in required):
        raise ValueError("native pose lacks required hip/knee/ankle/shoulder/elbow/wrist joints")
    result = {}
    for side in ("r", "l"):
        for bone, a, b in (("thigh", "hip", "knee"), ("shin", "knee", "ankle"),
                           ("upper_arm", "shoulder", "elbow"), ("forearm", "elbow", "wrist"),
                           ("foot", "ankle", "toe"), ("hand", "wrist", "fingertip")):
            if f"{side}_{a}" in joints and f"{side}_{b}" in joints:
                result[f"{side}_{bone}"] = round(math.dist(joints[f"{side}_{a}"],
                                                          joints[f"{side}_{b}"]) * factor, 5)
    if "neck" in joints:
        pelvis = joints.get("pelvis", tuple((a + b) / 2 for a, b in
                                             zip(joints["r_hip"], joints["l_hip"])))
        result["torso"] = round(math.dist(pelvis, joints["neck"]) * factor, 5)
    return result


def native_leg_pixels(body, joints, factor):
    """Measure real alpha below the pelvis, without skin-color classification.

    Native references include semantic rigid pieces in their exporter, but this
    check uses the composed atlas. Broad joint bounds avoid cutting a thick limb
    down to a predetermined width. Nearby arms/hands are removed only when their
    own declared bone is closer than either leg; merged legs remain unmeasurable.
    """
    required = [f"{side}_{name}" for side in ("r", "l") for name in ("hip", "knee", "ankle")]
    if any(key not in joints for key in required):
        raise ValueError("native leg measurement requires both hip/knee/ankle chains")
    legs = [(joints[f"{side}_{a}"], joints[f"{side}_{b}"])
            for side in ("r", "l") for a, b in (("hip", "knee"), ("knee", "ankle"))]
    arms = [(joints[f"{side}_{a}"], joints[f"{side}_{b}"])
            for side in ("r", "l") for a, b in (("shoulder", "elbow"), ("elbow", "wrist"),
                                               ("wrist", "fingertip"))
            if f"{side}_{a}" in joints and f"{side}_{b}" in joints]
    leg_joints = [joints[key] for key in required]
    pad = 12 / factor
    x0, x1 = min(p[0] for p in leg_joints) - pad, max(p[0] for p in leg_joints) + pad
    cutoff = max(joints["r_hip"][1], joints["l_hip"][1]) + 5 / factor
    floor = max(joints["r_ankle"][1], joints["l_ankle"][1]) + 10 / factor
    points = set()
    for point in alpha_points(body):
        x, y = point
        if not (x0 <= x <= x1 and cutoff <= y <= floor):
            continue
        distance = min(segment_distance(point, a, b) for a, b in legs)
        if arms and min(segment_distance(point, a, b) for a, b in arms) + 0.5 < distance:
            continue
        points.add(point)
    return points, cutoff


def composite_idle(catalog, atlas, frame):
    result = Image.new("RGBA", atlas.size)
    hair = next((h["id"] for h in catalog.get("hairStyles", [])
                 if h["id"] == "silver_swept"), None)
    if hair is None and catalog.get("hairStyles"):
        hair = catalog["hairStyles"][0]["id"]
    direction = frame.get("headDirection", "S")
    hair_prefix = frame.get("hairPrefix", "")
    names = []
    if hair:
        names.append(f"{hair_prefix}_{hair}_{direction}_back")
    base = frame["bodyPrefix"] + "_base"
    names.append(base + "_7" if base + "_7" in atlas.cells else base)
    preferred = {"pants": "pants_dark", "boots": "boots_brown", "upper": "jacket_navy"}
    for slot in sorted(catalog.get("garmentSlots", []), key=lambda s: s["order"]):
        choices = slot.get("items", [])
        if choices:
            wanted = preferred.get(slot["id"])
            item = next((p["id"] for p in choices if p["id"] == wanted), choices[0]["id"])
            names.append(frame["garmentPrefix"] + "_" + item)
    if not catalog.get("integratedHeads") or hair == "bald":
        names.append(frame["name"] + "_identity")
    if hair:
        names.append(f"{hair_prefix}_{hair}_{direction}_front")
    arm = frame["garmentPrefix"] + "_arm_" + preferred["upper"]
    if arm in atlas.cells:
        names.append(arm)
    for name in names:
        if name not in atlas.cells:
            raise ValueError("appearance layer missing: " + name)
        result.alpha_composite(atlas.sprite(name))
    return result


def audit(args):
    catalog_path = args.catalog.resolve()
    catalog = read_json(catalog_path)
    ppu = float(catalog.get("ppu", 48))
    if ppu <= 0:
        raise ValueError("PPU must be positive")
    factor = NATIVE_PPU / ppu
    report = {"catalog": str(catalog_path), "template": catalog.get("template"),
              "hair_revision": catalog.get("hairRevision"), "measurement_ppu": NATIVE_PPU,
              "thresholds": LIMITS, "native": {}, "idle_appearance": {},
              "samples": [], "failures": [], "unmeasurable": [], "coverage": {}}
    failures = report["failures"]
    missing = report["unmeasurable"]
    selected = [i for i in catalog["identities"]
                if not args.identity or i["id"] in args.identity]
    if not selected:
        raise ValueError("no selected catalog identities")
    for identity in selected:
        identity_id = identity["id"]
        sex = "female" if identity_id.endswith("_f") else "male"
        native = report["native"].setdefault(sex, native_reference(sex))
        atlas = Atlas(catalog_path, identity["texture"], catalog["frameSize"])
        boot_slot = next(s for s in catalog["garmentSlots"] if s["equipSlot"] == "feet")
        boot_id = next((p["id"] for p in boot_slot["items"] if p["id"] == "boots_brown"),
                       boot_slot["items"][0]["id"])
        samples = []
        seen = set()
        for sequence in identity["sequences"]:
            action, direction = sequence["action"], sequence["direction"]
            if action not in ("idle", "walk", "attack", "cast"):
                continue
            if args.directions and direction not in args.directions:
                continue
            for frame in sequence["frames"]:
                key = (action, direction, frame.get("bodyPrefix"), frame.get("garmentPrefix"))
                if frame.get("transitionPose") or key in seen:
                    continue
                seen.add(key)
                sample = {"identity": identity_id, "action": action, "direction": direction,
                          "phase": frame.get("posePhase"), "source": frame.get("source"),
                          "legs": None, "boots": None, "sole_bands": None}
                try:
                    body = atlas.sprite(frame["bodyPrefix"] + "_base")
                    waist = source_waist(catalog_path, frame, body, args.body_dir)
                    sample["waist_export_px"] = waist
                    skin = {(x, y) for x, y in alpha_points(body)
                            if y >= waist + 5 / factor
                            and (lambda c: c[0] > 100 and c[0] - c[1] > 20
                                 and c[1] - c[2] > 8)(body.getpixel((x, y)))}
                    pair, reason, _ = two_feet(skin, factor)
                    if pair:
                        sample["legs"] = [measure(p, factor) for p in pair]
                    else:
                        missing.append({"sample": key[:2] + (frame["bodyPrefix"],),
                                        "identity": identity_id, "part": "legs", "reason": reason})
                except (KeyError, ValueError, OSError, StopIteration) as exc:
                    missing.append({"sample": frame["name"], "identity": identity_id,
                                    "part": "legs", "reason": str(exc)})
                try:
                    boot_points = alpha_points(atlas.sprite(frame["garmentPrefix"] + "_" + boot_id))
                    pair, reason, groups = two_feet(boot_points, factor)
                    if pair:
                        sample["boots"] = [measure(p, factor) for p in pair]
                        sample["sole_bands"] = [measure(foot_band(p, factor), factor) for p in pair]
                        extras = [p for p in groups if p is not pair[0] and p is not pair[1]
                                  and len(p) > max(24 / factor ** 2, min(map(len, pair)) * 0.35)]
                        if extras:
                            failures.append({"identity": identity_id, "action": action,
                                             "direction": direction, "phase": sample["phase"],
                                             "part": "boots", "metric": "extra_large_component",
                                             "measured": [measure(p, factor) for p in extras],
                                             "reason": "boot mask includes a disconnected non-foot-sized piece"})
                    else:
                        missing.append({"sample": frame["name"], "identity": identity_id,
                                        "part": "boots", "reason": reason})
                except (KeyError, ValueError, OSError) as exc:
                    missing.append({"sample": frame["name"], "identity": identity_id,
                                    "part": "boots", "reason": str(exc)})
                if action == "idle" and direction == "S":
                    try:
                        style = appearance_metrics(composite_idle(catalog, atlas, frame), factor)
                        report["idle_appearance"][identity_id] = style
                        ref_height = native["appearance"]["height"]
                        lower, upper = LIMITS["idle_height_vs_native"]
                        if not ref_height * lower - 1 <= style["height"] <= ref_height * upper + 1:
                            failures.append({"identity": identity_id, "action": "idle", "direction": "S",
                                             "part": "complete_idle", "metric": "native_height",
                                             "measured": style["height"],
                                             "allowed": [round(ref_height * lower - 1, 3),
                                                         round(ref_height * upper + 1, 3)]})
                    except (KeyError, ValueError, OSError) as exc:
                        missing.append({"sample": frame["name"], "part": "idle_appearance", "reason": str(exc)})
                samples.append(sample)

        baseline = {(s["direction"], part): s[part] for s in samples if s["action"] == "idle"
                    for part in ("legs", "boots") if s[part]}
        for sample in samples:
            for part, rules in (
                ("legs", (("area", "leg_area_vs_idle", 0), ("local_girth", "leg_girth_vs_idle", 1))),
                ("boots", (("area", "boot_area_vs_idle", 0), ("local_girth", "boot_girth_vs_idle", 1),
                           ("pca_major", "boot_length_vs_idle", 1))),
            ):
                current, reference = sample[part], baseline.get((sample["direction"], part))
                if not current or sample["action"] == "idle":
                    continue
                if not reference:
                    missing.append({"sample": sample["source"], "identity": identity_id,
                                    "part": part, "reason": "idle has no separated measurable pair"})
                    continue
                for metric, limit, extra in rules:
                    value = max(p[metric] for p in current)
                    base = max(p[metric] for p in reference)
                    allowed = base * LIMITS[limit] + extra * LIMITS["dimension_tolerance_native_px"]
                    if value > allowed:
                        failures.append({**{k: sample[k] for k in ("identity", "action", "direction", "phase")},
                                         "part": part, "metric": metric, "measured": value,
                                         "idle_reference": base, "allowed": round(allowed, 3)})
            # Native foot comparison uses S: no invented 8-direction native landmarks.
            if sample["direction"] == "S" and sample["sole_bands"]:
                for metric, limit, tolerance in (("area", "foot_area_vs_native", 0),
                                                  ("local_girth", "foot_girth_vs_native", 1)):
                    value = max(p[metric] for p in sample["sole_bands"])
                    base = max(p[metric] for p in native["sole_bands"])
                    allowed = base * LIMITS[limit] + tolerance
                    if value > allowed:
                        failures.append({**{k: sample[k] for k in ("identity", "action", "direction", "phase")},
                                         "part": "sole_band", "metric": metric, "measured": value,
                                         "native_reference": base, "allowed": round(allowed, 3)})
        coverage = {}
        for action in ("idle", "walk", "attack", "cast"):
            coverage[action] = {part: sum(bool(s[part]) and
                                               (action == "idle" or (s["direction"], part) in baseline)
                                               for s in samples if s["action"] == action)
                                for part in ("legs", "boots")}
        report["coverage"][identity_id] = coverage
        report["samples"].extend(samples)
    absent_coverage = any(not n for actor in report["coverage"].values()
                          for action in actor.values() for n in action.values())
    report["status"] = "FAIL" if failures else "INCONCLUSIVE" if absent_coverage else "PASS"
    report["notes"] = [
        "All dimensional metrics are native pixels at 48 PPU; areas are square native pixels.",
        "PCA minor is diagnostic only: a bent limb can have a large minor extent without being thicker.",
        "Native colors/outline and complete idle width are diagnostics, not claims of visual art quality.",
        "Unmeasurable/overlapping views remain listed; PASS requires measured action coverage, not every view.",
        "Skin segmentation assumes the current authored warm skin palette; other palettes require a semantic skin mask.",
    ]
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=REPO / "assets/mannequin/v2/catalog.json")
    parser.add_argument("--body-dir", type=Path, help="authored source PNG/waist metadata directory override")
    parser.add_argument("--report", type=Path, help="write complete measurements/issues as UTF-8 JSON")
    parser.add_argument("--identity", action="append", help="catalog identity id; repeat to select several")
    parser.add_argument("--directions", nargs="+", help="optional view subset, e.g. S SW W")
    args = parser.parse_args()
    try:
        report = audit(args)
    except (KeyError, ValueError, OSError, StopIteration) as exc:
        print("INCONCLUSIVE: " + str(exc))
        return 2
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{report['status']}: {len(report['samples'])} unique poses, "
          f"{len(report['failures'])} failed limits, "
          f"{len(report['unmeasurable'])} unmeasurable part/comparison records")
    for sex, reference in report["native"].items():
        print(f"Native {sex}: height={reference['appearance']['height']}, "
              f"sole area={[p['area'] for p in reference['sole_bands']]}, "
              f"sole girth={[p['local_girth'] for p in reference['sole_bands']]}")
    for identity, counts in report["coverage"].items():
        print(identity + " measured coverage: " + json.dumps(counts))
    for issue in report["failures"][:12]:
        print("FAIL " + json.dumps(issue, ensure_ascii=True))
    if not report["failures"]:
        for issue in report["unmeasurable"][:5]:
            print("UNMEASURABLE " + json.dumps(issue, ensure_ascii=True))
    return {"PASS": 0, "FAIL": 1, "INCONCLUSIVE": 2}[report["status"]]


if __name__ == "__main__":
    sys.exit(main())
