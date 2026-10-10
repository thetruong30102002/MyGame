'use client';

import { ACTION_ANIMS } from '@aether/protocol';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { AnimationName } from '@/game/assets/AssetManifest';
import { heldActionBase } from '@/game/gearArt';

type Background = 'night' | 'grass' | 'parchment';

const BACKGROUNDS: Record<Background, { label: string; color: number }> = {
	night: { label: 'Tối', color: 0x121722 },
	grass: { label: 'Cỏ', color: 0x34522f },
	parchment: { label: 'Sáng', color: 0xd9d2bf },
};

interface QualityCheck {
	id: string;
	label: string;
	status: 'pass' | 'fail' | 'manual';
	detail: string;
}

/**
 * Phòng duyệt nhân vật: 8 hướng × 3 mức zoom nguyên (1×/2×/3×), vẽ bằng ĐÚNG đường render của game
 * (Pixi, nearest, pixel thiết bị) — duyệt ở đây là duyệt thứ người chơi sẽ thấy, không phải PNG.
 */
export function CharacterLab() {
	const host = useRef<HTMLDivElement>(null);
	const [characterId, setCharacterId] = useState('player_lior_child');
	const [roster, setRoster] = useState<{ id: string; name: string; role: string }[]>([]);
	const [anim, setAnim] = useState('idle');
	const [bg, setBg] = useState<Background>('night');
	const [checks, setChecks] = useState<QualityCheck[]>([]);
	const [meta, setMeta] = useState<{ displayName: string; identity: Record<string, string>; source: { provider: string; ref: string }; animations: Record<string, unknown> } | null>(null);
	// Nút theo đúng animation atlas đang có: thêm động tác (attack, cast, động tác skill…) vào atlas là hiện nút duyệt, không sửa code.
	const anims = meta ? Object.keys(meta.animations) : ['idle'];
	const shown = anims.includes(anim) ? anim : 'idle';

	// Mở thẳng một nhân vật / động tác bằng URL (chụp duyệt không cần bấm): `/lab?id=player_hero_adult&anim=walksword&bg=grass`.
	useEffect(() => {
		const q = new URLSearchParams(location.search);
		const id = q.get('id');
		const a = q.get('anim');
		const b = q.get('bg');
		if (id) setCharacterId(id);
		if (a) setAnim(a);
		if (b && b in BACKGROUNDS) setBg(b as Background);
	}, []);

	useEffect(() => {
		// Đổi nhân vật nhanh (mở bằng URL: mặc định → id trên URL) thì bỏ kết quả về muộn của nhân vật trước.
		let alive = true;
		fetch(`/assets/characters/${characterId}/quality.json`)
			.then((r) => (r.ok ? r.json() : null))
			.then((q) => alive && setChecks(q?.checks ?? []))
			.catch(() => alive && setChecks([]));
		fetch('/assets/manifest.json', { cache: 'no-cache' })
			.then((r) => r.json())
			.then((m) => {
				if (!alive) return;
				setMeta(m.characters[characterId] ?? null);
				setRoster(
					Object.entries(m.characters as Record<string, { displayName: string; role: string }>).map(([id, c]) => ({ id, name: c.displayName, role: c.role })),
				);
			})
			.catch(() => alive && setMeta(null));
		return () => {
			alive = false;
		};
	}, [characterId]);

	useEffect(() => {
		let disposed = false;
		let cleanup: (() => void) | undefined;
		(async () => {
			const [{ AnimatedSprite, Container, Text }, { createPixelApp }, { loadCharacter, DIRECTIONS }] = await Promise.all([
				import('pixi.js'),
				import('@/game/core/pixelApp'),
				import('@/game/assets/AssetManifest'),
			]);
			const el = host.current!;
			const app = await createPixelApp(el);
			const tex = await loadCharacter(characterId);
			if (disposed) return app.destroy(true);
			app.renderer.background.color = BACKGROUNDS[bg].color;

			const dpr = window.devicePixelRatio || 1;
			const { width: fw, height: fh } = tex.entry.frameSize;
			const gap = Math.round(12 * dpr);
			const label = Math.round(22 * dpr);
			const root = new Container();
			let y = gap;
			let maxW = 0;
			for (const zoom of [1, 2, 3]) {
				const z = Math.max(1, Math.round(zoom * dpr));
				const title = new Text({ text: `${zoom}× (${z} px thiết bị / texel)`, style: { fill: bg === 'parchment' ? 0x333333 : 0x9aa4bf, fontSize: Math.round(12 * dpr), fontFamily: 'monospace' } });
				title.position.set(gap, y);
				root.addChild(title);
				y += label;
				DIRECTIONS.forEach((dir, i) => {
					// Động tác một lần (kể cả bản cầm vũ khí `hitsword`…) chỉ hiện ở hướng đã vẽ (hướng trống = game dùng phương án dự phòng).
					const once = (ACTION_ANIMS as readonly string[]).includes(shown) || heldActionBase(shown) !== null;
					const frames = once ? tex.actionFrames(shown as AnimationName, dir) : tex.frames(shown as AnimationName, dir);
					if (!frames) return;
					const s = new AnimatedSprite(frames);
					s.anchor.set(0, 0);
					s.scale.set(z);
					s.animationSpeed = (tex.entry.animations[shown as AnimationName]?.fps ?? 8) / 60;
					s.position.set(gap + i * (fw * z + gap), y);
					s.play();
					const name = new Text({ text: dir, style: { fill: 0xe9c46a, fontSize: Math.round(11 * dpr), fontFamily: 'monospace' } });
					name.position.set(s.x + 4, y + 4);
					root.addChild(s, name);
					maxW = Math.max(maxW, s.x + fw * z + gap);
				});
				y += fh * z + gap;
			}
			app.stage.addChild(root);
			app.renderer.resize(maxW, y);
			app.canvas.style.width = `${maxW / dpr}px`;
			app.canvas.style.height = `${y / dpr}px`;
			cleanup = () => app.destroy(true, { children: true });
		})();
		return () => {
			disposed = true;
			cleanup?.();
		};
	}, [characterId, shown, bg]);

	return (
		<main className="h-dvh overflow-auto">
			<header className="sticky left-0 top-0 z-10 flex flex-wrap items-center gap-3 border-b border-panel-edge bg-panel/95 px-4 py-3 backdrop-blur">
				<Link href="/" className="text-sm text-arcane hover:underline">
					← Vào game
				</Link>
				<h1 className="font-display text-lg text-gold">Character Lab</h1>
				<select
					value={characterId}
					onChange={(e) => setCharacterId(e.target.value)}
					className="rounded-md border border-panel-edge bg-ink px-2 py-1 text-xs text-slate-200"
				>
					{roster.map((r) => (
						<option key={r.id} value={r.id}>
							[{r.role}] {r.name}
						</option>
					))}
				</select>
				<span className="font-mono text-xs text-slate-400">
					{characterId}
					{meta ? ` · ${meta.displayName} · nguồn ${meta.source.provider}:${meta.source.ref}` : ''}
				</span>
				<div className="ml-auto flex flex-wrap gap-2 text-xs">
					{anims.map((a) => (
						<button key={a} type="button" onClick={() => setAnim(a)} className={`rounded-md border px-3 py-1 ${shown === a ? 'border-gold text-gold' : 'border-panel-edge text-slate-300'}`}>
							{a}
						</button>
					))}
					<span className="mx-1 w-px bg-panel-edge" />
					{(Object.keys(BACKGROUNDS) as Background[]).map((b) => (
						<button key={b} type="button" onClick={() => setBg(b)} className={`rounded-md border px-3 py-1 ${bg === b ? 'border-gold text-gold' : 'border-panel-edge text-slate-300'}`}>
							{BACKGROUNDS[b].label}
						</button>
					))}
				</div>
			</header>

			{meta && (
				<section className="flex flex-wrap gap-2 px-4 pt-3 text-xs">
					{Object.entries(meta.identity).map(([k, v]) => (
						<span key={k} className="rounded-full border border-panel-edge px-2.5 py-0.5 text-slate-300">
							<span className="text-slate-500">{k}</span> {v}
						</span>
					))}
				</section>
			)}

			{checks.length > 0 && (
				<section className="grid gap-1 px-4 pt-3 text-xs sm:grid-cols-2">
					{checks.map((c) => (
						<div key={c.id} className="flex gap-2">
							<span className={c.status === 'pass' ? 'text-emerald-300' : c.status === 'manual' ? 'text-amber-300' : 'text-rose-300'}>
								{c.status === 'pass' ? '✔' : c.status === 'manual' ? '◎' : '✘'}
							</span>
							<span className="text-slate-300">{c.label}</span>
							<span className="truncate text-slate-500">{c.detail}</span>
						</div>
					))}
				</section>
			)}

			<div ref={host} className="p-2" />
		</main>
	);
}
