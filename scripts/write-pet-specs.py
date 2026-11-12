"""Sinh spec xuất nhân vật cho 22 thú cưng gacha (PixelLab Pro Flash 64 px, 11/11/2026) → packages/asset-pipeline/src/specs/<id>.json.
Thú cưng chỉ đi lại tự do trong Gia viên (chốt 12/11) nên xuất đứng + đi; ngủ thêm sau (bộ xuất chưa có động tác ngủ).
Chạy (ở gốc repo): python -I scripts/write-pet-specs.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPECS = os.path.join(ROOT, 'packages', 'asset-pipeline', 'src', 'specs')

# id nguồn → (tên, độ hiếm 1 Thường · 2 Hiếm · 3 Sử thi · 4 Huyền thoại) — kế hoạch 9.9
PETS = {
    'pet2_cat_tabby': ('Mèo mướp cam', 1), 'pet2_cat_black': ('Mèo mun', 1), 'pet2_cat_white': ('Mèo trắng', 1), 'pet2_cat_grey': ('Mèo xám', 1),
    'pet2_dog_golden': ('Chó vàng', 1), 'pet2_dog_black': ('Chó mực', 1), 'pet2_dog_spotted': ('Chó đốm', 1), 'pet2_dog_corgi': ('Chó Corgi', 1),
    'pet2_cat_calico': ('Mèo tam thể', 2), 'pet2_cat_siamese': ('Mèo Xiêm', 2), 'pet2_cat_persian': ('Mèo Ba Tư', 2),
    'pet2_dog_husky': ('Chó Husky', 2), 'pet2_dog_shiba': ('Chó Shiba', 2), 'pet2_dog_poodle': ('Chó Poodle xù', 2),
    'pet2_cat_oddeye': ('Mèo mắt hai màu', 3), 'pet2_cat_royal': ('Mèo trắng nơ hoàng gia', 3), 'pet2_dog_samoyed': ('Chó Samoyed bông tuyết', 3),
    'pet2_dog_hound': ('Chó săn Haven lông bạc', 3),
    'pet2_cat_spirit': ('Mèo linh hồn lam', 4), 'pet2_cat_fire': ('Mèo lửa', 4), 'pet_moonwolf_002': ('Sói trăng con', 4), 'pet2_dog_cloud': ('Chó thần mây', 4),
}

for pid, (name, rarity) in PETS.items():
    spec = {
        'identity': {'characterId': pid, 'hair': 'none', 'eyes': 'animal', 'skin': 'animal', 'outfit': 'none', 'weapon': 'none', 'palette': 'pet_01'},
        'displayName': name,
        'role': 'npc',
        'provider': 'pixellab',
        'pixellab': {'animations': {'idle': 'idle', 'walk': 'walk'}, 'mirrorWest': True},
        'frameSize': {'width': 80, 'height': 80},
        'baselineY': 72,
        'animations': {'idle': {'fps': 6, 'minFrames': 4, 'maxFrames': 8}, 'walk': {'fps': 10, 'minFrames': 4, 'maxFrames': 8}},
        'cleanup': {'alignToIdle': True, 'removeForeignObjects': True, 'removeIslands': True},
        'quality': {'maxHeightDrift': 0.3, 'minSilhouette': 0.15},
        'provisional': ['SE', 'NE', 'SW', 'NW'],
        'notes': f'Thú cưng gacha độ hiếm {rarity} (kế hoạch 9.9). PixelLab Pro Flash 64 px 11/11/2026, đứng / đi hướng S / E / N (W lật từ E), '
                 'hướng chéo dùng ảnh xoay. Chỉ đi lại tự do trong Gia viên (chốt 12/11).',
        'review': {'status': 'approved', 'date': '11/11/2026', 'notes': 'Duyệt lô 22 con 11/11 (63 clip không lỗi).'},
    }
    json.dump(spec, open(os.path.join(SPECS, pid + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent='\t')
print(len(PETS), 'spec')
