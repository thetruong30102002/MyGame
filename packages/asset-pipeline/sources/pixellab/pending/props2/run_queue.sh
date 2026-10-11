#!/usr/bin/env bash
# Chạy hàng việc của MỘT token tuần tự; free bị khoá tạm ("temporarily unavailable") thì chờ 3 phút thử lại (tối đa ~2 giờ).
t=$1; q=${2:-$1}
cd /d/nttrg/pixel/packages/asset-pipeline
log=/d/nttrg/pixel/packages/asset-pipeline/sources/pixellab/pending/props2/log_$t.txt
while read -r kind a b; do
  [ -z "$kind" ] && continue
  for try in $(seq 1 40); do
    if [ "$kind" = object ]; then out=$(npx tsx src/cli.ts pixellab object "$t" "$a" "$b" 2>&1); else out=$(npx tsx src/cli.ts pixellab image "$t" "$a" "$b" 2>&1); fi
    if echo "$out" | grep -q "temporarily unavailable\|long queues"; then echo "$(date +%H:%M) $a: free đang khoá, chờ" >> "$log"; sleep 180; continue; fi
    if echo "$out" | grep -q "✔"; then echo "$(date +%H:%M) ✔ $a" >> "$log"; else echo "$(date +%H:%M) ✘ $a: $(echo "$out" | tail -2 | tr '\n' ' ' | cut -c1-300)" >> "$log"; fi
    break
  done
done < "/d/nttrg/pixel/packages/asset-pipeline/sources/pixellab/pending/props2/queue_$q.txt"
echo "$(date +%H:%M) xong hàng" >> "$log"
