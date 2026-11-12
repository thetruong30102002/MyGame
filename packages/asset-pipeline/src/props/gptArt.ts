// Hình tĩnh GPT (Codex) đã chuẩn hoá bằng `scripts/gpt-normalize.py` → `sources/gpt-review/<đợt>/chuan-hoa/<id>.png`
// (nền trong suốt, alpha nhị phân, ≤ 32 màu, đã có viền đậm). Đợt 12 (12/11/2026): công trình biểu tượng + 8 đồ vật cho 6 vùng
// đang mượn đồ vùng khác (docs/ke-hoach-nha-rieng.md mục 9.12).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { blit, createImage, readPng, type RGBAImage } from '../image/rgba.js';
import type { KitRegionDef } from '../maps/kit.js';
import type { PropDef } from './humanKingdom.js';

export const GPT_ART_PREFIX = 'gptart:';

/** `gptart:dot-12/nm_cum_nam_lam` → ảnh chuẩn hoá; thiếu file thì `null` (bỏ qua món, không chặn build). */
export function loadGptArt(gptReviewRoot: string, ref: string): RGBAImage | null {
	const [batch, id] = ref.split('/');
	if (!batch || !id) throw new Error(`Đường dẫn ảnh GPT không hợp lệ: ${ref}`);
	const file = join(gptReviewRoot, batch, 'chuan-hoa', `${id}.png`);
	if (!existsSync(file)) return null;
	// Ảnh chuẩn hoá cắt sát mép: đồ dẹt chạm góc ảnh → thêm lề 2 px trong suốt để qua cổng kiểm nền (sau đó bộ dựng tự cắt sát lại).
	const src = readPng(file);
	const out = createImage(src.width + 4, src.height + 4);
	blit(out, src, 2, 2);
	return out;
}

const P = (id: string) => `${GPT_ART_PREFIX}dot-12/${id}`;
const landmark = (id: string): PropDef => ({ id, path: P(id), kind: 'building', footprint: { w: 0.8, h: 64 }, blocks: true });
const decor = (id: string, w = 0.7, h = 14): PropDef => ({ id, path: P(id), kind: 'decor', footprint: { w, h }, blocks: true });
const rock = (id: string, w = 0.75, h = 16): PropDef => ({ id, path: P(id), kind: 'rock', footprint: { w, h }, blocks: true });
const flat = (id: string): PropDef => ({ id, path: P(id), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false });

/** Theo vùng: món đầu là công trình biểu tượng (đặt ở trạm), còn lại rải quanh trạm và bãi quái của mọi map trong vùng. */
export const GPT_REGION_PROPS: Record<string, PropDef[]> = {
	fungal: [landmark('nm_dai_sanh_nam'), decor('nm_cum_nam_lam', 0.6, 14), flat('nm_mang_nam_tim'), rock('nm_mang_da_nhu', 0.6, 14),
		decor('nm_den_bao_tu', 0.4, 10), flat('nm_vung_bao_tu'), rock('nm_than_nam_do', 0.8, 14), rock('nm_tinh_the_soi_nam', 0.6, 14),
		decor('nm_gian_trong_nam', 0.85, 14)],
	ruins: [landmark('ph_thap_haven_do'), decor('ph_cong_vom_vo', 0.85, 14), rock('ph_cot_rune_do', 0.85, 14), decor('ph_be_pha_le_nut', 0.6, 12),
		decor('ph_bia_co', 0.7, 12), rock('ph_bac_da_noi', 0.6, 12), decor('ph_tuong_vo_day_leo', 0.9, 16), decor('ph_dai_phun_can', 0.85, 18),
		rock('ph_dong_gach_vang', 0.85, 12)],
	void: [landmark('hk_cong_hu_khong'), rock('hk_da_troi', 0.5, 12), rock('hk_tinh_the_hu', 0.6, 14), decor('hk_cot_vo_troi', 0.6, 12),
		flat('hk_khe_nut'), decor('hk_cay_hoa_da', 0.3, 12), decor('hk_xich_neo_troi', 0.6, 12), decor('hk_lo_lua_tim', 0.7, 12),
		rock('hk_mieng_dao_vo', 0.6, 12)],
	dark: [landmark('am_thanh_duong_am'), decor('am_mo_da', 0.8, 12), decor('am_quan_tai_xich', 0.8, 12), decor('am_vac_ma', 0.8, 12),
		decor('am_den_ma', 0.4, 10), flat('am_dong_xuong_nen'), decor('am_dan_te', 0.85, 14), decor('am_tru_rune_nut', 0.6, 12),
		decor('am_bui_gai_den', 0.7, 12)],
	light: [landmark('as_den_binh_minh'), decor('as_cot_trang_vang', 0.7, 14), decor('as_dai_phun_thanh', 0.85, 18), decor('as_khung_chuong_vang', 0.85, 14),
		flat('as_be_sen'), decor('as_den_mat_troi', 0.4, 10), decor('as_cong_hoa', 0.85, 12), decor('as_bia_anh_sang', 0.6, 12),
		decor('as_ghe_da_trang', 0.85, 12)],
	wood: [landmark('ct_vong_da_co'), decor('ct_goc_cay_rong', 0.8, 14), rock('ct_nam_tai_go', 0.85, 12), decor('ct_den_dom_dom', 0.4, 10),
		rock('ct_da_reu_xep', 0.75, 14), flat('ct_suoi_da'), decor('ct_dong_cui', 0.85, 14), decor('ct_coc_go_khac', 0.5, 10),
		decor('ct_bui_qua_rung', 0.7, 12)],
};

/**
 * Gắn đồ GPT của vùng vào bộ dựng: công trình biểu tượng đứng đầu hàng nhà của trạm, đồ vật thêm vào đồ sân trạm và đồ điểm xuyết
 * quanh bãi quái mọi map. Không đổi lối, cấp, quái; chỉ thêm id (bộ dựng tự bỏ id không có trong atlas).
 */
export function withGptArt(def: KitRegionDef): KitRegionDef {
	const props = GPT_REGION_PROPS[def.region];
	if (!props) return def;
	const [mark, ...rest] = props;
	const small = rest.map((p) => p.id);
	return {
		...def,
		maps: def.maps.map((m) => ({
			...m,
			theme: { ...m.theme, landmarks: [...m.theme.landmarks, ...small] },
			hub: m.hub ? { ...m.hub, buildings: [mark!.id, ...m.hub.buildings], decor: [...m.hub.decor, ...small.filter((id) => !props.find((p) => p.id === id && p.kind === 'flower'))] } : m.hub,
		})),
	};
}
