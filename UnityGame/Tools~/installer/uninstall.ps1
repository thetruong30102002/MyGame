# Gỡ cài đặt Haven Lord (chủ dự án 11/10/2026: "thêm trình gỡ cài đặt"). Uninstall.cmd chép file này ra %TEMP% rồi chạy, để xoá
# được cả thư mục game. CHỈ xoá đúng các mục game đã cài (danh sách uninstall-files.txt do publish-client.mts ghi lúc đóng gói) — người
# chơi có thể đã cài thẳng vào một thư mục chung (C:\Games, Desktop…), xoá cả thư mục là mất đồ khác. Thư mục chỉ bị xoá khi đã trống.
# Kèm: lối tắt màn hình / menu Start trỏ vào game, mục "Apps" của Windows, cài đặt trong game (PlayerPrefs) + log.
# Tài khoản / nhân vật nằm trên máy chủ nên không mất. -Silent: không hỏi, không báo (AutoTest).
param([string]$Dir, [switch]$Silent)
Add-Type -AssemblyName System.Windows.Forms

function Say([string]$text, [string]$icon = 'Information') {
	if (-not $Silent) { [void][System.Windows.Forms.MessageBox]::Show($text, 'Gỡ cài đặt Haven Lord', 'OK', $icon) }
}

$Dir = (Resolve-Path -LiteralPath $Dir).Path.TrimEnd('\')
$list = Join-Path $Dir 'uninstall-files.txt'
if (-not (Test-Path -LiteralPath (Join-Path $Dir 'HavenLord.exe')) -or -not (Test-Path -LiteralPath $list)) {
	Say "Không thấy game Haven Lord trong thư mục:`n$Dir" 'Warning'
	exit 1
}
if (-not $Silent) {
	$ok = [System.Windows.Forms.MessageBox]::Show(
		"Gỡ Haven Lord khỏi máy này?`n`nXoá game trong thư mục:`n$Dir`nvà lối tắt ngoài màn hình / menu Start.`n`nTài khoản và nhân vật nằm trên máy chủ nên không mất — cài lại là chơi tiếp.",
		'Gỡ cài đặt Haven Lord', 'YesNo', 'Question')
	if ($ok -ne 'Yes') { exit 0 }
}

# Lối tắt trỏ vào thư mục game này — soát TRƯỚC khi xoá file (đích đã mất thì không đọc ra được nữa).
$shell = New-Object -ComObject WScript.Shell
$mineLnk = @()
$desk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Haven Lord.lnk'
$menu = Join-Path ([Environment]::GetFolderPath('Programs')) 'Haven Lord'
foreach ($l in @(Get-Item -LiteralPath $desk -ErrorAction SilentlyContinue) + @(Get-ChildItem -LiteralPath $menu -Filter '*.lnk' -ErrorAction SilentlyContinue)) {
	$target = $shell.CreateShortcut($l.FullName).TargetPath
	# Lối tắt tới Uninstall.cmd do bộ cài tạo không đọc ra đích (TargetPath rỗng) — nhận theo đúng tên trong thư mục menu của game.
	$ours = (-not $target) -and $l.DirectoryName -eq $menu -and @('Haven Lord.lnk', 'Gỡ cài đặt Haven Lord.lnk') -contains $l.Name
	if ($ours -or $target.StartsWith($Dir + '\', [StringComparison]::OrdinalIgnoreCase)) { $mineLnk += $l.FullName }
}

# Game đang mở từ thư mục này thì tắt trước (file đang chạy bị khoá).
Get-Process -Name HavenLord -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith($Dir + '\', [StringComparison]::OrdinalIgnoreCase) } | Stop-Process -Force
Start-Sleep -Seconds 1

$items = Get-Content -LiteralPath $list -Encoding UTF8 | Where-Object { $_ -and $_ -notmatch '[\\/:]' -and $_ -ne '..' -and $_ -ne '.' }
foreach ($name in $items + @('uninstall-files.txt')) {
	$p = Join-Path $Dir $name
	for ($i = 0; $i -lt 3 -and (Test-Path -LiteralPath $p); $i++) {
		Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue
		if (Test-Path -LiteralPath $p) { Start-Sleep -Seconds 1 }
	}
}
if (-not (Get-ChildItem -LiteralPath $Dir -Force -ErrorAction SilentlyContinue)) { Remove-Item -LiteralPath $Dir -Force -ErrorAction SilentlyContinue }
foreach ($l in $mineLnk) { Remove-Item -LiteralPath $l -Force -ErrorAction SilentlyContinue }
if ((Test-Path -LiteralPath $menu) -and -not (Get-ChildItem -LiteralPath $menu -Force)) { Remove-Item -LiteralPath $menu -Force }


# Mục "Apps" của Windows + cài đặt trong game + log.
Remove-Item -LiteralPath 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\HavenLord' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath 'HKCU:\Software\nttrg\Haven Lord' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $env:USERPROFILE 'AppData\LocalLow\nttrg\Haven Lord') -Recurse -Force -ErrorAction SilentlyContinue

$left = Test-Path -LiteralPath (Join-Path $Dir 'HavenLord.exe')
if ($left) { Say "Chưa xoá hết được (có file đang bị giữ). Tắt game rồi chạy gỡ cài đặt lại." 'Warning' }
else { Say 'Đã gỡ Haven Lord. Cảm ơn bạn đã chơi!' }
Remove-Item -LiteralPath $MyInvocation.MyCommand.Path -Force -ErrorAction SilentlyContinue
