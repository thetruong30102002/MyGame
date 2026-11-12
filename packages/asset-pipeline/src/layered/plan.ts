/**
 * Bảng kế hoạch vẽ của một mẫu nhân vật ghép lớp (`sources/layered-character/<mẫu>/plan.json`). Kiểm từng món theo chuẩn TRƯỚC khi gửi
 * PixelLab: tham số sinh ảnh khớp chuẩn, prompt lấy đúng mục của chuẩn, động tác dùng đúng template, hướng nằm trong hướng vẽ thật,
 * tổng ước tính × hệ số vẽ lại không vượt ngân sách chặng.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LayeredStandard } from './standard.js';

export const LAYERED_SOURCES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'sources', 'layered-character');

export interface PlanItem {
	id: string;
	tool: 'edit_image_pixen' | 'create_character' | 'animate_character' | 'animate_with_skeleton_v3' | 'inpaint_image_pro_flash';
	/** inpaint_image_pro_flash: ảnh mẫu kiểu dáng "<món>#<bản>" (context_image). */
	styleRef?: string;
	/** Khoá prompt trong chuẩn (prompts.<khoá>): edit_image_pixen → baseMaleEdit / baseFemaleEdit, create_character → baseMale / baseFemale. */
	prompt?: 'baseMale' | 'baseFemale' | 'baseMaleEdit' | 'baseMaleNpcEdit' | 'baseFemaleNpcEdit' | 'baseFemaleEdit' | 'headEdit' | 'headEditLong' | 'headEditFemale' | 'weaponEdit' | 'outfitEdit' | 'heroMale' | 'heroFemale' | 'slashBody' | 'slashBodyFemale' | 'tallEdit' | 'tallEditFemale' | 'femaleFromMaleEdit' | 'slimFemaleEdit' | 'petiteFemaleEdit' | 'slimLegsFemaleEdit' | 'poseBody' | 'poseBodyFemale';
	/** edit_image_pixen sửa đầu: sửa từ ảnh một món đã vẽ (bản sourcePick) thay vì ảnh mẫu phong cách. */
	sourceItem?: string;
	/** null = chủ dự án chưa chọn bản nguồn → lệnh run từ chối. */
	sourcePick?: number | null;
	/** headEdit / heroMale: điền vào {hair} / {raceFeatures} của prompt. */
	hair?: string;
	raceFeatures?: string;
	/**
	 * Bộ đồ cũ đã duyệt có mũ trùm BỎ XUỐNG sau lưng (Pháp sư "hood down flat on the back") — ngoại lệ của luật cấm áo đội mũ 06/11/2026,
	 * ghi lý do; bộ mới không được đặt cờ này.
	 */
	legacyHood?: string;
	/** outfitEdit / heroMale: điền vào {outfit} (bộ đồ, hoặc mô tả thân trần quần đùi). */
	outfit?: string;
	/** edit_image_pixen: đệm trong suốt ảnh nguồn lên cỡ này (giữa ảnh, không scale) — chỗ cho thân dài ra khi kéo tỷ lệ (tallEdit). */
	padTo?: [number, number];
	/** edit_image_pixen: ảnh mẫu phong cách nào (style.reference.male / female). */
	source?: 'male' | 'female';
	/** edit_image_pixen: mỗi seed một bản (1 lượt / bản) để chủ dự án chọn. */
	seeds?: number[];
	/** create_character: món edit_image_pixen cấp ảnh tham chiếu. */
	reference?: string;
	/** create_character: seed của bản chủ dự án đã chọn (null = chưa chọn → không chạy). */
	pick?: number | null;
	/** animate_character: món tạo nhân vật được animate. */
	character?: string;
	/** animate_character / animate_with_skeleton_v3: id clip trong chuẩn. */
	animation?: string;
	/** animate_with_skeleton_v3: tên khung xương đã dựng (`skeleton/<tên>.json` — từ bảng tư thế `<tên>.spec.json`). */
	skeleton?: string;
	/**
	 * animate_with_skeleton_v3 vẽ THEO một clip thân đã duyệt: "&lt;món nhân vật thân&gt;/&lt;clip&gt;" — khung xương đo trên từng khung của clip
	 * đó (lệnh follow) để nhân vật đầu đổi vẽ đúng tư thế, đầu cắt ra nhún / chúi / nghiêng theo thân (chủ dự án 29/10).
	 */
	follows?: string;
	/**
	 * edit_image_pixen: sửa CHÍNH ảnh xoay một hướng của nhân vật (thường là thân nền trọc) thay vì ảnh sửa trước — mọi đầu vẽ trên cùng
	 * ảnh thân / mặt / cổ của hướng đó nên cùng điểm đặt (chủ dự án 30/10: "vẽ lại thân có cổ, đầu không cổ rồi ghép cho hẳn hoi").
	 */
	sourceRotation?: { item: string; dir: string };
	/**
	 * edit_image_pixen weaponEdit: khung hình học vũ khí đeo lưng do code dựng ("&lt;đòn&gt;/&lt;góc&gt;", góc v0 / v45 / v90 — lệnh
	 * `weapon-guides`), ghi ở raw/&lt;món&gt;/guide.png; PixelLab vẽ lại giữ dáng / vị trí.
	 */
	sourceGuide?: string;
	/** weaponEdit: điền vào {weapon} của prompt. */
	weapon?: string;
	args: Record<string, unknown>;
	estimate: number;
	purpose: string;
	/** Món đã vẽ nhưng BỎ theo luật mới (lý do) — giữ nguồn, không vẽ lại, không dựng / xuất (đòn hướng S, luật 30/10). */
	dropped?: string;
}

