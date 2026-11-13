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
# Bản dịch rà tay (Claude 13/11/2026): đè lên dịch máy cho các câu sai nghĩa / phần mới — giữ tên riêng, thẻ, {n}.
review = Path(__file__).resolve().parent / 'i18n-client-review.json'
if review.exists():
    data.update(json.loads(review.read_text(encoding='utf-8')))
path.write_text(json.dumps(dict(sorted(data.items())), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
