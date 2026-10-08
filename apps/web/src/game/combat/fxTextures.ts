import { Texture } from 'pixi.js';

/**
 * Texture hiệu ứng vẽ pixel-by-pixel bằng mảng chuỗi (mỗi ký tự = một màu trong bảng). Vẽ tay
 * kiểu này giữ đúng kỷ luật pixel art (không AA, bảng màu nhỏ) mà không cần thêm asset ngoài.
 */
function sprite(rows: string[], palette: Record<string, string>): Texture {
	const h = rows.length;
	const w = Math.max(...rows.map((r) => r.length));
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d')!;
	rows.forEach((row, y) => {
		[...row].forEach((ch, x) => {
			const c = palette[ch];
			if (!c) return;
			ctx.fillStyle = c;
			ctx.fillRect(x, y, 1, 1);
		});
	});
	const t = Texture.from(canvas);
	t.source.scaleMode = 'nearest';
	return t;
}

let cache: ReturnType<typeof build> | null = null;

export function fxTextures(): ReturnType<typeof build> {
	cache ??= build();
	return cache;
}

function build() {
	const fire = sprite(
		['...rrr...', '..roooor.', '.roooyoor', 'rooyyyyor', 'royywwyor', 'rooyyyyor', '.rooyoor.', '..roooor.', '...rrr...'],
		{ r: '#b3261e', o: '#f06d1f', y: '#ffc23d', w: '#fff3c4' },
	);
	const water = sprite(
		['...b...', '..bbb..', '.bcccb.', 'bccwccb', 'bcwwccb', 'bccccdb', '.bcccb.', '..bbb..'],
		{ b: '#1f4f8f', c: '#3f8fd6', w: '#cfefff', d: '#2a6db5' },
	);
	const wind = sprite(['....gggg.....', '..ggllllgg...', '.gll....llg..', 'gl.......lg..', 'g.........g..'], { g: '#7ad1a0', l: '#d7fbe6' });
	const aether = sprite(['....v....', '...vpv...', '..vpwpv..', '.vpwwwpv.', 'vpwwwwwpv', '.vpwwwpv.', '..vpwpv..', '...vpv...', '....v....'], {
		v: '#6d4bd6',
		p: '#a98bff',
		w: '#f1ecff',
	});
	const arrow = sprite(['..........', 'ttbbbbbbhh', '..........'], { t: '#d9d2bf', b: '#7a5432', h: '#c9c9c9' });
	const shadow = sprite(['..kkk..', '.kmmmk.', 'kmmrmmk', 'kmrrrmk', 'kmmrmmk', '.kmmmk.', '..kkk..'], { k: '#1a0b22', m: '#5b1d6b', r: '#ff3b5c' });
	const slash = sprite(['......sss.', '....sswws.', '..sswwws..', '.swwwss...', 'swss......'], { s: '#9fb6c9', w: '#ffffff' });
	const heal = sprite(['..g..', '..g..', 'ggwgg', '..g..', '..g..'], { g: '#5be38a', w: '#e9ffe9' });
	const dot = (c: string): Texture => sprite(['cc', 'cc'], { c });
	return {
		fire,
		water,
		wind,
		aether,
		arrow,
		shadow,
		slash,
		heal,
		spark: {
			fire: [dot('#ffc23d'), dot('#f06d1f'), dot('#b3261e')],
			water: [dot('#cfefff'), dot('#3f8fd6')],
			wind: [dot('#d7fbe6'), dot('#7ad1a0')],
			aether: [dot('#f1ecff'), dot('#a98bff')],
			ice: [dot('#f2fdff'), dot('#9fe3ff'), dot('#5fb8e8')],
			blood: [dot('#d64545'), dot('#8f1f1f')],
			dust: [dot('#c9b38f'), dot('#8c7a5e')],
			shadow: [dot('#ff3b5c'), dot('#5b1d6b')],
			heal: [dot('#5be38a'), dot('#e9ffe9')],
		},
	};
}

export type FxTextures = ReturnType<typeof build>;
