'use client';

import { useEffect, useState } from 'react';
import { ageTitle } from '@/game/story/ages';
import { STORY } from '@/game/story/story';
import { StoryDirector } from '@/game/story/StoryDirector';
import { persona, personalize } from '@/game/story/persona';
import { useGameStore } from '@/store/useGameStore';
import { useTouchDevice } from './TouchControls';
import { useMediaQuery } from './useMediaQuery';

/** Hiện chữ dần (kiểu visual novel). Bấm khi đang chạy chữ thì hiện hết dòng ngay. */
function useTypewriter(text: string, cps = 42): [string, boolean, () => void] {
	const [n, setN] = useState(0);
	useEffect(() => {
		setN(0);
		const id = setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), 1000 / cps);
		return () => clearInterval(id);
	}, [text, cps]);
	return [text.slice(0, n), n >= text.length, () => setN(text.length)];
}

/**
 * Ảnh chân dung phóng NGUYÊN lần điểm ảnh gốc, cỡ gần ô `box` nhất (dư thì cắt mép, thiếu thì hở nền ô đá) — co giãn
 * lẻ kiểu object-cover làm hàng điểm ảnh dày mỏng không đều. Chân dung pipeline là ảnh đã phóng 3× (cạnh chia hết
 * cho 3) nên điểm ảnh gốc = cạnh / 3; ảnh vẽ tay còn lại coi điểm ảnh file là gốc. Ảnh cao hơn rộng (lior.png toàn
 * thân) neo mép trên để thấy mặt.
 */
