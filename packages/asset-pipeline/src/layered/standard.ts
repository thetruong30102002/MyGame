/**
 * Chuẩn nhân vật ghép lớp (thân – đầu – vũ khí vẽ bằng PixelLab): nạp `sources/layered-character/standard.json` và kiểm mọi bất biến
 * TRƯỚC khi vẽ hay build — sai chuẩn là dừng, không vẽ tiếp. Tài liệu người đọc: docs/thiet-ke/chuan-nhan-vat-ghep-lop.md.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createImage, type RGBAImage } from '../image/rgba.js';

export const LAYERED_STANDARD_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'sources', 'layered-character', 'standard.json');

export type Point = [number, number];

export type DirId = 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE' | 'E' | 'SE';

export interface DirectionDef {
	id: DirId;
	pixellab: string;
	/** Hướng lật từ hướng vẽ này (null = vẽ thật). */
	mirrorOf: DirId | null;
}

export interface LayerDef {
	id: string;
	z: number;
	owner: 'body' | 'head' | 'weapon';
	optional: boolean;
}

export interface AnimationDef {
	id: string;
	frames: number;
	loop: boolean;
	hitFrame?: number;
	durationsMs: number[];
	/** Khuôn cỡ NPC (chặng U): nhịp chậm hơn (chốt 03/11 "giảm nhịp chân"). */
	durationsMsNpc?: number[];
	/** Pha theo số thứ tự frame tính từ 1, hai đầu đều tính. */
	phases?: Record<string, [number, number]>;
	source: { tool: string; mode: string; template: string | null };
	pilot: boolean;
	/**
	 * Hướng VẼ của đòn đánh (chủ dự án 30/10: "tấn công chỉ nên có 3 hướng thôi, bắc và ngang — khi tấn công nhân vật sẽ xoay ngang nhìn
	 * sẽ đẹp nhất, bỏ hướng nam đi vì nó xấu và khó vẽ"): E, N; W lật từ E; đánh về phía nam thì xoay ngang dùng E / W.
	 */
	drawDirections?: DirId[];
	/** Thế chân đòn hướng thẳng (luật 31/10, `straightAttackRule`): "lunge" cận chiến bước lên mới hạ người, "upright" đánh xa / phép đứng thẳng. */
	stance?: 'lunge' | 'upright';
}

export interface LayeredStandard {
	id: string;
	version: number;
	status: 'draft' | 'approved';
	pixel: { ppu: number; sampling: 'point'; runtimeScale: number; allowRuntimeOffsetPerAsset: boolean; allowResample: boolean; nominalBodyHeightPx: number; clarityReference: string[] };
	generation: { tool: string; mode: string; method: 'reference' | 'text'; size: number; view: string; outline: string; detail: string; bodyType: string; mirrorDirections: boolean; drawDirections: DirId[] };
	cell: { width: number; height: number; root: Point };
	directions: DirectionDef[];
	head: { canvas: Point; neckAnchor: Point; bareNeckMaxPx: number; cheekWidthPx: number | null; cheekTolerancePx: number; animatedClips: string[] };
	body: { neckLengthPx: [number, number]; mouldNeckCut: { S: number; E: number; N: number; SE?: number; NE?: number } };
	layers: LayerDef[];
	skeleton: { format: 'COCO-18'; joints: string[] };
	animations: AnimationDef[];
	frameMeta: { required: string[]; weaponRequired: string[]; optional: string[] };
	weapon: { angles: number; rotateInCode: boolean; defaultLayer: 'front' | 'back' };
	qa: Record<string, number | boolean | number[] | string>;
	prompts: { language: string; baseMale: string; baseFemale: string; baseMaleEdit: string; baseMaleNpcEdit: string; baseFemaleNpcEdit?: string; baseFemaleEdit: string; headEdit: string; outfitEdit: string; heroMale: string; heroFemale: string; slashBody: string; slashBodyFemale: string; tallEdit: string; tallEditFemale: string; femaleFromMaleEdit: string; slimFemaleEdit: string; petiteFemaleEdit: string; slimLegsFemaleEdit: string; headEditLong: string; headEditFemale: string; weaponEdit?: string; poseBody: string; poseBodyFemale: string; forbiddenNearNeck: string[]; forbiddenWords: string[] };
	style: { reference: { male: string; female: string }; method: string; textOnlyForbidden: boolean };
	budget: { rerollFactor: number; stopIfOverEstimatePct: number; rounds: { id: string; estimate: number; scope: string; gate: string }[] };
}

const DIRECTIONS: Record<DirId, string> = {
	S: 'south', SW: 'south-west', W: 'west', NW: 'north-west', N: 'north', NE: 'north-east', E: 'east', SE: 'south-east',
};

