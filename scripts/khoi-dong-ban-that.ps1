# Bật bản thật (Funnel) nếu chưa chạy: máy chủ game :3200 (CSDL thật data/aether.db) + web :3101 (thư mục build ở .funnel-current).
# Tác vụ Windows "Aether - ban that" gọi file này lúc đăng nhập (cài: scripts/cai-tu-khoi-dong.ps1); chạy tay cũng được:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\khoi-dong-ban-that.ps1
# Cổng nào đã có tiến trình nghe thì bỏ qua (chạy lại nhiều lần không sinh bản thứ hai).
# Tạo tiến trình qua WMI: cha là dịch vụ WMI nên không tắt theo cửa sổ / phiên Claude đã gọi (README mục Funnel, đã dẫm 10/10/2026).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$log = Join-Path $root 'scripts\khoi-dong-ban-that.log'

function Write-Log($msg) { Add-Content -Path $log -Value ("{0:yyyy-MM-dd HH:mm:ss} {1}" -f (Get-Date), $msg) -Encoding utf8 }
function Test-Listening($port) { [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) }
function Start-Detached($cmd, $dir) {
  $r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $cmd; CurrentDirectory = $dir }
  if ($r.ReturnValue -ne 0) { throw "Win32_Process.Create trả $($r.ReturnValue) cho: $cmd" }
  $r.ProcessId
}

$services = @(
  @{ Name = 'may chu game'; Port = 3200; Dir = "$root\apps\server"; Cmd = 'cmd.exe /c "npx tsx src\main.ts >> data\server.log 2>&1"' },
  @{ Name = 'web funnel';   Port = 3101; Dir = "$root\apps\web";    Cmd = 'cmd.exe /c "node scripts\start-funnel.mjs >> funnel.log 2>&1"' }
)

foreach ($s in $services) {
  if (Test-Listening $s.Port) { Write-Log "$($s.Name) :$($s.Port) dang chay - bo qua"; continue }
  try {
    $procId = Start-Detached $s.Cmd $s.Dir
    Write-Log "$($s.Name) :$($s.Port) bat (pid $procId)"
  } catch {
    Write-Log "$($s.Name) :$($s.Port) LOI: $_"
  }
}

# Chờ hai cổng lên (tối đa 60 giây) để log ghi rõ đã sẵn sàng hay chưa.
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline -and -not ((Test-Listening 3200) -and (Test-Listening 3101))) { Start-Sleep -Seconds 2 }
foreach ($s in $services) { Write-Log ("{0} :{1} {2}" -f $s.Name, $s.Port, $(if (Test-Listening $s.Port) { 'SAN SANG' } else { 'CHUA LEN - xem log' })) }
