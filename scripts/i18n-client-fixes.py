"""Chỉnh các câu dịch máy sai nghĩa hoặc quá dài trên nhãn nhỏ."""
import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'UnityGame/Assets/HavenLord/Data/Client/i18n.en.json'
data = json.loads(path.read_text(encoding='utf-8'))
data.update({
    'Bể': 'Tank',
    'Cất': 'Store',
    'Cất ': 'Store ',
    'Đang': 'Active',
    'TẮT': 'OFF',
    'Về': 'Back',
    'Đồ': 'Items',
    'Chín kỹ': 'Well done',
    'Ô chưa mở ': 'Locked slot ',
    'Đã có': 'Owned',
    'Chưa tới': 'Unvisited',
    'Giữ thế': 'Hold stance',
    'Có địch!': 'Enemy ahead!',
    'Sắp mở': 'Coming soon',
    'Rút hết': 'Withdraw all',
    'Mốc này sắp có': 'Coming soon',
    'Tải bản mới lỗi: ': 'Update failed: ',
    '<color=#9fe39a>Vừa áp: ': '<color=#9fe39a>Applied: ',
    'Bạn': 'You',
    'Ông Rơm': 'Ông Rơm',
})
path.write_text(json.dumps(dict(sorted(data.items())), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
