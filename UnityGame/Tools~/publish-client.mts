// Phát bản client cho TỰ CẬP NHẬT (11/10/2026): build xong (GameSetup ghi `Build/<windows|android>.build.json`) → chạy
//   npx tsx UnityGame/Tools~/publish-client.mts [--min] [--notes "ghi chú"] [--dir <thư mục>] [--fast] [--only windows|android]
// Windows: gói `Build/Windows` thành MỘT file exe CÀI ĐẶT (WinRAR SFX — chủ dự án: "tải game file exe sau sẽ cài, chọn đường dẫn ra file game
// như Ngọc Rồng"): hộp cài cho chọn thư mục (mặc định %LOCALAPPDATA%\Aether Chronicle), tạo lối tắt màn hình + menu Start, cài xong mở game.
// Tự cập nhật gọi CHÍNH file này với `-s2 -d<thư mục đang cài>` (AutoUpdate.cs) → bung đè im lặng đúng chỗ người chơi đã chọn.
// Android: chép APK. Rồi tính cỡ + SHA-256, ghi `version.json` (ghi file tạm rồi đổi tên — máy chủ không bao giờ đọc phải file dở) vào
// thư mục bản phát của máy chủ (mặc định `apps/server/data/client` = máy chủ THẬT; thử thì `--dir apps/server/data/client-test`).
// Máy chủ đọc lại mỗi lần gọi → KHÔNG cần khởi động lại. Client đang chạy bản cũ mở game là tự tải + cài.
//   --min    bản này thành bản tối thiểu: client cũ hơn bị chặn tới khi cập nhật xong (đổi luật / giao thức không tương thích)
//   --fast   nén nhanh (-m1) cho bản thử; mặc định -m5
// Giữ 2 bản gần nhất mỗi nền tảng (người đang tải dở bản trước không hỏng), xoá bản cũ hơn. Chép thêm exe ra Build/Aether-Chronicle.exe.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const BUILD = join(ROOT, 'UnityGame', 'Build');
const RAR = 'C:\\Program Files\\WinRAR\\Rar.exe';
const SFX = 'C:\\Program Files\\WinRAR\\Default.SFX';

const args = process.argv.slice(2);
const flag = (n: string): boolean => args.includes(n);
const opt = (n: string): string | undefined => {
	const i = args.indexOf(n);
	return i >= 0 ? args[i + 1] : undefined;
};
const outDir = resolve(ROOT, opt('--dir') ?? 'apps/server/data/client');
const only = opt('--only');
mkdirSync(outDir, { recursive: true });

interface BuildInfo {
	build: number;
	version: string;
}
interface Entry {
	build: number;
	file: string;
	size: number;
	sha256: string;
}

const sha256 = (p: string): Promise<string> =>
	new Promise((ok, fail) => {
		const h = createHash('sha256');
		createReadStream(p)
			.on('data', (d) => h.update(d))
			.on('end', () => ok(h.digest('hex')))
			.on('error', fail);
	});

const readBuild = (platform: string): BuildInfo | null => {
	const p = join(BUILD, `${platform}.build.json`);
	return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as BuildInfo) : null;
};

const vPath = join(outDir, 'version.json');
const current = existsSync(vPath) ? (JSON.parse(readFileSync(vPath, 'utf8')) as Record<string, unknown>) : {};
const next: Record<string, unknown> = { ...current };
let newest = 0;

