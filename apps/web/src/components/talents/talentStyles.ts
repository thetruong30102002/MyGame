/**
 * CSS riêng của cây Tiềm năng (đặc tả cây 1.2–1.4): hình nút theo `data-shape`, trạng thái theo `data-state`, chip giá,
 * nhãn lưu phái, nhấp nháy nấc kế. Nằm trong một thẻ `<style>` của tab (globals.css thuộc việc khác) — mọi lớp có tiền tố
 * `tt-` nên không đụng ai. Nhấp nháy bằng `steps()` (đúng chất pixel) và TẮT khi `prefers-reduced-motion`; không blur.
 * Pha thứ hai của nhịp nháy là màu SÁNG (honey): pha amber cũ tạo vòng nâu tối dày 5px trông y viền "đang chọn" (ink-brown)
 * — nút đang chọn thì đứng yên, không nháy. Máy cảm ứng (`data-touch` ở gốc tab): mọi chip cao 44 như "Thôi" / "Đóng".
 */
export const TALENT_CSS = `
.tt-node{position:absolute;display:flex;align-items:center;justify-content:center;padding:0;border:2px solid var(--color-paper-line);background:var(--color-paper-sunk);cursor:pointer;color:var(--color-ink-faint)}
.tt-node::before{content:'';position:absolute;inset:calc(-1px * var(--hy,0)) calc(-1px * var(--hx,0))}
.tt-node[data-shape=act]{border-radius:6px}
.tt-node[data-shape=pas]{border-radius:50%}
.tt-node[data-shape=ult]{border-radius:6px;border-style:double;border-width:4px}
.tt-node[data-shape=art]{border-radius:4px;transform:rotate(45deg)}
.tt-node[data-shape=art] .tt-ic{transform:rotate(-45deg)}
.tt-node .tt-ic{display:flex;align-items:center;justify-content:center;pointer-events:none}
.tt-node[data-state=reached]{background:var(--color-honey);border-color:#8a4a0a}
.tt-node[data-state=next]{background:var(--color-paper-hi);border-color:var(--color-amber);box-shadow:0 0 0 3px var(--color-gold-hi);animation:tt-pulse 1s steps(1,end) infinite}
.tt-node[data-state=next-poor]{background:var(--color-paper-hi);border-color:var(--color-ink-faint)}
.tt-node[data-state=next] .tt-ic{filter:grayscale(.6);opacity:.8}
.tt-node[data-state=future] .tt-ic,.tt-node[data-state=next-poor] .tt-ic{filter:grayscale(1);opacity:.5}
.tt-node[data-state=soon]{background:var(--color-paper);border-style:dashed;opacity:.75}
.tt-node[data-state=dim]{opacity:.35;filter:grayscale(1)}
.tt-node[data-state=locked]{opacity:.45;filter:grayscale(1)}
.tt-node[aria-pressed=true]{outline:3px solid var(--color-ink-brown);outline-offset:2px;z-index:3;animation:none}
.tt-node:focus-visible{outline:3px solid var(--color-amber);outline-offset:2px;z-index:3}
.tt-node[data-route]{border-color:var(--color-amber)}
.tt-dots{font:800 13px/1 var(--font-sans);color:var(--color-ink-faint);pointer-events:none}
.tt-cost{position:absolute;right:-12px;top:-12px;z-index:2;padding:0 3px;border:2px solid var(--color-outline);border-radius:4px;background:var(--color-gold);color:var(--color-ink-brown);font:800 12px/14px var(--font-sans);font-variant-numeric:tabular-nums;pointer-events:none;white-space:nowrap}
.tt-cost[data-poor]{background:#f6d6c8;color:var(--color-berry);border-color:var(--color-berry)}
.tt-fork-label{position:absolute;z-index:3;transform:translate(-50%,-50%);padding:1px 5px;border-radius:4px;border:2px solid var(--color-paper-line);background:var(--color-paper);font:800 12px/13px var(--font-sans);text-align:center;white-space:nowrap;color:var(--color-ink-brown);pointer-events:none}
.tt-fork-label[data-on]{background:var(--color-honey);border-color:#8a4a0a}
.tt-fork-label[data-off]{color:var(--color-ink-faint)}
.tt-band-label{position:absolute;z-index:3;transform:translateY(-50%);padding:1px 6px;border-radius:4px;border:2px solid var(--color-paper-line);background:var(--color-paper-hi);font:800 12px/13px var(--font-sans);color:var(--color-ink-soft);white-space:nowrap;pointer-events:none}
.tt-dot{position:absolute;width:12px;height:12px;border-radius:50%;background:var(--color-gold-hi);border:2px solid var(--color-outline)}
.tt-pulse{animation:tt-pulse 1s steps(1,end) infinite}
.tt-scroll{scrollbar-color:var(--color-paper-line) transparent;scrollbar-width:thin;scrollbar-gutter:stable}
.tt-seg{display:inline-flex}
.tt-seg>.ui-chip{border-radius:0;min-height:30px;padding:0 9px;font-size:13px}
.tt-seg>.ui-chip+.ui-chip{border-left:0}
.tt-seg>.ui-chip:first-child{border-radius:6px 0 0 6px}
.tt-seg>.ui-chip:last-child{border-radius:0 6px 6px 0}
.tt-chip-sm{min-height:30px!important;padding:0 8px!important;font-size:13px!important}
.tt-chip-sm.tt-chip-tight{padding:0 6px!important}
[data-touch] .ui-chip,[data-touch] .tt-seg>.ui-chip{min-height:44px}
[data-touch] .tt-chip-sm{min-height:44px!important}
[data-touch] .tt-chip-tight{min-width:44px}
.tt-tight .tt-cost{right:-6px}
.tt-legend i{display:inline-block;vertical-align:middle;margin-right:4px;position:relative;top:-1px;border:2px solid #8a4a0a;background:var(--color-honey);width:12px;height:12px}
.tt-legend .lg-act{border-radius:3px}
.tt-legend .lg-pas{border-radius:50%}
.tt-legend .lg-art{width:10px;height:10px;transform:rotate(45deg)}
.tt-legend .lg-next{border-radius:3px;border-color:var(--color-amber);box-shadow:0 0 0 2px var(--color-gold-hi);background:var(--color-paper-hi)}
.tt-legend .lg-soon{border-radius:3px;border-style:dashed;border-color:var(--color-paper-line);background:transparent}
.tt-build>i{position:absolute;top:0;bottom:0}
.tt-build>i+i{border-left:2px solid var(--color-outline)}
.tt-unspent{background:repeating-linear-gradient(135deg,var(--color-gold-hi) 0 4px,var(--color-gold) 4px 8px)}
.tt-target{box-shadow:0 0 0 3px var(--color-gold-hi);animation:tt-pulse 1s steps(1,end) infinite}
@keyframes tt-pulse{50%{box-shadow:0 0 0 3px var(--color-honey)}}
@media (prefers-reduced-motion:reduce){.tt-node,.tt-pulse,.tt-target{animation:none!important}}
`;
