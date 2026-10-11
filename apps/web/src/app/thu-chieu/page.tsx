import { SkillLabScreen } from '@/components/skilllab/SkillLabScreen';

export const metadata = { title: 'Thử chiêu — Aether Chronicle' };

/** Trang Thử chiêu: sân tập chiêu nguyên tố + lưu phái Kiếm, KHÔNG cần đăng nhập (lối vào ở màn đăng nhập). */
export default function SkillTrialPage() {
	return <SkillLabScreen />;
}
