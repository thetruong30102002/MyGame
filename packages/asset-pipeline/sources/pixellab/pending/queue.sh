#!/bin/bash
# Hàng đợi vẽ PixelLab bằng token MIỄN PHÍ — chạy lại khi PixelLab mở lại lượt miễn phí ("temporarily unavailable").
# Mỗi dòng JOBS: lệnh con | ảnh ra (dưới sources/pixellab) | args (pending/) | token thử lần lượt. Xong việc nào bỏ qua việc đó.
# Đã xong (bỏ khỏi hàng đợi): tranh lục địa `world/continent.png` (09/10/2026); tấm G1_graveyard / R1_ruins / B1_bonehills (10/10/2026,
# token TRẢ PHÍ #1 — đề bài ghi ở `sheets/<tấm>.png.json`, file args còn ở đây để vẽ lại nếu cần).
cd D:/nttrg/pixel
R=D:/nttrg/pixel/packages/asset-pipeline/sources/pixellab
JOBS=(
  "image|sheets/G1_gear.png|G1_gear.json|8 14 11"
)
for round in $(seq 1 ${ROUNDS:-36}); do
  left=0
  for job in "${JOBS[@]}"; do
    IFS='|' read -r sub out args toks <<< "$job"
    [ -f "$R/$out" ] && continue
    left=1
    for t in $toks; do
      r=$(timeout 3700 npm run -s assets:pixellab -- $sub $t $R/$out @$R/pending/$args 2>&1 | tail -2)
      echo "[$(date +%H:%M)] $out token $t: $r"
      echo "$r" | grep -q "✔" && break
      echo "$r" | grep -q "temporarily unavailable" && break 2
    done
  done
  [ $left = 0 ] && { echo XONG; exit 0; }
  sleep 600
done
echo HET_LUOT_THU; exit 1