/** Ảnh gương theo trục dọc: hướng tây ↔ đông, nam / bắc giữ nguyên. */
const MIRROR_DIR: Record<DirId, DirId> = { S: 'S', N: 'N', E: 'W', W: 'E', SE: 'SW', SW: 'SE', NE: 'NW', NW: 'NE' };

const COCO18 = ['NOSE', 'NECK', 'RIGHT SHOULDER', 'RIGHT ELBOW', 'RIGHT ARM', 'LEFT SHOULDER', 'LEFT ELBOW', 'LEFT ARM', 'RIGHT HIP', 'RIGHT KNEE', 'RIGHT LEG', 'LEFT HIP', 'LEFT KNEE', 'LEFT LEG', 'RIGHT EYE', 'LEFT EYE', 'RIGHT EAR', 'LEFT EAR'];

/** Khung PixelLab v3 / animate_with_skeleton_v3: 3–15 frame; template thì số frame cố định theo clip. */
const SKELETON_FRAMES: [number, number] = [3, 15];

const isInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n);
const inside = ([x, y]: Point, w: number, h: number): boolean => isInt(x) && isInt(y) && x >= 0 && y >= 0 && x < w && y < h;

/** Danh sách lỗi (rỗng = đạt). Mỗi lỗi một câu tiếng Việt chỉ rõ trường sai. */
export function validateLayeredStandard(s: LayeredStandard): string[] {
	const errors: string[] = [];
	const fail = (msg: string): void => void errors.push(msg);

	if (s.pixel.ppu !== 48) fail(`pixel.ppu phải 48 (cùng PPU nhân vật trong game), đang ${s.pixel.ppu}`);
	if (s.pixel.runtimeScale !== 1) fail('pixel.runtimeScale phải 1 — không phóng/co nhân vật ở runtime');
	if (s.pixel.allowRuntimeOffsetPerAsset) fail('pixel.allowRuntimeOffsetPerAsset phải false — neo bake trong PNG, không offset riêng từng asset');
	if (s.pixel.allowResample) fail('pixel.allowResample phải false — không nội suy/scale ảnh pixel');
	if (s.pixel.sampling !== 'point') fail('pixel.sampling phải point');

	if (s.generation.tool !== 'create_character' || s.generation.mode !== 'v3') fail('generation phải create_character mode v3');
	if (s.generation.method !== 'reference') fail('generation.method phải reference — cấm tạo nhân vật chỉ bằng chữ (lệch phong cách anime đã chốt)');
	if (!s.style?.textOnlyForbidden) fail('style.textOnlyForbidden phải true');
	for (const k of ['male', 'female'] as const)
		if (!/^npc_silver_youth(_f)?\/[\w]+$/.test(s.style?.reference?.[k] ?? '')) fail(`style.reference.${k} phải là khung NPC tóc trắng (npc_silver_youth…) — mẫu phong cách đã chốt`);
	if (!isInt(s.generation.size) || s.generation.size < 16 || s.generation.size > 256) fail(`generation.size ngoài 16–256: ${s.generation.size}`);

	const { width: cw, height: ch, root } = s.cell;
	if (!isInt(cw) || !isInt(ch) || cw % 2 || ch % 2) fail('cell.width/height phải số nguyên chẵn');
	if (!inside(root, cw, ch)) fail(`cell.root ${JSON.stringify(root)} nằm ngoài cell ${cw}×${ch}`);
	else {
		if (root[0] !== cw / 2) fail('cell.root phải nằm giữa bề ngang cell (vũ khí vung đều hai bên)');
		if (ch - root[1] < 8) fail('cell.root cần ≥ 8px dưới chân cho bóng / bước chân');
		if (root[1] < s.pixel.nominalBodyHeightPx + 24) fail('cell.root quá thấp: cần chỗ trên đầu cho kiếm giơ cao (≥ cao người + 24px)');
	}
	if (s.generation.size > cw || s.generation.size > ch) fail('cell nhỏ hơn canvas sinh ảnh — sẽ cắt mất hình');

	const ids = s.directions.map((d) => d.id);
	if (ids.length !== 8 || new Set(ids).size !== 8) fail('directions phải đủ 8 hướng, không trùng');
	for (const d of s.directions) if (DIRECTIONS[d.id] !== d.pixellab) fail(`directions.${d.id} phải ánh xạ PixelLab "${DIRECTIONS[d.id]}", đang "${d.pixellab}"`);
	// Lật: hướng lật phải là ảnh gương của một hướng VẼ THẬT; S / N không lật được (tự đối xứng).
	const drawn = s.directions.filter((d) => d.mirrorOf === null).map((d) => d.id);
	if (s.generation.mirrorDirections) {
		for (const d of s.directions) {
			if (d.mirrorOf === null) continue;
			if (MIRROR_DIR[d.id] !== d.mirrorOf) fail(`directions.${d.id}.mirrorOf phải "${MIRROR_DIR[d.id]}" (ảnh gương), đang "${d.mirrorOf}"`);
			else if (!drawn.includes(d.mirrorOf)) fail(`directions.${d.id} lật từ ${d.mirrorOf} nhưng ${d.mirrorOf} không phải hướng vẽ thật`);
		}
		for (const d of ['S', 'N'] as const) if (!drawn.includes(d)) fail(`hướng ${d} phải vẽ thật (không có ảnh gương)`);
	} else if (s.directions.some((d) => d.mirrorOf !== null)) fail('generation.mirrorDirections false thì không hướng nào được mirrorOf');
	if ([...s.generation.drawDirections].sort().join() !== [...drawn].sort().join())
		fail(`generation.drawDirections (${s.generation.drawDirections.join(', ')}) phải đúng các hướng vẽ thật (${drawn.join(', ')})`);

	const [hw, hh] = s.head.canvas;
	if (!isInt(hw) || !isInt(hh) || hw <= 0 || hh <= 0) fail('head.canvas phải số nguyên dương');
	else if (!inside(s.head.neckAnchor, hw, hh)) fail(`head.neckAnchor ${JSON.stringify(s.head.neckAnchor)} nằm ngoài canvas đầu`);
	else {
		if (s.head.neckAnchor[0] !== hw / 2) fail('head.neckAnchor phải nằm giữa bề ngang canvas đầu');
		if (hh - 1 - s.head.neckAnchor[1] < s.head.bareNeckMaxPx) fail('head.canvas không đủ chỗ dưới neo cho cổ da bareNeckMaxPx');
	}
	if (!isInt(s.head.bareNeckMaxPx) || s.head.bareNeckMaxPx < 0 || s.head.bareNeckMaxPx > 3) fail('head.bareNeckMaxPx phải 0–3');
	if (s.head.cheekWidthPx !== null && (!isInt(s.head.cheekWidthPx) || s.head.cheekWidthPx <= 0)) fail('head.cheekWidthPx phải null (chưa đo) hoặc số nguyên dương');
	if (s.status === 'approved' && s.head.cheekWidthPx === null) fail('chuẩn đã duyệt phải có head.cheekWidthPx đo từ thân gốc');

	const layerIds = s.layers.map((l) => l.id);
	if (new Set(layerIds).size !== layerIds.length) fail('layers có id trùng');
	const zs = s.layers.map((l) => l.z);
	if (zs.some((z, i) => i > 0 && z <= zs[i - 1]!)) fail('layers phải xếp z tăng dần, không trùng');
	for (const must of ['body', 'head']) {
		const l = s.layers.find((x) => x.id === must);
		if (!l) fail(`layers thiếu lớp bắt buộc "${must}"`);
		else if (l.optional) fail(`lớp "${must}" không được optional`);
	}
	const z = (id: string): number => s.layers.find((l) => l.id === id)?.z ?? NaN;
	if (!(z('head') > z('body'))) fail('lớp head phải nằm trên body');
	if (!(z('bodyFront') > z('head'))) fail('lớp bodyFront (tay/cổ áo che đầu) phải nằm trên head');
	if (!(z('hairBack') < z('body'))) fail('lớp hairBack phải nằm dưới body');

	if (s.skeleton.format !== 'COCO-18' || s.skeleton.joints.length !== COCO18.length || COCO18.some((j) => !s.skeleton.joints.includes(j)))
		fail('skeleton.joints phải đủ 18 khớp COCO-18 đúng nhãn PixelLab');

	const animIds = new Set<string>();
	for (const a of s.animations) {
		const at = `animations.${a.id}`;
		if (animIds.has(a.id)) fail(`${at} trùng id`);
		animIds.add(a.id);
		if (!isInt(a.frames) || a.frames < 1) fail(`${at}.frames phải số nguyên dương`);
		if (a.durationsMs.length !== a.frames) fail(`${at}.durationsMs có ${a.durationsMs.length} giá trị, cần ${a.frames}`);
		if (a.durationsMs.some((d) => !isInt(d) || d < 16 || d > 1000)) fail(`${at}.durationsMs mỗi frame phải 16–1000ms`);
		if (a.durationsMsNpc && (a.durationsMsNpc.length !== a.frames || a.durationsMsNpc.some((d) => !isInt(d) || d < 16 || d > 1000))) fail(`${at}.durationsMsNpc cần ${a.frames} giá trị 16–1000ms`);
		if (a.source.tool === 'animate_with_skeleton_v3' && (a.frames < SKELETON_FRAMES[0] || a.frames > SKELETON_FRAMES[1]))
			fail(`${at}: animate_with_skeleton_v3 chỉ nhận ${SKELETON_FRAMES[0]}–${SKELETON_FRAMES[1]} frame`);
		if (a.source.mode === 'template' && !a.source.template) fail(`${at}: mode template cần tên template`);
		if (a.hitFrame !== undefined && (!isInt(a.hitFrame) || a.hitFrame < 1 || a.hitFrame > a.frames)) fail(`${at}.hitFrame ngoài 1–${a.frames}`);
		// Đòn đánh chỉ N + ngang (luật 30/10): có khung chạm thì phải khai hướng vẽ, không có S.
		if (a.hitFrame !== undefined && (!a.drawDirections || a.drawDirections.includes('S') || !a.drawDirections.includes('E') || !a.drawDirections.includes('N')))
			fail(`${at}.drawDirections phải là ["E", "N"] — đòn đánh chỉ bắc và ngang (W lật từ E), đánh về nam xoay ngang`);
		if (a.hitFrame !== undefined && a.stance !== 'lunge' && a.stance !== 'upright')
			fail(`${at}.stance phải "lunge" (cận chiến) hoặc "upright" (đánh xa / phép) — luật chân đòn hướng thẳng 31/10`);
		if (a.phases) {
			const ranges = Object.values(a.phases).sort((p, q) => p[0] - q[0]);
			let next = 1;
			for (const [from, to] of ranges) {
				if (from !== next || to < from) fail(`${at}.phases phải nối liền, không hở/chồng (lỗi ở frame ${from})`);
				next = to + 1;
			}
			if (next !== a.frames + 1) fail(`${at}.phases phải phủ đủ ${a.frames} frame`);
			if (a.hitFrame !== undefined && a.phases.impact && (a.hitFrame < a.phases.impact[0] || a.hitFrame > a.phases.impact[1]))
				fail(`${at}.hitFrame phải nằm trong pha impact`);
			// Nhịp chém: lấy lực chậm → ra đòn nhanh nhất gần lúc chạm.
			const avg = (r?: [number, number]): number => (r ? a.durationsMs.slice(r[0] - 1, r[1]).reduce((n, d) => n + d, 0) / (r[1] - r[0] + 1) : NaN);
			if (a.phases.windup && a.phases.impact && !(avg(a.phases.windup) > avg(a.phases.impact) * 1.5))
				fail(`${at}: pha windup phải chậm rõ hơn impact (trung bình ≥ 1,5 lần)`);
		}
	}
	for (const must of ['walk', 'slash']) if (!s.animations.some((a) => a.id === must && a.pilot)) fail(`animations thiếu "${must}" cho vòng thử`);
	// Đầu có khung riêng: clip phải dùng template (cùng khung xương cho thân và nhân vật "thân gốc + tóc") để đầu khung i khớp cổ thân khung i.
	for (const id of s.head.animatedClips ?? []) {
		const a = s.animations.find((x) => x.id === id);
		if (!a) fail(`head.animatedClips có "${id}" nhưng không có clip này`);
		else if (a.source.mode !== 'template' || !a.source.template) fail(`head.animatedClips "${id}" phải là clip template — đầu và thân cần cùng khung xương`);
	}
	if (!(s.head.animatedClips ?? []).includes('run')) fail('head.animatedClips phải có "run" — chạy cần khung đầu riêng');

	for (const f of ['neck', 'headFacing', 'headFrame', 'durationMs']) if (!s.frameMeta.required.includes(f)) fail(`frameMeta.required thiếu "${f}"`);
	for (const f of ['grip', 'weaponAngleDeg', 'weaponLayer']) if (!s.frameMeta.weaponRequired.includes(f)) fail(`frameMeta.weaponRequired thiếu "${f}"`);

	if (s.weapon.rotateInCode) fail('weapon.rotateInCode phải false — góc vũ khí vẽ sẵn, không xoay ảnh pixel bằng code');
	if (!isInt(s.weapon.angles) || s.weapon.angles < 8) fail('weapon.angles phải ≥ 8');
	if (s.weapon.defaultLayer !== 'front') fail('weapon.defaultLayer phải front — chủ dự án muốn vũ khí luôn hiện phía trước');

	if (s.qa.headRemovedAbovePx !== 0) fail('qa.headRemovedAbovePx phải 0 — thân không được còn pixel đầu cũ');
	if (s.qa.neckSeamHolesMax !== 0) fail('qa.neckSeamHolesMax phải 0 — không hở cổ');
	if (s.qa.sourcePixelsOnly !== true) fail('qa.sourcePixelsOnly phải true — mọi pixel xuất ra phải có trong ảnh nguồn');
	if (s.qa.headForeignColorPxMax !== 0) fail('qa.headForeignColorPxMax phải 0 — lớp đầu không được dính áo');
	const p = s.prompts;
	if (!p || p.language !== 'en' || !p.baseMale || !p.headEdit) fail('prompts cần baseMale, headEdit bằng tiếng Anh');
	else {
		for (const [key, text] of [['baseMale', p.baseMale], ['baseFemale', p.baseFemale], ['baseMaleEdit', p.baseMaleEdit], ['baseMaleNpcEdit', p.baseMaleNpcEdit ?? ''], ['baseFemaleNpcEdit', p.baseFemaleNpcEdit ?? ''], ['baseFemaleEdit', p.baseFemaleEdit]] as const) {
			if (!/bald/i.test(text)) fail(`prompts.${key} phải ghi đầu trọc (bald) để cắt đầu không sót tóc`);
			if (!/no collar/i.test(text) || !/no scarf/i.test(text) || !/no hood/i.test(text)) fail(`prompts.${key} phải cấm collar / scarf / hood quanh cổ`);
		}
		for (const [key, text] of [['baseMale', p.baseMale], ['baseFemale', p.baseFemale], ['baseMaleEdit', p.baseMaleEdit], ['baseMaleNpcEdit', p.baseMaleNpcEdit ?? ''], ['baseFemaleEdit', p.baseFemaleEdit], ['headEdit', p.headEdit], ['outfitEdit', p.outfitEdit], ['heroMale', p.heroMale], ['heroFemale', p.heroFemale ?? ''], ['tallEdit', p.tallEdit ?? ''], ['tallEditFemale', p.tallEditFemale ?? ''], ['femaleFromMaleEdit', p.femaleFromMaleEdit ?? '']] as const) {
			const bad = (p.forbiddenWords ?? []).find((w) => text.toLowerCase().includes(w.toLowerCase()));
			if (bad) fail(`prompts.${key} có cụm cấm "${bad}" — dễ làm cổ dài`);
		}
		if (!['long neck', 'slender neck', 'neck clearly visible'].every((w) => (p.forbiddenWords ?? []).includes(w))) fail('prompts.forbiddenWords phải cấm long neck / slender neck / neck clearly visible');
		for (const [key, text] of [['baseMale', p.baseMale], ['baseFemale', p.baseFemale], ['baseMaleEdit', p.baseMaleEdit], ['baseMaleNpcEdit', p.baseMaleNpcEdit ?? ''], ['baseFemaleNpcEdit', p.baseFemaleNpcEdit ?? ''], ['baseFemaleEdit', p.baseFemaleEdit]] as const) {
			if (!/short neck/i.test(text)) fail(`prompts.${key} phải ghi short neck — cổ không được dài`);
			if (key.endsWith('Edit') && !/same anime face/i.test(text)) fail(`prompts.${key} phải giữ nguyên mặt anime / nét của ảnh mẫu`);
		}
		if (!/shorts/i.test(p.baseMale) || !/shorts/i.test(p.baseMaleEdit) || !/shorts/i.test(p.baseMaleNpcEdit ?? '')) fail('prompts nam phải mặc quần đùi (shorts) — chủ dự án 28/10');
		// Thân cỡ NPC (04/11): vẽ lại khỏe hơn bộ gầy cũ (chốt 03/11), mắt nâu như mọi đầu.
		if (!/brown eyes/i.test(p.baseMaleNpcEdit ?? '') || !/not skinny/i.test(p.baseMaleNpcEdit ?? '') || !/same anime face/i.test(p.baseMaleNpcEdit ?? ''))
			fail('prompts.baseMaleNpcEdit phải ghi brown eyes, not skinny, same anime face');
		for (const [key, text] of [['baseFemale', p.baseFemale], ['baseFemaleEdit', p.baseFemaleEdit], ['baseFemaleNpcEdit', p.baseFemaleNpcEdit ?? 'bikini no halter straps over the shoulders non-sexualized adult']] as const) {
			if (!/bikini/i.test(text)) fail(`prompts.${key} phải mặc bikini — chủ dự án 28/10`);
			if (!/no halter/i.test(text) || !/straps over the shoulders/i.test(text)) fail(`prompts.${key} phải quai qua vai và cấm halter (dây buộc quanh cổ dính vào cổ khi cắt đầu)`);
			if (!/non-sexualized/i.test(text) || !/adult/i.test(text)) fail(`prompts.${key} phải ghi người lớn, không gợi dục`);
		}
		if (!/brown eyes/i.test(p.headEdit)) fail('prompts.headEdit phải ghi brown eyes — mọi đầu mắt nâu (chủ dự án 28/10)');
		// Sửa đồ / xoay nhân vật có tóc: giữ đầu, cổ ngắn, cổ áo thấp — cắt đầu theo đường cổ không dính áo.
		if (!/ONLY the clothes/.test(p.outfitEdit ?? '') || !p.outfitEdit.includes('{outfit}')) fail('prompts.outfitEdit phải chỉ đổi quần áo và có {outfit}');
		// Thân đòn đánh vẽ TAY KHÔNG: vũ khí là lớp riêng ghép theo điểm nắm — thân có kiếm thì không tách được, chỗ kiếm che thành lỗ.
		for (const [key, text] of [['slashBody', p.slashBody ?? ''], ['slashBodyFemale', p.slashBodyFemale ?? '']] as const)
			if (!text.includes('{outfit}') || !/no weapon/i.test(text) || !/no sword/i.test(text) || !/short neck/i.test(text)) fail(`prompts.${key} phải có {outfit}, no weapon, no sword, short neck`);
		// Kéo dài thân (chủ dự án 29/10: "trẻ con quá… cảm giác người hơi lùn" → giữ đầu, thân ~4 đầu): chỉ đổi tỷ lệ thân, giữ đầu / mặt / đồ.
		if (!/same head and head size/i.test(p.tallEdit ?? '') || !/four heads tall/i.test(p.tallEdit ?? '') || !/same anime face/i.test(p.tallEdit ?? '') || !/short neck/i.test(p.tallEdit ?? ''))
			fail('prompts.tallEdit phải giữ đầu + cỡ đầu + mặt anime, ghi four heads tall và short neck');
		if (!/same head size/i.test(p.femaleFromMaleEdit ?? '') || !/same height/i.test(p.femaleFromMaleEdit ?? '') || !/bald/i.test(p.femaleFromMaleEdit ?? '') || !/non-sexualized/i.test(p.femaleFromMaleEdit ?? '') || !/short neck/i.test(p.femaleFromMaleEdit ?? ''))
			fail('prompts.femaleFromMaleEdit phải giữ same head size + same height, đầu trọc (bald), non-sexualized, short neck');
		// Thân nữ thon (chủ dự án 31/10: "nữ thon thả đồng hồ cát chân thon"): sửa trên ảnh xoay thân nền nữ, giữ đầu trọc / cỡ đầu / chiều cao.
		if (p.slimFemaleEdit !== undefined && (!/same head size/i.test(p.slimFemaleEdit) || !/same height/i.test(p.slimFemaleEdit) || !/bald/i.test(p.slimFemaleEdit) || !/non-sexualized/i.test(p.slimFemaleEdit) || !/short neck/i.test(p.slimFemaleEdit) || !/hourglass/i.test(p.slimFemaleEdit) || !/slim thighs/i.test(p.slimFemaleEdit)))
			fail('prompts.slimFemaleEdit phải giữ same head size + same height, đầu trọc (bald), hourglass, slim thighs, non-sexualized, short neck');
		// Nhỏ nhắn hơn nữa (chủ dự án 31/10: "chân thon nữa người nhỏ nữa"): sửa tiếp từ bản thon đã chọn.
		if (!/same head size/i.test(p.petiteFemaleEdit ?? '') || !/bald/i.test(p.petiteFemaleEdit ?? '') || !/petite/i.test(p.petiteFemaleEdit ?? '') || !/very slim thighs/i.test(p.petiteFemaleEdit ?? '') || !/non-sexualized/i.test(p.petiteFemaleEdit ?? '') || !/short neck/i.test(p.petiteFemaleEdit ?? ''))
			fail('prompts.petiteFemaleEdit phải giữ same head size, đầu trọc (bald), petite, very slim thighs, non-sexualized, short neck');
		// Đầu nữ tóc dài (chủ dự án 31/10 chọn "cho phép tóc dài"): tóc buông SAU vai xuống lưng, cổ trước / mặt / ngực vẫn lộ — chỗ nối cổ như đầu ngắn.
		if (!/head size/i.test(p.headEditLong ?? '') || !/behind the shoulders/i.test(p.headEditLong ?? '') || !/front of the neck/i.test(p.headEditLong ?? '') || !/\{hair\}/.test(p.headEditLong ?? ''))
			fail('prompts.headEditLong phải giữ head size, tóc buông behind the shoulders, front of the neck lộ, có {hair}');
		// Đầu nữ tóc ngắn trên thân nền nữ (bikini — mẫu headEdit ghi "shorts" của thân nam): tóc trên vai, không chạm cổ / vai.
		if (!/head size/i.test(p.headEditFemale ?? '') || !/bikini/i.test(p.headEditFemale ?? '') || !/does not touch the neck/i.test(p.headEditFemale ?? '') || !/\{hair\}/.test(p.headEditFemale ?? ''))
			fail('prompts.headEditFemale phải giữ head size, bikini, tóc không chạm cổ / vai, có {hair}');
		// Chỉ làm thon chân (chủ dự án 31/10: "đùi vẫn hơi to" — sửa cả người thì đường viền hông / đùi không đổi).
		if (!/same head size/i.test(p.slimLegsFemaleEdit ?? '') || !/bald/i.test(p.slimLegsFemaleEdit ?? '') || !/slim thighs/i.test(p.slimLegsFemaleEdit ?? '') || !/above the hips unchanged/i.test(p.slimLegsFemaleEdit ?? '') || !/non-sexualized/i.test(p.slimLegsFemaleEdit ?? ''))
			fail('prompts.slimLegsFemaleEdit phải giữ same head size, đầu trọc (bald), slim thighs, giữ nguyên phần trên hông, non-sexualized');
		if (!/same head and head size/i.test(p.tallEditFemale ?? '') || !/four heads tall/i.test(p.tallEditFemale ?? '') || !/same anime face/i.test(p.tallEditFemale ?? '') || !/short neck/i.test(p.tallEditFemale ?? '') || !/hourglass/i.test(p.tallEditFemale ?? ''))
			fail('prompts.tallEditFemale phải giữ đầu + cỡ đầu + mặt anime, ghi four heads tall, hourglass và short neck');
		if (!/female/i.test(p.slashBodyFemale ?? '') || !/non-sexualized/i.test(p.slashBodyFemale ?? '')) fail('prompts.slashBodyFemale phải ghi female, non-sexualized');
		// Vẽ lại một nhân vật (đầu đổi) theo tư thế từng khung của clip thân đã duyệt — đầu cắt ra mới nhún / chúi / nghiêng theo thân.
		for (const [key, text] of [['poseBody', p.poseBody ?? ''], ['poseBodyFemale', p.poseBodyFemale ?? '']] as const)
			if (!text.includes('{hair}') || !text.includes('{raceFeatures}') || !text.includes('{outfit}') || !/follow the given pose/i.test(text) || !/short neck/i.test(text) || !/no weapon/i.test(text))
				fail(`prompts.${key} phải có {hair} {raceFeatures} {outfit}, follow the given pose, short neck, no weapon`);
		if (!/female/i.test(p.poseBodyFemale ?? '') || !/non-sexualized/i.test(p.poseBodyFemale ?? '')) fail('prompts.poseBodyFemale phải ghi female, non-sexualized');
		for (const [key, text] of [['outfitEdit', p.outfitEdit ?? ''], ['heroMale', p.heroMale ?? ''], ['heroFemale', p.heroFemale ?? '']] as const) {
			if (!/no collar/i.test(text) || !/no scarf/i.test(text) || !/no hood/i.test(text)) fail(`prompts.${key} phải cấm collar / scarf / hood quanh cổ`);
			if (!/short neck/i.test(text)) fail(`prompts.${key} phải ghi short neck — cổ không được dài`);
			if (!/brown eyes/i.test(text)) fail(`prompts.${key} phải giữ mắt nâu`);
			if (!/weapon/i.test(text)) fail(`prompts.${key} phải cấm vẽ vũ khí (vũ khí là lớp riêng)`);
		}
		if (!/below the neck/i.test(p.outfitEdit ?? '') || !/same anime face/i.test(p.outfitEdit ?? '')) fail('prompts.outfitEdit phải giữ cổ áo dưới cổ và giữ nguyên mặt anime');
		for (const [key, text] of [['heroMale', p.heroMale ?? ''], ['heroFemale', p.heroFemale ?? '']] as const)
			if (/bald/i.test(text) || !['{hair}', '{raceFeatures}', '{outfit}'].every((k) => text.includes(k)))
				fail(`prompts.${key} (xoay nhân vật có tóc) không được ghi bald, phải có {hair} / {raceFeatures} / {outfit}`);
		if (!/female/i.test(p.heroFemale ?? '') || !/non-sexualized/i.test(p.heroFemale ?? '') || !/adult/i.test(p.heroFemale ?? ''))
			fail('prompts.heroFemale phải ghi female, adult, non-sexualized');
		if (!/ONLY the head/.test(p.headEdit) || !/no[t]? (add )?any clothing|Do not add any clothing/i.test(p.headEdit)) fail('prompts.headEdit phải chỉ đổi phần đầu và cấm thêm quần áo');
	}

	// Thân giữ cổ, không giữ hàm (chủ dự án 30/10): cắt cổ thân từ neo + n hàng; đầu lấp bằng cổ của chính nó tới chỗ cắt + 2 hàng chồng mép —
	// phải nằm trong canvas đầu dưới neo.
	for (const dir of ['S', 'E', 'N'] as const) {
		const n = s.body.mouldNeckCut?.[dir];
		if (!isInt(n) || n < 0 || n + 2 > s.head.canvas[1] - 1 - s.head.neckAnchor[1]) fail(`body.mouldNeckCut.${dir} phải nguyên ≥ 0 và cổ của đầu (cắt + 2 hàng) nằm trong canvas đầu`);
	}
	const [nMin, nMax] = s.body.neckLengthPx ?? [];
	if (!isInt(nMin) || !isInt(nMax) || nMin < 1 || nMax < nMin || nMax > 6) fail('body.neckLengthPx phải [min, max] nguyên, 1 ≤ min ≤ max ≤ 6 — cổ dài trông xấu');
	if (!(s.budget.rerollFactor >= 1)) fail('budget.rerollFactor phải ≥ 1');
	if (!(s.budget.stopIfOverEstimatePct > 0 && s.budget.stopIfOverEstimatePct <= 50)) fail('budget.stopIfOverEstimatePct phải 1–50');
	if (!s.budget.rounds.length || s.budget.rounds.some((r) => !(r.estimate > 0) || !r.gate)) fail('budget.rounds mỗi vòng cần estimate > 0 và cổng duyệt');

	return errors;
}