function PixelPortrait({ src, alt, box }: { src: string; alt: string; box: number }) {
	const [nat, setNat] = useState<{ src: string; w: number; h: number } | null>(null);
	let style: React.CSSProperties = { visibility: 'hidden' };
	if (nat?.src === src) {
		const unit = nat.w % 3 === 0 && nat.h % 3 === 0 ? 3 : 1;
		const n = nat.w / unit;
		const k = Math.max(1, Math.round(box / n));
		const w = n * k;
		const h = (nat.h / unit) * k;
		style = { width: w, height: h, left: Math.floor((box - w) / 2), top: h > w ? 0 : Math.floor((box - h) / 2) };
	}
	return (
		<img
			src={src}
			alt={alt}
			draggable={false}
			onLoad={(e) => setNat({ src, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
			className="pixel-img absolute max-w-none"
			style={style}
		/>
	);
}

/**
 * Chân dung NPC = vùng đầu của frame idle hướng S trong chính atlas nhân vật (frame đầu luôn nằm ở
 * (2,2) theo packAtlas). Chưa có tranh chân dung riêng thì vẫn nhận ra ai đang nói.
 */
function Portrait({ id, box }: { id: string | null; box: number }) {
	const playerPortrait = useGameStore((s) => s.playerPortrait);
	const portraits = useGameStore((s) => s.portraits);
	if (!id) return null;
	if (id === 'lior') return <PixelPortrait key={playerPortrait} src={playerPortrait} alt={persona().name} box={box} />;
	// Boss chưa có id nhân vật riêng trong `portraits`: dùng thẳng tranh chân dung PixelLab của quỷ.
	if (id === 'boss') return <PixelPortrait src="/assets/portraits/boss_demon_001.png" alt="" box={box} />;
	if (portraits[id]) return <PixelPortrait key={portraits[id]} src={portraits[id]} alt="" box={box} />;
	return (
		<div
			className="pixel-img h-full w-full"
			style={{
				backgroundImage: `url(/assets/characters/${id}/${id}.png)`,
				backgroundSize: `${782 * 2}px auto`,
				backgroundPosition: `${-(2 + 40) * 2}px ${-(2 + 46) * 2}px`,
				backgroundRepeat: 'no-repeat',
			}}
		/>
	);
}

export function DialogueBox() {
	const dialogue = useGameStore((s) => s.dialogue);
	const advance = useGameStore((s) => s.advanceDialogue);
	const current = dialogue ? dialogue.lines[dialogue.index]! : null;
	const [shown, finished, skip] = useTypewriter(current?.text ?? '');
	const touch = useTouchDevice();
	const wide = useMediaQuery('(min-width: 640px)');
	const onNext = (): void => (finished ? advance() : skip());
	useEffect(() => {
		if (!dialogue) return undefined;
		const onKey = (e: KeyboardEvent): void => {
			if (e.repeat || !(e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE')) return;
			e.preventDefault();
			onNext();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
	if (!dialogue) return null;
	return (
		<div className="pointer-events-auto absolute inset-x-0 bottom-3 z-20 flex justify-center px-3" onClick={onNext} role="button" tabIndex={0}>
			<div className="ui-frame relative flex w-full max-w-3xl gap-3 p-1 sm:gap-4 sm:p-2">
				{/* Tên người nói trên dải cuộn giấy gác lên viền gỗ trên (chân dải chạm mép trong khung) — không tốn một dòng trong hộp. */}
				{current?.speaker && (
					<p className="ui-banner absolute -top-[54px] left-1 h-[57px] max-w-[calc(100%-8px)] px-1 text-label sm:left-2">
						<span className="truncate leading-[1.45]">{current.speaker}</span>
					</p>
				)}
				{current?.style !== 'narrator' && (
					<div className="ui-slot relative h-[106px] w-[106px] shrink-0 overflow-hidden sm:h-[122px] sm:w-[122px]">
						<Portrait id={current?.portrait ?? null} box={wide ? 96 : 80} />
					</div>
				)}
				<div className="flex min-w-0 flex-1 flex-col py-1">
					<p
						className={`min-h-[3.2em] flex-1 leading-relaxed ${
							current?.style === 'inner'
								? 'text-[17px] font-semibold italic text-[#24508f]'
								: current?.style === 'narrator'
									? 'font-display text-[18px] font-bold text-ink-soft'
									: 'text-[17px] font-semibold text-ink-brown'
						}`}
					>
						{shown}
					</p>
					<div className="mt-1 flex items-center justify-between gap-2">
						<span className="ui-tag bg-paper-sunk tabular-nums text-ink-soft">
							{dialogue.index + 1}/{dialogue.lines.length}
						</span>
						{finished && (
							<span className="animate-bob font-display text-[15px] font-extrabold text-amber" title={touch ? 'Chạm để đọc tiếp' : 'Nhấn E, Space hoặc bấm để đọc tiếp'}>
								Tiếp
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

/** `mustChoose`: dòng cuối có nút lựa chọn, bấm/Space KHÔNG đóng thẻ, "Bỏ qua" chỉ nhảy tới dòng cuối. */
function Cinematic({ lines, title, onDone, actions, mustChoose = false }: { lines: string[]; title?: string; onDone: () => void; actions?: React.ReactNode; mustChoose?: boolean }) {
	const [i, setI] = useState(0);
	const [shown, finished, skip] = useTypewriter(personalize(lines[i] ?? ''), 34);
	const touch = useTouchDevice();
	const last = i >= lines.length - 1;
	const next = (): void => {
		if (!finished) return skip();
		if (last) {
			if (!mustChoose) onDone();
		} else setI(i + 1);
	};
	useEffect(() => {
		const onKey = (e: KeyboardEvent): void => {
			if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
				e.preventDefault();
				next();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
	// Trang giấy da trong khung gỗ, tiêu đề trên dải cuộn giấy treo giữa viền trên (nhô ra ~20px — lề trên 40px chừa chỗ;
	// lề dưới 60px chừa nút "Bỏ qua" ở góc để nó không đè lên khung khi khung cao kịch màn).
	// Chữ dài hơn màn thấp (điện thoại ngang) thì cuộn TRONG trang giấy, khung và dải tiêu đề đứng yên.
	return (
		<div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-[#140d08] px-4 pb-[60px] pt-10 sm:px-6" onClick={next} role="button" tabIndex={0}>
			<div className="ui-frame relative flex max-h-full w-full max-w-2xl flex-col">
				{title && (
					<p className="ui-banner absolute -top-[38px] left-1/2 h-[57px] max-w-[calc(100vw-16px)] -translate-x-1/2 whitespace-nowrap px-2 text-label sm:text-head">
						<span className="truncate leading-[1.45]">{title}</span>
					</p>
				)}
				<div className={`min-h-0 overflow-y-auto border-2 border-paper-line bg-paper px-5 pb-6 text-center text-ink-brown [scrollbar-width:thin] sm:px-10 ${title ? 'pt-10' : 'pt-6'}`}>
					<p className="min-h-[4.5em] font-display text-[22px] leading-[34px] font-bold sm:text-[26px] sm:leading-[38px]">{shown}</p>
					<div className="mt-6 flex items-center justify-center gap-1.5">
						{lines.map((_, k) => (
							<span key={k} className={`h-1 w-4 rounded-full ${k <= i ? 'bg-ink-brown/75' : 'bg-ink-brown/20'}`} />
						))}
					</div>
					{last && finished && actions ? <div className="mt-6 flex flex-wrap justify-center gap-3" onClick={(e) => e.stopPropagation()}>{actions}</div> : <p className="mt-5 text-note text-ink-soft">{touch ? 'Chạm để đọc tiếp' : 'Nhấn Space hoặc bấm để đọc tiếp'}</p>}
				</div>
			</div>
			{!last && (
				<button type="button" onClick={(e) => (e.stopPropagation(), mustChoose ? setI(lines.length - 1) : onDone())} className="ui-chip absolute bottom-5 right-5">
					Bỏ qua
				</button>
			)}
		</div>
	);
}

export function StoryScenes() {
	const scene = useGameStore((s) => s.scene);
	const status = useGameStore((s) => s.status);
	const card = useGameStore((s) => s.card);
	const nextBeat = useGameStore((s) => s.nextBeat);
	const setScene = useGameStore((s) => s.setScene);
	const pushBeat = useGameStore((s) => s.pushBeat);
	if (status !== 'ready') return null;
	if (card && scene === 'play' && card.choices?.length)
		return (
			<Cinematic
				key={card.title}
				title={card.title}
				lines={card.lines}
				onDone={nextBeat}
				mustChoose
				// Nút gỗ một dòng + lời giải thích mực nâu ngay dưới trên trang giấy (kéo nút gỗ cao ra cho hai dòng thì
				// hoa văn đinh hai đầu bị giãn dọc). Cả cụm là một nút, rê vào lời giải thích cũng sáng nút gỗ.
				actions={card.choices.map((c) => (
					<button
						key={c.id}
						type="button"
						onClick={() => {
							card.onChoose?.(c.id);
							nextBeat();
						}}
						className="group flex w-full max-w-[260px] flex-col items-center gap-1.5"
					>
						<span className="ui-btn w-full max-w-full group-hover:brightness-110">
							<span className="truncate leading-[1.45]">{c.label}</span>
						</span>
						<span className="text-note text-ink-soft">{c.detail}</span>
					</button>
				))}
			/>
		);
	if (card && scene === 'play') return <Cinematic key={card.title} title={card.title} lines={card.lines} onDone={nextBeat} />;
	if (scene === 'intro')
		return (
			<Cinematic
				title="Kiếp thứ hai"
				lines={STORY.prologue}
				onDone={() => {
					StoryDirector.markIntroSeen();
					setScene('play');
					// Mốc tuổi đầu không có sự kiện "đổi tuổi" → hiện thẻ vạch khắc đầu tiên ngay sau lời tựa.
					const save = StoryDirector.load();
					const first = STORY.quests[0]?.age;
					if ((!save || save.index === 0) && first !== undefined && STORY.ageCards[first]) {
						pushBeat({ kind: 'card', title: ageTitle(first), lines: STORY.ageCards[first]! });
					}
				}}
			/>
		);
	if (scene === 'chapter-end')
		return (
			<Cinematic
				title="Hết chương"
				lines={STORY.ending}
				onDone={() => setScene('play')}
				actions={
					<>
						<button type="button" onClick={() => setScene('play')} className="ui-btn min-w-[160px]">
							Tiếp tục khám phá
						</button>
						<button
							type="button"
							onClick={() => {
								void StoryDirector.reset().then(() => location.reload());
							}}
							className="ui-chip ui-chip-danger min-h-[39px] min-w-[160px]"
						>
							Chơi lại từ đầu
						</button>
					</>
				}
			/>
		);
	return null;
}
