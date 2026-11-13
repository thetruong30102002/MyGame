"""Sửa những câu máy chủ có dấu nháy / mẫu mà bộ dịch tự động bỏ sót."""
import json
from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'UnityGame/Assets/HavenLord/Data/Client/i18n.server.en.json'
data = json.loads(path.read_text(encoding='utf-8'))
data.update({
    'Không có tài khoản "{0}"': 'Account "{0}" not found',
    'Không có nhân vật "{0}"': 'Character "{0}" not found',
    'Không trừ được: {0} chỉ có {1} kim cương': 'Cannot deduct: {0} has only {1} diamonds',
    '<vùng>/<tên>': '<vùng>/<tên>',
    'Chưa đạt mục tiêu "{0}"': 'Goal "{0}" not reached',
    '✔ "{0}" đã có — đặt lại mật khẩu, đăng xuất các phiên cũ ({1})': '✔ "{0}" already exists — reset password and sign out old sessions ({1})',
    'Không tạo được tài khoản "{0}"': 'Could not create account "{0}"',
    'Không đủ kim cương để mua {0} (cần {1})': 'Not enough diamonds to buy {0} (need {1})',
    'Không gửi được lời mời tới {0}.': 'Could not send an invitation to {0}.',
    '<vùng>/<map>': '<vùng>/<map>',
    '{0}: {1}{2} → {3} kim cương': '{0}: {1}{2} → {3} diamonds',
    '⚔ {0} đã xuất hiện ở {1} · Khu {2}!': '⚔ {0} has appeared in {1} · Channel {2}!',
})
path.write_text(json.dumps(dict(sorted(data.items())), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