/** Nạp + kiểm; sai thì ném lỗi liệt kê đủ các trường sai (không chạy tiếp với chuẩn hỏng). */
export function loadLayeredStandard(path = LAYERED_STANDARD_PATH): LayeredStandard {
	const s = JSON.parse(readFileSync(path, 'utf8')) as LayeredStandard;
	const errors = validateLayeredStandard(s);
	if (errors.length) throw new Error(`Chuẩn nhân vật ghép lớp sai (${path}):\n- ${errors.join('\n- ')}`);
	return s;
}

/** Tổng thời lượng một clip (ms). */
export const clipDurationMs = (a: AnimationDef): number => a.durationsMs.reduce((n, d) => n + d, 0);

/** Frame (tính từ 1) đang hiện ở thời điểm t ms của clip — dùng chung cho xem thử và runtime. */
export function frameAt(a: AnimationDef, t: number): number {
	const total = clipDurationMs(a);
	let x = a.loop ? ((t % total) + total) % total : Math.min(Math.max(t, 0), total - 1);
	for (let i = 0; i < a.frames; i += 1) {
		x -= a.durationsMs[i]!;
		if (x < 0) return i + 1;
	}
	return a.frames;
}

// ---- Lật hướng (dùng chung pipeline và test; Unity lật bằng flipX với pivot ở tâm cột root) ----

