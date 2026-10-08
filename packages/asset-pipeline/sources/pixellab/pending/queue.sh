#!/bin/bash
# Hàng đợi vẽ PixelLab bằng token MIỄN PHÍ — chạy lại khi PixelLab mở lại lượt miễn phí ("temporarily unavailable").
# Mỗi dòng JOBS: lệnh con | ảnh ra (dưới sources/pixellab) | args (pending/) | token thử lần lượt. Xong việc nào bỏ qua việc đó.
cd D:/nttrg/pixel
R=D:/nttrg/pixel/packages/asset-pipeline/sources/pixellab
JOBS=(
  "image|sheets/G1_graveyard.png|G1_graveyard.json|12 13 9"
  "image|sheets/R1_ruins.png|R1_ruins.json|13 9 8"
  "image|sheets/B1_bonehills.png|B1_bonehills.json|9 8 11"
  "pro|world/continent.png|world_continent.json|10 11 14"
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
