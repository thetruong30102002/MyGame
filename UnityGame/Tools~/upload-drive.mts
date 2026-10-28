// Đẩy bản build mới lên thư mục Google Drive mà trang Tải game trỏ tới (chủ dự án 14/10/2026: "tự upload 2 file build mới exe với apk vào drive"):
//   npx tsx UnityGame/Tools~/upload-drive.mts [--only windows|android]
// `publish-client.mts --drive` tự gọi file này sau khi phát. Tên trên Drive CỐ ĐỊNH (`HavenLord-Setup.exe`, `HavenLord.apk`): ghi đè giữ nguyên file id nên link chia sẻ từng file không đổi; file giống hệt (cỡ + giờ sửa) thì rclone bỏ qua.
// Nguồn: `Build/HavenLord-Setup.exe` (publish-client chép ra) và `Build/Android/HavenLord.apk`.
// Dùng rclone, remote `gdrive` gốc ở đúng thư mục Drive — tạo một lần (mở trình duyệt đăng nhập Google):
//   rclone config create gdrive drive scope=drive root_folder_id=1aXYfDoxPSySJ3k4wDbxDe5PGIrnkBHei
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'Build');
const REMOTE = 'gdrive:';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;

/** rclone cài bằng winget: shell mở trước lúc cài chưa có PATH mới → tìm thẳng trong thư mục gói. */
const findRclone = (): string => {
	if (spawnSync('rclone', ['version'], { stdio: 'ignore' }).status === 0) return 'rclone';
	const pk = join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages');
	const dir = existsSync(pk) ? readdirSync(pk).find((d) => d.startsWith('Rclone.Rclone')) : undefined;
	const sub = dir ? readdirSync(join(pk, dir)).find((d) => d.startsWith('rclone-')) : undefined;
	if (dir && sub && existsSync(join(pk, dir, sub, 'rclone.exe'))) return join(pk, dir, sub, 'rclone.exe');
	throw new Error('Chưa cài rclone: winget install Rclone.Rclone');
};
const RCLONE = findRclone();

const jobs: [string, string][] = [];
if (only !== 'android') jobs.push([join(BUILD, 'HavenLord-Setup.exe'), 'HavenLord-Setup.exe']);
if (only !== 'windows') jobs.push([join(BUILD, 'Android', 'HavenLord.apk'), 'HavenLord.apk']);

let failed = false;
for (const [src, name] of jobs) {
	if (!existsSync(src)) {
		console.log(`… Drive: chưa có ${src} — bỏ qua`);
		continue;
	}
	console.log(`… Drive: ${name}…`);
	const r = spawnSync(RCLONE, ['copyto', src, REMOTE + name, '--stats-one-line', '--stats', '15s', '-v'], { stdio: 'inherit' });
	if (r.status === 0) console.log(`✔ Drive ${name}`);
	else {
		console.log(`✘ Drive ${name}: rclone lỗi (mã ${r.status}) — đăng nhập lại: rclone config reconnect gdrive:`);
		failed = true;
	}
}
if (failed) process.exit(1);