export const mirrorDir = (d: DirId): DirId => MIRROR_DIR[d];

/** Lật hoành độ quanh tâm cột `axis`: cột axis giữ nguyên, x' = 2·axis − x. */
export const mirrorX = (x: number, axis: number): number => 2 * axis - x;

export interface Keypoint {
	label: string;
	x: number;
	y: number;
	z_index?: number;
}

/** Lật khung xương toạ độ tỉ lệ 0–1 (PixelLab): x' = 1 − x, đổi nhãn LEFT ↔ RIGHT (bên của chính nhân vật). */
export function mirrorKeypoints(kps: Keypoint[]): Keypoint[] {
	return kps.map((k) => ({
		...k,
		x: 1 - k.x,
		label: k.label.startsWith('LEFT ') ? 'RIGHT ' + k.label.slice(5) : k.label.startsWith('RIGHT ') ? 'LEFT ' + k.label.slice(6) : k.label,
	}));
}

/**
 * Lật ảnh quanh tâm cột `axis`, giữ nguyên từng pixel (không nội suy). Pixel nào lật ra ngoài ô thì báo lỗi thay vì cắt im lặng —
 * với cell 128 / root 64 nghĩa là cột 0 phải trong suốt.
 */
export function mirrorImage(img: RGBAImage, axis: number): RGBAImage {
	const out = createImage(img.width, img.height);
	for (let y = 0; y < img.height; y += 1)
		for (let x = 0; x < img.width; x += 1) {
			const i = (y * img.width + x) * 4;
			if (img.data[i + 3] === 0) continue;
			const nx = mirrorX(x, axis);
			if (nx < 0 || nx >= img.width) throw new Error(`Pixel (${x},${y}) lật ra ngoài ô (x'=${nx}) — cột này phải trong suốt`);
			out.data.set(img.data.subarray(i, i + 4), (y * img.width + nx) * 4);
		}
	return out;
}