export interface SamplePlan {
	id: string;
	standardVersion: number;
	title: string;
	/** approved: ghi khi chủ dự án duyệt cổng chặng — chặng sau chỉ được tiêu lượt khi mọi chặng trước đã duyệt. */
	stages: Record<string, { round: string; goal: string; approved?: string; items: PlanItem[] }>;
}

export const loadPlan = (sample: string): SamplePlan => JSON.parse(readFileSync(join(LAYERED_SOURCES, sample, 'plan.json'), 'utf8')) as SamplePlan;

/** Tham số gửi PixelLab của một món (prompt chèn từ chuẩn — một nguồn duy nhất, không chép tay vào plan). */
export function itemArgs(item: PlanItem, std: LayeredStandard): Record<string, unknown> {
	if (!item.prompt) return { ...item.args };
	const description = (std.prompts[item.prompt] ?? '').replace('{hair}', item.hair ?? '').replace('{raceFeatures}', item.raceFeatures ?? '').replace('{outfit}', item.outfit ?? '').replace('{weapon}', item.weapon ?? '');
	return { ...item.args, description };
}

/** Cổng duyệt: các chặng đứng trước `stageId` (theo thứ tự trong plan) chưa duyệt → trả tên chặng chặn; null = được chạy. */
export function blockingStage(plan: SamplePlan, stageId: string): string | null {
	for (const [id, stage] of Object.entries(plan.stages)) {
		if (id === stageId) return null;
		if (!stage.approved) return id;
	}
	return null;
}

/** Đồ đội đầu cấm có trong mô tả bộ đồ (luật 06/11/2026 "nghiêm cấm các loại áo đội mũ"). */
export const HEADWEAR = /\b(hood|hooded|hoodie|hat|hats|helmet|helm|cap|cowl|headband|headscarf|bandana|crown|circlet|tiara|turban|beret|veil|mask|headwear)\b/i;

/** edit_image_pixen từ chối description dài hơn mức này (lỗi thật 28/10, không tốn lượt). */
export const EDIT_DESCRIPTION_MAX = 500;

