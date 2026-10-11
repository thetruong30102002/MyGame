"""Chuyển bản thiết kế tuổi thơ (JSON từ workflow "childhood-story-design") sang packages/sim/src/story/childhood.ts (dữ liệu truyện dùng chung web + máy chủ — M3.3).

Chạy: python packages/asset-pipeline/src/story/buildChildhood.py <design.json>
Thiết kế là dữ liệu do người duyệt chốt; file .ts sinh ra KHÔNG sửa tay (sửa JSON rồi chạy lại).
"""
import io
import json
import re
import sys

SRC = sys.argv[1]
OUT = 'D:/nttrg/pixel/packages/sim/src/story/childhood.ts'
d = json.load(io.open(SRC, encoding='utf-8'))

# Sprite cho từng khoá NPC. Chưa có trong manifest thì game tự hiện điểm tương tác phát sáng.
SPRITE = {
    'mother_elin': 'npc_elin_001', 'elin': 'npc_elin_001',
    'father_garrick': 'npc_garrick_001', 'garrick': 'npc_garrick_001',
    'healer_mirelle': 'npc_mirelle_001',
    'merchant_bram': 'npc_bram_001',
    'kid_aldric': 'npc_aldric_child_001', 'kid_aldric_forest': 'npc_aldric_child_001',
}


def js(v):
    return json.dumps(v, ensure_ascii=False)


def placement(text):
    spot = re.search(r"spot '([a-z_0-9]+)'", text)
    dx = re.search(r'dx\s*([+-]?\s*\d+)', text)
    dy = re.search(r'dy\s*([+-]?\s*\d+)', text)
    ages = re.search(r'[Tt]uổi\s*\[(\d+)\s*,\s*(\d+)\]', text)
    at = {'spot': spot.group(1) if spot else 'home'}
    if dx:
        at['dx'] = int(dx.group(1).replace(' ', ''))
    if dy:
        at['dy'] = int(dy.group(1).replace(' ', ''))
    return at, ([int(ages.group(1)), int(ages.group(2))] if ages else None)


idle = {i['npc']: i['lines'] for i in d['idleLines']}
npcs = {}
for n in d['npcs']:
    at, ages = placement(n['placement'])
    if ages is None:
        ages = [16, 99] if n['key'] in ('elin', 'garrick') else [3, 7]
    npcs[n['key']] = {'name': n['name'], 'title': n['title'], 'sprite': SPRITE.get(n['key']), 'at': at, 'ages': ages, 'idle': idle.get(n['key'], ['…'])}


def objective(detail, otype):
    head = detail.split('|')[0].strip()
    parts = head.split(':')
    if otype == 'talk':
        return {'type': 'talk', 'npc': parts[1]}
    if otype == 'pickup':
        return {'type': 'pickup', 'item': parts[1], 'count': int(parts[2])}
    if otype == 'kill':
        o = {'type': 'kill', 'count': int(parts[-1])}
        if len(parts) == 3:
            o['monster'] = parts[1]
        return o
    if otype == 'practice':
        o = {'type': 'practice', 'count': int(parts[-1])}
        if len(parts) == 3 and parts[1] not in ('any', '*'):
            o['element'] = parts[1]
        return o
    if otype == 'reach':
        return {'type': 'reach', 'spot': parts[1]}
    return {'type': 'boss', 'id': parts[1]}


def lines(arr):
    return [{'speaker': l['speaker'], 'text': l['line']} for l in arr]