if (only !== 'android') {
	const b = readBuild('windows');
	if (!b || !existsSync(join(BUILD, 'Windows', 'Aether.exe'))) console.log('… Windows: chưa có bản build (Build/Windows + windows.build.json) — bỏ qua');
	else {
		const file = `Aether-Chronicle-${b.build}.exe`;
		const dst = join(outDir, file);
		const sfxScript = join(tmpdir(), `aether-sfx-${process.pid}.txt`);
		writeFileSync(
			sfxScript,
			[
				'Title=Cài đặt Aether Chronicle',
				'Text',
				'{',
				'Aether Chronicle — game nhập vai online.',
				'',
				'Chọn thư mục cài game (bấm Browse để đổi chỗ) rồi bấm Install.',
				'Cài xong game tự mở và có lối tắt ngoài màn hình. Lần sau mở game sẽ tự cập nhật bản mới — không phải tải lại.',
				'}',
				'Path=%LOCALAPPDATA%\\Aether Chronicle',
				'SavePath',
				'Overwrite=1',
				'Setup=Aether.exe',
				'Shortcut=D, "Aether.exe", "", "Aether Chronicle", "Aether Chronicle"',
				'Shortcut=P, "Aether.exe", "Aether Chronicle", "Aether Chronicle", "Aether Chronicle"',
				'Shortcut=P, "Uninstall.cmd", "Aether Chronicle", "Gỡ cài đặt Aether Chronicle", "Gỡ cài đặt Aether Chronicle"',
				'',
			].join('\r\n'),
		);
		rmSync(dst, { force: true });
		// Trình gỡ cài đặt (Tools~/installer) + danh sách mục game đã cài — trình gỡ CHỈ xoá đúng các mục này (người chơi có thể cài
		// thẳng vào thư mục chung như C:\Games).
		const extra = join(tmpdir(), `aether-installer-${process.pid}`);
		rmSync(extra, { recursive: true, force: true });
		mkdirSync(extra, { recursive: true });
		for (const f of ['Uninstall.cmd', 'uninstall.ps1']) copyFileSync(join(HERE, 'installer', f), join(extra, f));
		// Thư mục Unity ghi "DoNotShip" / "DontShip" KHÔNG được gửi kèm: `…_BackUpThisFolder_ButDontShipItWithYourGame` của IL2CPP là mã C++
		// sinh từ toàn bộ code (gửi kèm = mất tác dụng IL2CPP), `…_BurstDebugInformation_DoNotShip` là thông tin gỡ lỗi.
		const shipped = readdirSync(join(BUILD, 'Windows')).filter((n) => !/DoNotShip|DontShip/i.test(n));
		const installed = [...shipped, 'Uninstall.cmd', 'uninstall.ps1'];
		writeFileSync(join(extra, 'uninstall-files.txt'), `${installed.join('\r\n')}\r\n`);
		console.log(`… Windows bản ${b.build}: đóng gói ${flag('--fast') ? '(nhanh)' : ''}…`);
		const r = spawnSync(RAR, ['a', `-sfx${SFX}`, '-scfc', `-z${sfxScript}`, '-ep1', '-r', flag('--fast') ? '-m1' : '-m5', '-idq', dst, ...shipped.map((n) => join(BUILD, 'Windows', n)), join(extra, '*')], { stdio: 'inherit' });
		rmSync(sfxScript, { force: true });
		rmSync(extra, { recursive: true, force: true });
		if (r.status !== 0) throw new Error(`Rar.exe lỗi (mã ${r.status})`);
		const e: Entry = { build: b.build, file, size: statSync(dst).size, sha256: await sha256(dst) };
		next.windows = e;
		newest = Math.max(newest, b.build);
		next.version = b.version;
		copyFileSync(dst, join(BUILD, 'Aether-Chronicle.exe'));
		console.log(`✔ Windows ${file} · ${(e.size / 1048576).toFixed(1)} MB · ${e.sha256.slice(0, 12)}…`);
	}
}

if (only !== 'windows') {
	const b = readBuild('android');
	const apk = join(BUILD, 'Android', 'Aether.apk');
	if (!b || !existsSync(apk)) console.log('… Android: chưa có bản build (Build/Android/Aether.apk + android.build.json) — bỏ qua');
	else {
		const file = `Aether-${b.build}.apk`;
		const dst = join(outDir, file);
		copyFileSync(apk, dst);
		const e: Entry = { build: b.build, file, size: statSync(dst).size, sha256: await sha256(dst) };
		next.android = e;
		if (b.build >= newest) next.version = b.version;
		newest = Math.max(newest, b.build);
		console.log(`✔ Android ${file} · ${(e.size / 1048576).toFixed(1)} MB`);
	}
}

if (!newest) {
	console.log('Không có gì để phát.');
	process.exit(1);
}
if (flag('--min')) next.minBuild = newest;
const notes = opt('--notes');
if (notes !== undefined) next.notes = notes;
const tmp = `${vPath}.tmp`;
writeFileSync(tmp, `${JSON.stringify(next, null, '\t')}\n`);
renameSync(tmp, vPath);
console.log(`✔ version.json → ${vPath} (bản ${String(next.version)}${flag('--min') ? `, tối thiểu ${newest}` : ''})`);

// Dọn: mỗi nền tảng giữ 2 bản mới nhất (bản đang phát + bản trước).
for (const [re, keep] of [
	[/^Aether-Chronicle-(\d+)\.exe$/, (next.windows as Entry | undefined)?.file],
	[/^Aether-(\d+)\.apk$/, (next.android as Entry | undefined)?.file],
] as const) {
	const files = readdirSync(outDir)
		.map((f) => ({ f, m: f.match(re) }))
		.filter((x) => x.m)
		.sort((a, b) => Number(b.m![1]) - Number(a.m![1]));
	for (const { f } of files.slice(2)) if (f !== keep) rmSync(join(outDir, f), { force: true });
}
