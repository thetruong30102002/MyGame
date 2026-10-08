'use client';

import { useEffect } from 'react';
import { AreaBanner } from '@/components/AreaBanner';
import { AuthScreen } from '@/components/AuthScreen';
import { BootScreen } from '@/components/BootScreen';
import { CharacterPanel } from '@/components/CharacterPanel';
import { CharacterSelect } from '@/components/CharacterSelect';
import { ChatBox } from '@/components/ChatBox';
import { GameCanvas } from '@/components/GameCanvas';
import { CalendarPanel } from '@/components/CalendarPanel';
import { GloryPanel } from '@/components/GloryPanel';
import { Hud } from '@/components/Hud';
import { ShopPanel } from '@/components/ShopPanel';
import { DialogueBox, StoryScenes } from '@/components/StoryUI';
import { TouchControls, useTouchDevice } from '@/components/TouchControls';
import { WorldMap } from '@/components/WorldMap';
import { useSession } from '@/store/useSession';

/** Luồng màn hình: đăng nhập → chọn / tạo nhân vật → vào thế giới chung. */
export default function Home() {
	const screen = useSession((s) => s.screen);
	const boot = useSession((s) => s.boot);
	// Màn cảm ứng: chat nằm trong cột trái của HUD (dưới bảng tên), xa cần gạt.
	const touch = useTouchDevice();
	useEffect(() => {
		void boot();
	}, [boot]);

	return (
		<main className="relative h-dvh w-dvw touch-none overflow-hidden overscroll-none">
			{screen === 'boot' && <BootScreen />}
			{screen === 'auth' && <AuthScreen />}
			{screen === 'characters' && <CharacterSelect />}
			{screen === 'game' && (
				<>
					<GameCanvas />
					<Hud />
					<AreaBanner />
					<TouchControls />
					{!touch && <ChatBox placement="bottom" />}
					<WorldMap />
					<CharacterPanel />
					<GloryPanel />
					<ShopPanel />
					<CalendarPanel />
					<DialogueBox />
					<StoryScenes />
				</>
			)}
		</main>
	);
}
