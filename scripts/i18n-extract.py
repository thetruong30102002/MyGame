"""Gom chữ Việt trong client Unity; câu nội suy đơn giản đổi thành mẫu {0}, {1}."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIENT = ROOT / "UnityGame/Assets/HavenLord/Client"
OUT = ROOT / "UnityGame/Assets/HavenLord/Data/Client"
VI = re.compile(r"[À-ỹĐđ]")
EXPR = re.compile(r"\{([^{}]+)\}")


def literals(source):
    i = 0
    while i < len(source):
        if source.startswith("//", i):
            i = source.find("\n", i)
            if i < 0:
                break
            continue
        if source.startswith("/*", i):
            i = source.find("*/", i + 2)
            if i < 0:
                break
            i += 2
            continue
        start = i
        interpolated = source.startswith('$"', i)
        verbatim = source.startswith('@"', i) or source.startswith('$@"', i) or source.startswith('@$"', i)
        if interpolated:
            i += 2
        elif verbatim:
            i += 3 if source[i] in '$@' and source[i + 1] in '$@' else 2
        elif source[i] == '"':
            i += 1
        else:
            i += 1
            continue
        chars = []
        depth = 0
        while i < len(source):
            if not verbatim and source[i] == '\\' and i + 1 < len(source):
                chars.append(source[i:i + 2])
                i += 2
            elif verbatim and source.startswith('""', i):
                chars.append('"')
                i += 2
            elif interpolated and source[i] == '{' and not source.startswith('{{', i):
                depth += 1
                chars.append(source[i])
                i += 1
            elif interpolated and source[i] == '}' and depth:
                depth -= 1
                chars.append(source[i])
                i += 1
            elif source[i] == '"' and depth == 0:
                i += 1
                break
            elif source[i] == '"' and depth > 0:
                end = i + 1
                while end < len(source):
                    if source[end] == '\\':
                        end += 2
                    elif source[end] == '"':
                        end += 1
                        break
                    else:
                        end += 1
                chars.append(source[i:end])
                i = end
            else:
                chars.append(source[i])
                i += 1
        yield start, ''.join(chars), interpolated


def unescape(s):
    return re.sub(r'\\([\\"nrt])', lambda m: {'n': '\n', 'r': '\r', 't': '\t'}.get(m[1], m[1]), s)


def extract():
    found = {}
    manual = []
    for path in sorted(CLIENT.rglob('*.cs')):
        if path.name.startswith('AutoTest'):
            continue
        source = path.read_text(encoding='utf-8-sig')
        for offset, raw, interpolated in literals(source):
            if not VI.search(raw):
                continue
            line = source.count('\n', 0, offset) + 1
            key = unescape(raw)
            if interpolated:
                if re.search(r'\{[^{}]*\?[^{}]*\}', raw) or raw.count('{') != raw.count('}'):
                    manual.append({'file': str(path.relative_to(ROOT)), 'line': line, 'source': raw})
                    continue
                n = 0
                def slot(match):
                    nonlocal n
                    result = '{' + str(n) + '}'
                    n += 1
                    return result
                key = EXPR.sub(slot, key)
            found.setdefault(key, []).append(f'{path.relative_to(ROOT)}:{line}')
    return found, manual


if __name__ == '__main__':
    found, manual = extract()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'i18n.client.keys.json').write_text(json.dumps(found, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (OUT / 'i18n.client.manual.json').write_text(json.dumps(manual, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(found)} keys, {len(manual)} manual strings')
