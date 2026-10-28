// Phát bản client cho TỰ CẬP NHẬT (11/10/2026): build xong (GameSetup ghi `Build/<windows|android>.build.json`) → chạy
//   npx tsx UnityGame/Tools~/publish-client.mts [--min] [--notes "ghi chú"] [--dir <thư mục>] [--fast] [--only windows|android] [--no-drive]
// Windows: gói `Build/Windows` thành MỘT file exe CÀI ĐẶT (WinRAR SFX — chủ dự án: "tải game file exe sau sẽ cài, chọn đường dẫn ra file game
// như Ngọc Rồng"): hộp cài cho chọn thư mục (mặc định %LOCALAPPDATA%\Haven Lord), tạo lối tắt màn hình + menu Start, cài xong mở game.
// Tự cập nhật: client cũ gọi CHÍNH file này với `-s2 -d<thư mục đang cài>`; client từ 12/10/2026 tải gói `.zip` cùng nội dung (exe SFX chưa
// ký số bị Windows Defender chặn) rồi tự giải nén + chép đè (AutoUpdate.cs) → đúng chỗ người chơi đã chọn.
// Android: chép APK. Rồi tính cỡ + SHA-256, ghi `version.json` (ghi file tạm rồi đổi tên — máy chủ không bao giờ đọc phải file dở) vào
// thư mục bản phát của máy chủ (mặc định `apps/server/data/client` = máy chủ THẬT; thử thì `--dir apps/server/data/client-test`).
// Máy chủ đọc lại mỗi lần gọi → KHÔNG cần khởi động lại. Client đang chạy bản cũ mở game là tự tải + cài.
//   --min    bản này thành bản tối thiểu: client cũ hơn bị chặn tới khi cập nhật xong (đổi luật / giao thức không tương thích)
//   --fast   nén nhanh (-m1) cho bản thử; mặc định -m5
//   --no-drive  KHÔNG đẩy lên Drive. Mặc định phát cho máy chủ THẬT (không `--dir`) xong là đẩy exe + apk mới lên thư mục Google Drive
//               của trang Tải game, ghi đè đúng tên cũ (upload-drive.mts, cần rclone remote `gdrive`)
// Giữ 2 bản gần nhất mỗi nền tảng (người đang tải dở bản trước không hỏng), xoá bản cũ hơn. Chép thêm exe ra Build/HavenLord-Setup.exe (tên cũ Aether-Chronicle.exe.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { copyFileSync, createReadStream, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
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
	zip?: { file: string; size: number; sha256: string };
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

/** Only remove the unique installer directory allocated by this run, inside the OS temp directory. */
const removeInstallerTemp = (directory: string): void => {
	const root = realpathSync(tmpdir());
	const target = realpathSync(directory);
	const inside = relative(root, target);
	if (!inside || inside === '..' || inside.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(inside) || dirname(target) !== root || !basename(target).startsWith('aether-installer-')) {
		throw new Error(`Refusing installer cleanup outside the temporary installer directory: ${target}`);
	}
	rmSync(target, { recursive: true, force: true });
};

const vPath = join(outDir, 'version.json');
const current = existsSync(vPath) ? (JSON.parse(readFileSync(vPath, 'utf8')) as Record<string, unknown>) : {};
const next: Record<string, unknown> = { ...current };
let newest = 0;