export function validatePlan(plan: SamplePlan, std: LayeredStandard, options:{renderExistingOnly?:boolean}={}): string[] {
	const errors: string[] = [];
	const fail = (m: string): void => void errors.push(m);
	if (plan.standardVersion !== std.version) fail(`plan.standardVersion ${plan.standardVersion} khác chuẩn v${std.version}`);
	const ids = new Set<string>();
	const drawn = new Set(std.directions.filter((d) => d.mirrorOf === null).map((d) => d.pixellab));
	for (const [stageId, stage] of Object.entries(plan.stages)) {
		const round = std.budget.rounds.find((r) => r.id === stage.round);
		if (!round) fail(`chặng ${stageId}: không có vòng ngân sách "${stage.round}" trong chuẩn`);
		let sum = 0;
		for (const it of stage.items) {
			const at = `${stageId}/${it.id}`;
			// NGHIÊM CẤM ÁO ĐỘI MŨ (chủ dự án 06/11/2026): đầu là lớp riêng ghép sau — bộ đồ không được có mũ trùm, mũ, mũ giáp, khăn đội…
			if (it.outfit && HEADWEAR.test(it.outfit.replace(/\bno (hood|hat|helmet|cap|headwear)s?\b/gi, '')) && !it.legacyHood)
				fail(`${at}: bộ đồ có đồ đội đầu ("${HEADWEAR.exec(it.outfit)?.[0]}") — nghiêm cấm áo đội mũ (06/11/2026)`);
			if (ids.has(it.id)) fail(`${at}: trùng id`);
			ids.add(it.id);
			if (!(it.estimate > 0)) fail(`${at}: estimate phải > 0`);
			sum += it.estimate;
			const all = Object.values(plan.stages).flatMap((s) => s.items);
			if ('description' in it.args || 'image_base64' in it.args || 'reference_image_base64' in it.args)
				fail(`${at}: không ghi description / ảnh tay trong plan — prompt lấy từ chuẩn, ảnh do lệnh chạy cấp`);
			// Xuất lại ảnh ĐÃ CÓ không gửi prompt lên API. Bản nháp đầu nữ chưa chạy không chặn rà animation;
			// lệnh run / plan vẫn kiểm đầy đủ giới hạn, không sửa hay tiêu lượt cho phần đầu đang dở.
			const needsPromptLimit=!options.renderExistingOnly||existsSync(join(LAYERED_SOURCES,plan.id,'raw',it.id));
			if (needsPromptLimit && it.tool === 'edit_image_pixen' && String(itemArgs(it, std).description ?? '').length > EDIT_DESCRIPTION_MAX)
				fail(`${at}: prompt sửa ảnh dài ${String(itemArgs(it, std).description).length} ký tự — PixelLab chỉ nhận ≤ ${EDIT_DESCRIPTION_MAX}`);
			if (it.tool === 'edit_image_pixen' && (it.prompt === 'tallEdit' || it.prompt === 'tallEditFemale')) {
				// Kéo dài thân: từ bản đã chọn của một món sửa ảnh (thân gốc trọc), đệm canvas để có chỗ cho chân / thân dài ra.
				const src = all.find((x) => x.id === it.sourceItem && x.tool === 'edit_image_pixen');
				if (!src) fail(`${at}: sourceItem phải trỏ tới một món sửa ảnh`);
				else if (it.sourcePick !== null && !src.seeds?.includes(it.sourcePick ?? NaN)) fail(`${at}: sourcePick phải là seed đã có của ${src.id} (null = chưa chọn)`);
				// Bản nam ghi "tay chân dày, vai chắc" (chủ dự án chê thân nam gầy) — thân nữ dùng bản đồng hồ cát riêng.
				const genderOfSrc = (id: string | undefined, depth = 0): 'male' | 'female' | null => {
					const x = all.find((y) => y.id === id);
					if (!x || depth > 8) return null;
					return x.source ?? genderOfSrc(x.sourceItem, depth + 1);
				};
				const want = genderOfSrc(it.sourceItem) === 'female' ? 'tallEditFemale' : 'tallEdit';
				if (it.prompt !== want) fail(`${at}: kéo dài thân ${want === 'tallEditFemale' ? 'nữ' : 'nam'} phải dùng prompt ${want}`);
				if (!it.padTo || it.padTo.some((v) => !(v > 0) || v % 4 !== 0)) fail(`${at}: tallEdit cần padTo bội 4 (chỗ cho thân dài ra)`);
				if (!it.seeds?.length || new Set(it.seeds).size !== it.seeds.length) fail(`${at}: cần seeds không trùng`);
				else if (it.estimate !== it.seeds.length) fail(`${at}: estimate phải bằng số bản (${it.seeds.length} × 1 lượt)`);
			} else if (it.tool === 'edit_image_pixen' && (it.prompt === 'headEdit' || it.prompt === 'headEditLong' || it.prompt === 'headEditFemale')) {
				// Sửa đầu: từ bản thân gốc đã chọn (giữ đúng thân / cổ / nét), hoặc từ chính ảnh xoay một hướng của thân nền (sourceRotation).
				if (it.sourceRotation) {
					if (!all.some((x) => x.id === it.sourceRotation!.item && x.tool === 'create_character')) fail(`${at}: sourceRotation.item phải là món create_character`);
					if (!std.directions.some((x) => x.pixellab === it.sourceRotation!.dir)) fail(`${at}: sourceRotation.dir "${it.sourceRotation.dir}" không có trong chuẩn`);
				} else {
					const src = all.find((x) => x.id === it.sourceItem && x.tool === 'edit_image_pixen');
					if (!src) fail(`${at}: sourceItem phải trỏ tới món sửa ảnh thân gốc`);
					else if (it.sourcePick !== null && !src.seeds?.includes(it.sourcePick ?? NaN)) fail(`${at}: sourcePick phải là seed đã có của ${src.id} (null = chủ dự án chưa chọn)`);
				}
				if (!it.hair || !it.raceFeatures) fail(`${at}: headEdit cần hair và raceFeatures`);
				// Đầu nhìn sau phải ghi rõ "BACK VIEW" (dẫm 31/10 đầu nữ đợt 1: thiếu chữ → PixelLab quay mặt ra trước ở cả 4 đầu hướng N).
				// Món đã chọn bản (vẽ trước luật mà vẫn ra nhìn sau đúng) thì thôi.
				const picked = (stage as { picks?: Record<string, unknown> }).picks?.[it.id] !== undefined;
				if (it.sourceRotation?.dir === 'north' && !picked && !/BACK VIEW/.test(it.hair ?? '')) fail(`${at}: đầu hướng N cần ghi "BACK VIEW: back of head only, no face" trong hair`);
				if (!it.seeds?.length || new Set(it.seeds).size !== it.seeds.length) fail(`${at}: cần seeds không trùng`);
				else if (it.estimate !== it.seeds.length) fail(`${at}: estimate phải bằng số bản (${it.seeds.length} × 1 lượt)`);
			} else if (it.tool === 'edit_image_pixen' && it.prompt === 'femaleFromMaleEdit') {
				// Thân nữ sửa từ thân nam tỷ lệ mới (dẫm 29/10: kéo dài thân nữ nhỏ thì PixelLab phóng cả đầu 22 → 25–27px). Giữ đúng cỡ đầu /
				// chiều cao / neo cổ của thân nam (chuẩn: hai thân cùng chiều cao, khối đầu, neo cổ). source: female đánh dấu đổi giới từ món này.
				const src = all.find((x) => x.id === it.sourceItem && x.tool === 'edit_image_pixen' && x.prompt === 'tallEdit');
				if (!src) fail(`${at}: sourceItem phải trỏ tới món kéo dài thân nam (tallEdit)`);
				else if (it.sourcePick !== null && !src.seeds?.includes(it.sourcePick ?? NaN)) fail(`${at}: sourcePick phải là seed đã có của ${src.id} (null = chưa chọn)`);
				if (it.source !== 'female') fail(`${at}: femaleFromMaleEdit cần source: "female" (đổi giới từ món này)`);
				if (!it.seeds?.length || new Set(it.seeds).size !== it.seeds.length) fail(`${at}: cần seeds không trùng`);
				else if (it.estimate !== it.seeds.length) fail(`${at}: estimate phải bằng số bản (${it.seeds.length} × 1 lượt)`);
			} else if (it.tool === 'edit_image_pixen' && it.prompt === 'slimFemaleEdit') {
				// Thân nền nữ thon (chủ dự án 31/10): sửa CHÍNH ảnh xoay một hướng của thân nền nữ (create_character) — giữ đầu / chiều cao.
				if (!it.sourceRotation || !all.some((x) => x.id === it.sourceRotation!.item && x.tool === 'create_character' && x.prompt === 'baseFemale'))
					fail(`${at}: slimFemaleEdit cần sourceRotation trỏ tới thân nền nữ (create_character, prompt baseFemale)`);
				if (it.source !== 'female') fail(`${at}: slimFemaleEdit cần source: "female"`);
				if (!it.seeds?.length || new Set(it.seeds).size !== it.seeds.length) fail(`${at}: cần seeds không trùng`);
				else if (it.estimate !== it.seeds.length) fail(`${at}: estimate phải bằng số bản (${it.seeds.length} × 1 lượt)`);
			} else if (it.tool === 'edit_image_pixen' && (it.prompt === 'petiteFemaleEdit' || it.prompt === 'slimLegsFemaleEdit')) {
				// Thân nền nữ nhỏ nhắn hơn (chủ dự án 31/10: "chân thon nữa người nhỏ nữa"): sửa tiếp từ bản thân nữ thon đã chọn.
				const src = all.find((x) => x.id === it.sourceItem && x.tool === 'edit_image_pixen' && (x.prompt === 'slimFemaleEdit' || x.prompt === 'petiteFemaleEdit' || x.prompt === 'slimLegsFemaleEdit'));
				if (!src) fail(`${at}: sourceItem phải trỏ tới món thân nữ thon (slimFemaleEdit / petiteFemaleEdit)`);
				else if (it.sourcePick !== null && !src.seeds?.includes(it.sourcePick ?? NaN)) fail(`${at}: sourcePick phải là seed đã có của ${src.id} (null = chưa chọn)`);
				if (it.source !== 'female') fail(`${at}: ${it.prompt} cần source: "female"`);
				if (!it.seeds?.length || new Set(it.seeds).size !== it.seeds.length) fail(`${at}: cần seeds không trùng`);
				else if (it.estimate !== it.seeds.length) fail(`${at}: estimate phải bằng số bản (${it.seeds.length} × 1 lượt)`);
			} else if (it.tool === 'edit_image_pixen' && it.prompt === 'weaponEdit') {
				if (!it.sourceGuide || !/^[a-z]+\/(v0|v45|v90|up|S|SE|E|NE|N|SW|W|NW)$/.test(it.sourceGuide)) fail(`${at}: weaponEdit cần sourceGuide "<đòn>/<hướng>"`);
				if (!it.weapon) fail(`${at}: weaponEdit cần weapon (mô tả vũ khí)`);
				if (!it.seeds?.length || new Set(it.seeds).size !== it.seeds.length) fail(`${at}: cần seeds không trùng`);
				else if (it.estimate !== it.seeds.length) fail(`${at}: estimate phải bằng số bản (${it.seeds.length} × 1 lượt)`);
			} else if (it.tool === 'edit_image_pixen' && it.prompt === 'outfitEdit') {
				// Sửa đồ: từ bản đầu đã chọn (nhân vật có tóc hướng S) — giữ đầu / cổ / thân, chỉ đổi quần áo; hoặc mặc đồ lên chính ảnh xoay
				// một hướng của thân nền trọc (sourceRotation — thân và mọi đầu chung một khuôn, chủ dự án 30/10).
				if (it.sourceRotation) {
					if (!all.some((x) => x.id === it.sourceRotation!.item && x.tool === 'create_character')) fail(`${at}: sourceRotation.item phải là món create_character`);
				} else {
					const src = all.find((x) => x.id === it.sourceItem && x.prompt === 'headEdit');
					if (!src) fail(`${at}: sourceItem phải trỏ tới món sửa đầu (headEdit)`);
					else if (it.sourcePick !== null && !src.seeds?.includes(it.sourcePick ?? NaN)) fail(`${at}: sourcePick phải là seed đã có của ${src.id} (null = chủ dự án chưa chọn)`);
				}
				if (!it.outfit) fail(`${at}: outfitEdit cần outfit`);
				if (!it.seeds?.length || new Set(it.seeds).size !== it.seeds.length) fail(`${at}: cần seeds không trùng`);
				else if (it.estimate !== it.seeds.length) fail(`${at}: estimate phải bằng số bản (${it.seeds.length} × 1 lượt)`);
			} else if (it.tool === 'edit_image_pixen') {
				if (it.prompt !== 'baseMaleEdit' && it.prompt !== 'baseMaleNpcEdit' && it.prompt !== 'baseFemaleNpcEdit' && it.prompt !== 'baseFemaleEdit') fail(`${at}: prompt phải baseMaleEdit / baseMaleNpcEdit / baseFemaleEdit / headEdit / outfitEdit`);
				if (it.prompt === 'baseMaleNpcEdit' && it.source !== 'male') fail(`${at}: baseMaleNpcEdit sửa ảnh NPC nam (source: "male")`);
				if (it.prompt === 'baseFemaleNpcEdit' && it.source !== 'female') fail(`${at}: baseFemaleNpcEdit sửa ảnh NPC nữ (source: "female")`);
				if (it.source !== 'male' && it.source !== 'female') fail(`${at}: source phải male / female (ảnh mẫu phong cách đã chốt)`);
				if (!it.seeds?.length || new Set(it.seeds).size !== it.seeds.length) fail(`${at}: cần seeds không trùng (mỗi seed một bản để chọn)`);
				else if (it.estimate !== it.seeds.length) fail(`${at}: estimate phải bằng số bản (${it.seeds.length} × 1 lượt)`);
			} else if (it.tool === 'inpaint_image_pro_flash') {
				// Vũ khí đeo lưng vẽ TRONG hình khung (mặt nạ) — giữ cỡ / góc; 5 lượt / ảnh 64px.
				if (!it.sourceGuide || !it.weapon || !it.styleRef || !/^U\d+-[a-z0-9]+-[A-Z]+#\d+$/.test(it.styleRef)) fail(`${at}: inpaint vũ khí cần sourceGuide, weapon, styleRef "<món ảnh mẫu>#<bản>"`);
				if (!it.seeds?.length) fail(`${at}: cần seeds`);
				else if (it.estimate !== it.seeds.length * 5) fail(`${at}: estimate phải ${it.seeds.length} × 5 lượt`);
			} else if (it.tool === 'create_character') {
				const g = std.generation;
				const want: Record<string, unknown> = { mode: g.mode, view: g.view, outline: g.outline, detail: g.detail, body_type: g.bodyType };
				for (const [k, v] of Object.entries(want)) if (it.args[k] !== v) fail(`${at}: args.${k} phải "${String(v)}" theo chuẩn, đang "${String(it.args[k])}"`);
				if ('size' in it.args) fail(`${at}: không truyền size — xoay từ ảnh tham chiếu, canvas theo ảnh tham chiếu`);
				// Prompt dẫn hướng xoay phải tả đúng ảnh tham chiếu: thân trọc → baseMale / baseFemale; có tóc (sửa đầu / sửa đồ) → heroMale.
				const refPrompt = all.find((x) => x.id === it.reference)?.prompt;
				// Giới của nhân vật: lần ngược chuỗi sửa ảnh về ảnh mẫu phong cách (source male / female) — prompt dẫn hướng xoay phải cùng giới.
				const genderOf = (id: string | undefined, depth = 0): 'male' | 'female' | null => {
					const x = all.find((y) => y.id === id);
					if (!x || depth > 8) return null;
					return x.source ?? genderOf(x.sourceItem, depth + 1);
				};
				const female = genderOf(it.reference) === 'female';
				if (refPrompt === 'headEdit' || refPrompt === 'outfitEdit') {
					const want = female ? 'heroFemale' : 'heroMale';
					if (it.prompt !== want) fail(`${at}: ảnh tham chiếu có tóc (${female ? 'nữ' : 'nam'}) — prompt phải ${want} (baseMale / baseFemale ghi "bald")`);
					if (!it.hair || !it.raceFeatures || !it.outfit) fail(`${at}: ${want} cần hair, raceFeatures, outfit`);
				} else if (it.prompt !== (female ? 'baseFemale' : 'baseMale')) fail(`${at}: cần prompt ${female ? 'baseFemale' : 'baseMale'} (dẫn hướng xoay, cùng giới ảnh tham chiếu)`);
				if (std.style.textOnlyForbidden && !all.some((x) => x.id === it.reference && x.tool === 'edit_image_pixen'))
					fail(`${at}: cấm tạo chỉ bằng chữ — cần reference trỏ tới món edit_image_pixen sửa từ ảnh mẫu phong cách`);
				const ref = all.find((x) => x.id === it.reference);
				if (ref && it.pick !== null && it.pick !== undefined && !ref.seeds?.includes(it.pick)) fail(`${at}: pick ${it.pick} không phải seed của ${ref.id}`);
			} else if (it.tool === 'animate_character') {
				const clip = std.animations.find((a) => a.id === it.animation);
				if (!clip) fail(`${at}: animation "${it.animation}" không có trong chuẩn`);
				else if (clip.source.mode === 'template') {
					// skeleton-v3 = cùng clip template đặt lên nhân vật (giữ nhận dạng) — dùng khi vẽ lại một hướng hỏng: mode template không vẽ lại
					// được cùng template / hướng đã có ("already complete").
					if ((it.args.mode !== 'template' && it.args.mode !== 'skeleton-v3') || it.args.template_animation_id !== clip.source.template)
						fail(`${at}: clip ${clip.id} phải dùng template "${clip.source.template}" (mode template hoặc skeleton-v3)`);
					if (it.args.mode === 'template' && it.args.ai_freedom !== 0) fail(`${at}: ai_freedom phải 0 — giữ đúng khung xương template cho mọi bộ đồ`);
				}
				if (!it.character || !all.some((x) => x.id === it.character && x.tool === 'create_character'))
					fail(`${at}: character phải trỏ tới một món create_character`);
				const dirs = it.args.directions;
				if (!Array.isArray(dirs) || !dirs.length) fail(`${at}: cần directions`);
				else for (const d of dirs) if (!drawn.has(String(d))) fail(`${at}: hướng "${String(d)}" không phải hướng vẽ thật (hướng tây lấy bằng lật)`);
			} else if (it.tool === 'animate_with_skeleton_v3') {
				// Đòn đánh: khung xương tự soạn (không có template), ảnh đầu là ảnh xoay đứng của nhân vật cùng hướng.
				const clip = std.animations.find((a) => a.id === it.animation);
				if (it.follows) {
					if (!clip) fail(`${at}: animation "${String(it.animation)}" không có trong chuẩn`);
				} else if (!clip || clip.source.tool !== 'animate_with_skeleton_v3') fail(`${at}: animation phải là clip vẽ bằng animate_with_skeleton_v3 trong chuẩn`);
				// Vẽ theo khung xương có thể bắt đầu từ một ẢNH SỬA (chặng Q: thân mặc đồ sửa trên ảnh xoay thân nền) thay vì nhân vật xoay.
				if (!it.character || !all.some((x) => x.id === it.character && (x.tool === 'create_character' || (it.follows && x.tool === 'edit_image_pixen'))))
					fail(`${at}: character phải trỏ tới một món create_character (hoặc món sửa ảnh khi vẽ theo khung xương)`);
				if (!drawn.has(String(it.args.direction))) fail(`${at}: direction "${String(it.args.direction)}" không phải hướng vẽ thật`);
				// Đòn đánh chỉ bắc + ngang (chủ dự án 30/10: "bỏ hướng nam đi vì nó xấu và khó vẽ"): món đòn S chỉ còn khi đã đánh dấu bỏ.
				const dirId = std.directions.find((x) => x.pixellab === it.args.direction)?.id;
				if (clip?.drawDirections && dirId && !clip.drawDirections.includes(dirId) && !it.dropped)
					fail(`${at}: đòn ${clip.id} chỉ vẽ ${clip.drawDirections.join(' / ')} (W lật từ E; đánh về nam xoay ngang) — không vẽ hướng ${dirId}`);
				if (it.args.view !== std.generation.view) fail(`${at}: view phải "${std.generation.view}" như nhân vật`);
				// Luật chân đòn hướng thẳng (31/10): bảng tư thế N / S gối "depth", thế chân đúng đòn (cận chiến lunge, đánh xa / phép upright).
				const specPath = it.skeleton && join(LAYERED_SOURCES, plan.id, 'skeleton', `${it.skeleton}.spec.json`);
				if (clip?.stance && !it.dropped && (dirId === 'N' || dirId === 'S') && specPath && existsSync(specPath)) {
					const sp = JSON.parse(readFileSync(specPath, 'utf8')) as { knees?: string; stance?: string };
					if (sp.knees !== 'depth' || sp.stance !== clip.stance)
						fail(`${at}: bảng tư thế ${it.skeleton} cần gối "depth" và stance "${clip.stance}" (luật 31/10: đòn hướng thẳng chân không chùng bè, chỉ hạ người khi bước lên)`);
				}
				// PixelLab chặn action > 100 ký tự (string_too_long — dẫm 30/10, món đâm Thương: lỗi chỉ hiện lúc gửi).
				if (String(it.args.action ?? '').length > 100) fail(`${at}: action dài ${String(it.args.action).length} ký tự — PixelLab chỉ nhận ≤ 100`);
				// Prompt thân tay không cùng giới với nhân vật (lần ngược chuỗi sửa ảnh của món tạo nhân vật).
				const genderOfItem = (id: string | undefined, depth = 0): 'male' | 'female' | null => {
					const x = all.find((y) => y.id === id);
					if (!x || depth > 8) return null;
					// Sửa trên ảnh xoay một thân nền (bộ đồ nữ một khuôn, chặng T): giới theo thân nền đó.
					return x.source ?? genderOfItem(x.sourceItem ?? x.reference ?? x.sourceRotation?.item, depth + 1);
				};
				const female = genderOfItem(it.character) === 'female';
				const want = it.follows ? (female ? 'poseBodyFemale' : 'poseBody') : female ? 'slashBodyFemale' : 'slashBody';
				if (it.prompt !== want || !it.outfit || !it.hair) fail(`${at}: cần prompt ${want} (tay không, cùng giới) với hair, outfit`);
				if (it.follows && !it.raceFeatures) fail(`${at}: ${want} cần raceFeatures`);
				const sk = it.skeleton && join(LAYERED_SOURCES, plan.id, 'skeleton', `${it.skeleton}.json`);
				if (!sk || !existsSync(sk)) fail(`${at}: chưa dựng khung xương skeleton/${String(it.skeleton)}.json`);
				else {
					const n = (JSON.parse(readFileSync(sk, 'utf8')) as { frames: unknown[] }).frames.length;
					if (clip && n !== clip.frames) fail(`${at}: khung xương ${n} khung, clip ${clip.id} cần ${clip.frames}`);
				}
				// Giá theo thời gian sinh: 3 khung = 2 lượt, 4–14 = 3, 15 = 4.
				const frames = clip?.frames ?? 0;
				const cost = frames === 3 ? 2 : frames === 15 ? 4 : 3;
				if (it.estimate !== cost) fail(`${at}: estimate phải ${cost} lượt cho ${frames} khung`);
			} else fail(`${at}: tool "${String((it as PlanItem).tool)}" chưa hỗ trợ`);
		}
		if (round && sum * std.budget.rerollFactor > round.estimate + 1e-9)
			fail(`chặng ${stageId}: ${sum} lượt × ${std.budget.rerollFactor} = ${(sum * std.budget.rerollFactor).toFixed(1)} vượt ngân sách ${round.estimate}`);
	}
	return errors;
}
