"""Gom chữ hiển thị từ JSON sim, rồi tách bảng dịch theo từng module."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'UnityGame/Assets/HavenLord/Data/Sim'
OUT = ROOT / 'UnityGame/Assets/HavenLord/Data/SimI18n'
VI = re.compile(r'[À-ỹĐđ]')


def strings(value):
    if isinstance(value, str):
        if VI.search(value):
            yield value
    elif isinstance(value, dict):
        for child in value.values():
            yield from strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from strings(child)


modules = {}
for file in sorted(SOURCE.glob('*.json')):
    modules[file.stem] = sorted(set(strings(json.loads(file.read_text(encoding='utf-8')))))
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'keys.json').write_text(json.dumps(sorted(set().union(*modules.values())), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(OUT / 'modules.json').write_text(json.dumps(modules, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

translated = OUT / 'all.en.json'
if translated.exists():
    table = json.loads(translated.read_text(encoding='utf-8'))
    for name, keys in modules.items():
        (OUT / f'{name}.en.json').write_text(json.dumps({key: table[key] for key in keys if key in table}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(modules)} modules, {sum(map(len, modules.values()))} entries, {len(set().union(*modules.values()))} unique')
