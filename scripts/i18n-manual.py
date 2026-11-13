"""Ráp mẫu cho các chuỗi nội suy lồng biểu thức mà lượt trích tự động đã gắn cờ rà tay."""
import json
from pathlib import Path
from importlib.util import module_from_spec, spec_from_file_location

ROOT = Path(__file__).resolve().parents[1]
CLIENT = ROOT / 'UnityGame/Assets/HavenLord/Data/Client'
spec = spec_from_file_location('translator', ROOT / 'scripts/i18n-translate.py')
module = module_from_spec(spec)
spec.loader.exec_module(module)


def template(raw):
    out = []
    i = 0
    slot = 0
    while i < len(raw):
        if raw.startswith('{{', i) or raw.startswith('}}', i):
            out.append(raw[i:i + 2])
            i += 2
        elif raw[i] == '{':
            depth = 1
            i += 1
            quoted = False
            while i < len(raw) and depth:
                c = raw[i]
                if c == '"' and (i == 0 or raw[i - 1] != '\\'):
                    quoted = not quoted
                if not quoted:
                    if c == '{':
                        depth += 1
                    elif c == '}':
                        depth -= 1
                i += 1
            if depth:
                raise ValueError('unclosed expression')
            out.append('{' + str(slot) + '}')
            slot += 1
        else:
            out.append(raw[i])
            i += 1
    return ''.join(out).replace('\\n', '\n')


table_path = CLIENT / 'i18n.en.json'
table = json.loads(table_path.read_text(encoding='utf-8'))
manual = json.loads((CLIENT / 'i18n.client.manual.json').read_text(encoding='utf-8'))
fixes = {
    'Bọc {0} · {1}s': 'Elemental Coating {0} · {1}s',
    'Đã áp {0} thay đổi cho {1}': 'Applied {0} changes to {1}',
    'Nhận {0}': 'Received {0}',
    'Con đường: {0}': 'Path: {0}',
    'Học được: {0}': 'Learned: {0}',
    '[layered] đầu {0} ({1}/{2}) không đội được thân {3} ({4}/{5}) — đầu theo giới và khuôn': '[layered] head {0} ({1}/{2}) cannot use body {3} ({4}/{5}) — gender and build must match',
    'Cấp {0}  ·  {1}': 'Level {0} · {1}',
    'Trò chuyện <color=#ff8a7a>({0})</color> »': 'Chat <color=#ff8a7a>({0})</color> »',
    'Khu {0} · {1} người{2}': 'Channel {0} · {1} players{2}',
    '{0}  <size=12><color=#c9b48a>{1}{2}</color></size>': '{0} <size=12><color=#c9b48a>{1}{2}</color></size>',
    '{0} · {1} EXP · {2} xu · đã hạ <b>{3}</b>': '{0} · {1} EXP · {2} coins · defeated <b>{3}</b>',
    'Thú cưng · {0}/{1} loài · {2} kim cương · mảnh {3}': 'Pets · {0}/{1} species · {2} diamonds · {3} shards',
    'Tỉ lệ: Thường {0}% · Hiếm {1}% · Sử thi {2}% · Huyền thoại {3}% · 10 lượt chắc chắn ≥ 1 Hiếm · {4} lượt chắc chắn Huyền thoại (đã quay {5}).': 'Rates: Common {0}% · Rare {1}% · Epic {2}% · Legendary {3}% · Rare guaranteed in 10 pulls · Legendary in {4} pulls ({5} done).',
    'Quay 1 lần · {0} KC': 'Pull once · {0} diamonds',
    'Quay 10 lần · {0} KC': 'Pull 10 times · {0} diamonds',
    'Bấm thú đã có để thả / cất (tối đa {0} con đi lại trong Gia viên). Thú chưa có: đổi bằng mảnh.': 'Tap an owned pet to release or store it (up to {0} roam your Homestead). Trade shards for new pets.',
    '<color=#ffd166>{0}</color>  <color=#8a7a66>{1}{2}{3}</color>': '<color=#ffd166>{0}</color> <color=#8a7a66>{1}{2}{3}</color>',
    '{0} Đã xong ({1})': '{0} Completed ({1})',
    '{0} · cấp {1}–{2} · đã tới map nào thì dịch chuyển về map đó được': '{0} · level {1}–{2} · travel to any visited map',
    '\n{0}hồi {1} giây': '\n{0}cooldown {1}s',
    '{0}  <size=12><color=#e9c46a>cấp {1}–{2}</color></size>': '{0} <size=12><color=#e9c46a>level {1}–{2}</color></size>',
}
for entry in manual:
    key = template(entry['source'])
    entry['template'] = key
    if key not in table:
        table[key] = module.translate_local(key)
    if key in fixes:
        table[key] = fixes[key]
table_path.write_text(json.dumps(dict(sorted(table.items())), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(CLIENT / 'i18n.client.manual.json').write_text(json.dumps(manual, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(manual)} flagged expressions, {len(table)} translated client keys')
