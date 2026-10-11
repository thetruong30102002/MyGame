# Đếm cây theo vùng / theo map trên assets/maps — phép đo nghiệm thu mục 5.6 docs/ke-hoach-the-gioi.md (cây mỗi vùng một kiểu,
# mỗi map một loại cây chủ đạo). Chạy từ gốc repo: python -I -X utf8 docs/tools/dem-cay.py [thư mục maps khác, mặc định assets/maps]
import collections
import glob
import io
import json
import os
import re
import sys

TREE = re.compile(r'tree|dead_|pine|palm|oak|willow|birch|mangrove|cypress|bamboo|baobab|cactus|bush|shrub|sapling', re.I)
FLIP = re.compile(r'_flip$')


def species(prop_id):
    """Bản lật (`_flip`) tính chung một loài với bản gốc."""
    return FLIP.sub('', prop_id)


ROOT = sys.argv[1] if len(sys.argv) > 1 else 'assets/maps'
owners = collections.defaultdict(set)
for region in sorted(os.listdir(ROOT)):
    total = collections.Counter()
    print(f'== {region}')
    for path in sorted(glob.glob(f'{ROOT}/{region}/*.json')):
        name = os.path.basename(path)[:-5]
        if '.' in name or name.startswith('props'):
            continue
        data = json.load(io.open(path, encoding='utf-8'))
        trees = collections.Counter(species(p['id']) for p in data.get('props') or [] if isinstance(p, dict) and p.get('id') and TREE.search(p['id']))
        if not trees:
            continue
        total.update(trees)
        n = sum(trees.values())
        top, top_n = trees.most_common(1)[0]
        print(f'   {name:14} {n:4} cây · chủ đạo {top} {top_n * 100 // n}% · {len(trees)} loài: {", ".join(trees)}')
    for s in total:
        owners[s].add(region)
    print(f'   tổng {len(total)} loài: {", ".join(f"{k}×{v}" for k, v in total.most_common())}')

shared = {s: sorted(r) for s, r in owners.items() if len(r) > 1}
print('== loài dùng chung nhiều vùng:', ', '.join(f'{s} ({"/".join(r)})' for s, r in sorted(shared.items())) or 'không có')
