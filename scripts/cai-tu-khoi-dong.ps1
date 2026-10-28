# Cài tác vụ Windows "Haven Lord - ban that": mỗi lần đăng nhập Windows (bật máy) tự chạy scripts/khoi-dong-ban-that.ps1
# (máy chủ game :3200 + web Funnel :3101). Không cần quyền quản trị — tác vụ chạy dưới tài khoản đang dùng.
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\cai-tu-khoi-dong.ps1           # cài / cài lại
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\cai-tu-khoi-dong.ps1 -Remove   # gỡ
# Tailscale Funnel tự giữ cấu hình (--bg) qua khởi động lại, không cần cài gì thêm.
param([switch]$Remove)
$ErrorActionPreference = 'Stop'
$name = 'Haven Lord - ban that'

if ($Remove) {
  Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
  Write-Output "Da go tac vu '$name'."
  return
}

$script = Join-Path $PSScriptRoot 'khoi-dong-ban-that.ps1'
$user = "$env:USERDOMAIN\$env:USERNAME"
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
$trigger.Delay = 'PT20S' # đợi mạng / Tailscale ổn định sau khi đăng nhập
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
  -Description 'Haven Lord: bat may chu game :3200 + web Funnel :3101 khi dang nhap (scripts/khoi-dong-ban-that.ps1).' -Force | Out-Null
Write-Output "Da cai tac vu '$name' (luc dang nhap $user, tre 20 giay)."
