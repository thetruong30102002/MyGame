"""Dịch bảng chữ Việt bằng dịch máy thần kinh; giữ tên riêng, ký hiệu và thuật ngữ game."""
import json
import argparse
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'UnityGame/Assets/HavenLord/Data/Client/i18n.en.json'
KEYS = ROOT / 'UnityGame/Assets/HavenLord/Data/Client/i18n.client.keys.json'
NAMES = ['Thistlewood', 'Lau Xám', 'Ánh Tím', 'Haven', 'Bram', 'Nyra', 'Odessa', 'Zahra', 'Hassim',
         'Orrin', 'Wenna', 'Kael', 'Hilde', 'Durin', 'Maris', 'Corvin', 'Sein', 'Sera']
GLOSSARY = {'Bọc Nguyên Tố': 'Elemental Coating', 'Gia viên': 'Homestead', 'Tiềm năng': 'Talents',
            'kim cương': 'diamonds', 'Kim cương': 'Diamonds', 'xu': 'coins', 'Xu': 'Coins',
            'khu': 'Channel', 'Khu': 'Channel', 'Hằng ngày': 'Daily',
            'nhiệm vụ chính': 'Main quests', 'nhiệm vụ phụ': 'Side quests',
            'Bình hồi phục': 'Healing Potion', 'Bạn bè': 'Friends', 'tự đi': 'auto walk'}
PROTECT = re.compile(r'</?[^>]+>|\{\d+\}|\\n|[·→▾▸]|\b(?:Esc|Enter|Tab|Shift|WASD|PC|APK|NPC|EXP|HP|MP|PvP)\b')


def mask(source):
    replacements = []
    parts = sorted(list(NAMES) + list(GLOSSARY), key=len, reverse=True)
    pattern = re.compile('|'.join(r'(?<!\w)' + re.escape(x) + r'(?!\w)' for x in parts) + '|' + PROTECT.pattern)
    def sub(match):
        word = match.group()
        target = GLOSSARY.get(word, word)
        token = f'ZXQ{len(replacements)}ZXQ'
        replacements.append((token, target))
        return token
    return pattern.sub(sub, source), replacements


def translate(vi):
    masked, replacements = mask(vi)
    url = 'https://translate.googleapis.com/translate_a/single?' + urllib.parse.urlencode(
        {'client': 'gtx', 'sl': 'vi', 'tl': 'en', 'dt': 't', 'q': masked})
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as response:
                chunks = json.load(response)[0]
            result = ''.join(c[0] for c in chunks if c[0])
            for token, value in replacements:
                result = result.replace(token, value)
            if 'ZXQ' in result or not result.strip():
                raise ValueError('missing protected token')
            return result
        except Exception:
            time.sleep(1 + attempt * 2)
    return None


if __name__ == '__main__':
    cli = argparse.ArgumentParser()
    cli.add_argument('--keys', type=Path, default=KEYS)
    cli.add_argument('--out', type=Path, default=OUT)
    args = cli.parse_args()
    keys = list(json.loads(args.keys.read_text(encoding='utf-8')))
    output = json.loads(args.out.read_text(encoding='utf-8')) if args.out.exists() else {}
    todo = [key for key in keys if key not in output]
    for start in range(0, len(todo), 40):
        batch = todo[start:start + 40]
        with ThreadPoolExecutor(max_workers=8) as pool:
            futures = {pool.submit(translate, key): key for key in batch}
            for future in as_completed(futures):
                result = future.result()
                if result is not None:
                    output[futures[future]] = result
        args.out.write_text(json.dumps(dict(sorted(output.items())), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'{len(output)}/{len(keys)} translated', flush=True)
