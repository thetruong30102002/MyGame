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
    'Bàn giao khuôn viên': 'Handing Over the Grounds',
    'Không thực hiện được': 'Could not complete the action',
    'Thiên phú thức tỉnh: hệ {0}': 'Talent awakened: {0} element',
    'Hoàn thành nhiệm vụ: {0}': 'Quest complete: {0}',
    'Đủ việc hằng ngày': 'All daily tasks done',
    "pvp:Gục khi mang tiếng xấu": "pvp:Fell while infamous",
    "Gục khi mang tiếng xấu": "Fell while infamous",
    "Người bán không tiếp kẻ mang tiếng xấu — hãy chuộc tội ở chỗ Lena (nhà thờ) trước": "Merchants won't deal with the infamous — atone with Lena (church) first",
    "Tám ngọn đèn": "Eight Lamps",
    "Đang bị truy nã — không tắt được đồ sát": "You are wanted — PK mode can't be turned off",
    "Vừa đánh người — chờ {0} giây nữa mới tắt được đồ sát": "You just attacked someone — wait {0} more seconds to turn PK mode off",
    "Bạn không có tiếng xấu nào cần chuộc": "You have no infamy to atone for",
    "Kẻ đang bị truy nã không được chuộc tội": "The wanted cannot atone",
    "Hãy tới gặp Lena ở nhà thờ để chuộc tội": "Go see Lena at the church to atone",
    "Cần {0} xu để chuộc {1} điểm ác": "Need {0} coins to atone for {1} infamy",
    "Đã chuộc {0} điểm ác": "Atoned for {0} infamy",
    "Truy nã {0}": "Bounty on {0}",
    "⚔ {0} đã hạ kẻ bị truy nã {1} — nhận {2} xu tiền thưởng!": "⚔ {0} took down the wanted {1} — {2} coins bounty!",
    "⚔ Truy nã: {0} đã hạ nhiều người vô tội! Ai hạ được sẽ nhận {1} xu.": "⚔ WANTED: {0} has killed many innocents! Whoever takes them down earns {1} coins.",
    "Người này không muốn dính dáng tới kẻ mang tiếng xấu — hãy chuộc tội ở chỗ Lena trước": "They want nothing to do with the infamous — atone with Lena first",
    "Chuộc tội": "Atonement",
    "Kẻ bị truy nã": "Wanted",
    "Đồ tể": "Butcher",
    "Sát nhân": "Murderer",
    "Kẻ gây sự": "Troublemaker",
})
path.write_text(json.dumps(dict(sorted(data.items())), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
