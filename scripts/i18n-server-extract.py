"""Gom câu Việt trong mã máy chủ để client dịch tin hệ thống và lỗi."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'apps/server/src'
OUT = ROOT / 'UnityGame/Assets/HavenLord/Data/Client/i18n.server.keys.json'
LITERAL = re.compile(r"'((?:\\.|[^'\\])*)'|\"((?:\\.|[^\"\\])*)\"|`((?:\\.|[^`\\])*)`", re.DOTALL)
VI = re.compile(r'[À-ỹĐđ]')

found = {}
manual = []
for file in sorted(SRC.glob('*.ts')):
    source = file.read_text(encoding='utf-8-sig')
    for match in LITERAL.finditer(source):
        raw = next((g for g in match.groups() if g is not None), '')
        if not VI.search(raw) or len(raw) > 500:
            continue
        line = source.count('\n', 0, match.start()) + 1
        if source[source.rfind('\n', 0, match.start()) + 1:match.start()].lstrip().startswith(('//', '*')):
            continue
        if match.group().startswith('`'):
            if re.search(r'\$\{[^{}]*\?[^{}]*\}', raw) or raw.count('${') != raw.count('}'):
                manual.append({'file': str(file.relative_to(ROOT)), 'line': line, 'source': raw})
                continue
            n = 0
            def slot(_):
                global n
                value = '{' + str(n) + '}'
                n += 1
                return value
            raw = re.sub(r'\$\{[^{}]+\}', slot, raw)
        raw = raw.replace('\\n', '\n')
        found.setdefault(raw, []).append(f'{file.relative_to(ROOT)}:{line}')

OUT.write_text(json.dumps(found, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
OUT.with_name('i18n.server.manual.json').write_text(json.dumps(manual, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(found)} keys, {len(manual)} manual strings')