quests = []
for q in d['quests']:
    detail = q['objectiveDetail']
    turn = re.search(r'turnIn=([a-z_]+)', detail)
    giver = None if (q['giver'] in (None, 'null', '') or 'giver=null' in detail) else q['giver']
    qd = {
        'id': q['id'], 'age': q['age'], 'title': q['title'], 'giver': giver,
        'objective': objective(detail, q['objectiveType']),
        'objectiveText': q['objectiveText'],
        'turnIn': turn.group(1) if turn else 'auto',
        'reward': {'exp': q['rewardExp']},
        'before': lines(q['dialogueBefore']),
        'after': lines(q['dialogueAfter']),
    }
    # Bài luyện phép nguyên tố: dòng mục tiêu lúc chưa học đủ chiêu, bài nhận Tia Aether thay (luật 10/10/2026).
    if q.get('objectiveTextAether'):
        qd['objectiveTextAether'] = q['objectiveTextAether']
    other = q['rewardOther']
    m = re.search(r'unlockSkill=([a-z]+)', other)
    if m:
        qd['reward']['unlockSkill'] = m.group(1)
    m = re.search(r'potions=(\d+)', other)
    if m:
        qd['reward']['potions'] = int(m.group(1))
    inner = [{'speaker': 'inner', 'text': t} for t in q['innerMonologue']]
    # Mục tiêu "talk" thì xong và trả cùng lúc → độc thoại đặt đầu thoại sau; còn lại phát lúc vừa đủ mục tiêu.
    if q['objectiveType'] == 'talk':
        qd['after'] = inner + qd['after']
    elif inner:
        qd['onReady'] = inner
    give = {}
    m = re.search(r'onGive\.pickups=([a-z_0-9,]+)', detail)
    if m:
        give['pickups'] = {'item': qd['objective'].get('item', 'herb'), 'spots': m.group(1).split(',')}
    m = re.search(r'onGive\.zone=([a-z_0-9]+)', detail)
    if m:
        give['zone'] = m.group(1)
    # Quà cha mẹ tặng NGAY khi giao việc (kiếm gỗ, trượng tập) — mở kỹ năng cùng mã để tập luôn.
    m = re.search(r'onGive\.unlock=([a-z_0-9]+)', detail)
    if m:
        give['unlock'] = m.group(1)
    if give:
        qd['onGive'] = give
    # Hình nộm cụ thể ("Ông Rơm ở sân sau" / "bên sông") — thiếu thì game chọn hình nộm gần nhất, dễ dẫn sai chỗ chữ ghi.
    m = re.search(r'dummy=([a-z_0-9]+)', detail)
    if m and qd['objective']['type'] == 'practice':
        qd['objective']['dummy'] = m.group(1)
    if q['id'] == 'c8_snow':
        # 11/10/2026: mỗi nhân vật chỉ MỘT nguyên tố nên phản ứng là lối đánh NHÓM — cha hắt nước, con tung gió (không bắt tự gây Băng Giá).
        qd['onComplete'] = {'vfx': 'frost', 'spot': 'home', 'times': 10}
    quests.append(qd)

cards = {a['age']: a['lines'] for a in d['ageCards']}
youth_npcs = {k: v for k, v in npcs.items() if v['ages'][0] >= 16}
child_npcs = {k: v for k, v in npcs.items() if v['ages'][0] < 16}

out = io.StringIO()
out.write('// SINH TỰ ĐỘNG từ bản thiết kế tuổi thơ (workflow "childhood-story-design") bởi\n')
out.write('// packages/asset-pipeline/src/story/buildChildhood.py — đừng sửa tay, sửa JSON thiết kế rồi chạy lại.\n')
out.write("import type { NpcDef, QuestDef } from './storyTypes.ts';\n\n")
out.write(f"export const CHILDHOOD_TITLE = {js(d['title'])};\n\n")
out.write(f"export const PROLOGUE: string[] = {js(d['prologue'])};\n\n")
out.write(f"export const CHILDHOOD_AGE_CARDS: Record<number, string[]> = {js(cards)};\n\n")
out.write(f"export const TIME_SKIP: string[] = {js(d['timeSkip'])};\n\n")
out.write(f"export const CHILDHOOD_NPCS: Record<string, NpcDef> = {js(child_npcs)};\n\n")
out.write(f"/** Cha mẹ ở chương 16 tuổi (chỉ có thoại idle). */\nexport const PARENT_NPCS_16: Record<string, NpcDef> = {js(youth_npcs)};\n\n")
out.write(f"export const CHILDHOOD_QUESTS: QuestDef[] = {js(quests)} as QuestDef[];\n")
io.open(OUT, 'w', encoding='utf-8').write(out.getvalue())
print(f'ok: {len(quests)} nhiệm vụ, {len(child_npcs)} NPC tuổi thơ, {len(youth_npcs)} NPC 16 tuổi, mốc tuổi {sorted(cards)}')