if (only !== 'android') {
	const b = readBuild('windows');
	if (!b || !existsSync(join(BUILD, 'Windows', 'HavenLord.exe'))) console.log('… Windows: chưa có bản build (Build/Windows + windows.build.json) — bỏ qua');
	else {
		const file = `HavenLord-${b.build}.exe`;
		const dst = join(outDir, file);
		const sfxScript = join(tmpdir(), `aether-sfx-${process.pid}.txt`);
		writeFileSync(
			sfxScript,
			[
				'Title=Cài đặt Haven Lord',
				'Text',
				'{',
				'Haven Lord — game nhập vai online.',
				'',
				'Chọn thư mục cài game (bấm Browse để đổi chỗ) rồi bấm Install.',
				'Cài xong game tự mở và có lối tắt ngoài màn hình. Lần sau mở game sẽ tự cập nhật bản mới — không phải tải lại.',
				'}',
				'Path=%LOCALAPPDATA%\\Haven Lord',
				'SavePath',
				'Overwrite=1',
				'Setup=HavenLord.exe',
				'Shortcut=D, "HavenLord.exe", "", "Haven Lord", "Haven Lord"',
				'Shortcut=P, "HavenLord.exe", "Haven Lord", "Haven Lord", "Haven Lord"',
				'Shortcut=P, "Uninstall.cmd", "Haven Lord", "Gỡ cài đặt Haven Lord", "Gỡ cài đặt Haven Lord"',
				'',
			].join('\r\n'),
		);
		rmSync(dst, { force: true });
		// Trình gỡ cài đặt (Tools~/installer) + danh sách mục game đã cài — trình gỡ CHỈ xoá đúng các mục này (người chơi có thể cài
		// thẳng vào thư mục chung như C:\Games).
		const extra = mkdtempSync(join(tmpdir(), 'aether-installer-'));
		for (const f of ['Uninstall.cmd', 'uninstall.ps1']) copyFileSync(join(HERE, 'installer', f), join(extra, f));
		// Thư mục Unity ghi "DoNotShip" / "DontShip" KHÔNG được gửi kèm: `…_BackUpThisFolder_ButDontShipItWithYourGame` của IL2CPP là mã C++
		// sinh từ toàn bộ code (gửi kèm = mất tác dụng IL2CPP), `…_BurstDebugInformation_DoNotShip` là thông tin gỡ lỗi.
		const shipped = readdirSync(join(BUILD, 'Windows')).filter((n) => !/DoNotShip|DontShip/i.test(n));
		const installed = [...shipped, 'Uninstall.cmd', 'uninstall.ps1'];
		writeFileSync(join(extra, 'uninstall-files.txt'), `${installed.join('\r\n')}\r\n`);
		console.log(`… Windows bản ${b.build}: đóng gói ${flag('--fast') ? '(nhanh)' : ''}…`);
		const r = spawnSync(RAR, ['a', `-sfx${SFX}`, '-scfc', `-z${sfxScript}`, '-ep1', '-r', flag('--fast') ? '-m1' : '-m5', '-idq', dst, ...shipped.map((n) => join(BUILD, 'Windows', n)), join(extra, '*')], { stdio: 'inherit' });
		rmSync(sfxScript, { force: true });
		const extra2 = extra;
		if (r.status !== 0) throw new Error(`Rar.exe lỗi (mã ${r.status})`);
		// Gói zip cùng nội dung cho client mới (từ 12/10/2026): bộ cài exe SFX chưa ký số bị Windows Defender chặn (Win32 IO 225) nên
		// client tải zip rồi tự giải nén. Client cũ vẫn dùng `file` (exe) ở trên.
		const zipFile = `HavenLord-${b.build}.zip`;
		const zipDst = join(outDir, zipFile);
		rmSync(zipDst, { force: true });
		// Rar.exe (bản console) không ghi được zip (-afzip báo "tuỳ chọn chưa biết") → dùng bsdtar có sẵn của Windows.
		const zr = spawnSync(join(process.env.SystemRoot ?? 'C:/Windows', 'System32', 'tar.exe'), ['-a', '-c', '-f', zipDst, '-C', join(BUILD, 'Windows'), ...shipped, '-C', extra2, ...readdirSync(extra2)], { stdio: 'inherit' });
		removeInstallerTemp(extra2);
		if (zr.status !== 0) throw new Error(`tar.exe (zip) lỗi (mã ${zr.status})`);
		const e: Entry = {
			build: b.build,
			file,
			size: statSync(dst).size,
			sha256: await sha256(dst),
			zip: { file: zipFile, size: statSync(zipDst).size, sha256: await sha256(zipDst) },
		};
		next.windows = e;
		newest = Math.max(newest, b.build);
		next.version = b.version;
		copyFileSync(dst, join(BUILD, 'HavenLord-Setup.exe'));
		console.log(`✔ Windows ${file} · ${(e.size / 1048576).toFixed(1)} MB · ${e.sha256.slice(0, 12)}…`);
	}
}

if (only !== 'windows') {
	const b = readBuild('android');
	const apk = join(BUILD, 'Android', 'HavenLord.apk');
	if (!b || !existsSync(apk)) console.log('… Android: chưa có bản build (Build/Android/HavenLord.apk + android.build.json) — bỏ qua');
	else {
		const file = `HavenLord-${b.build}.apk`;
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
	[/^(?:HavenLord|Aether-Chronicle)-(\d+)\.exe$/, (next.windows as Entry | undefined)?.file],
	[/^(?:HavenLord|Aether-Chronicle)-(\d+)\.zip$/, (next.windows as Entry | undefined)?.zip?.file],
	[/^(?:HavenLord|Aether)-(\d+)\.apk$/, (next.android as Entry | undefined)?.file],
] as const) {
	const files = readdirSync(outDir)
		.map((f) => ({ f, m: f.match(re) }))
		.filter((x) => x.m)
		.sort((a, b) => Number(b.m![1]) - Number(a.m![1]));
	for (const { f } of files.slice(2)) if (f !== keep) rmSync(join(outDir, f), { force: true });
}

if (!flag('--no-drive') && opt('--dir') === undefined) {
	const r = spawnSync(process.execPath, ['--import', 'tsx', join(HERE, 'upload-drive.mts'), ...(only ? ['--only', only] : [])], { stdio: 'inherit' });
	if (r.status !== 0) console.log('✘ Đẩy lên Drive lỗi — bản phát cho tự cập nhật vẫn xong; chạy lại: npx tsx UnityGame/Tools~/upload-drive.mts');
}
