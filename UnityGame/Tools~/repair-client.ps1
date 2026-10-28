# Sửa một lần cho client Windows cũ không chạy được tiến trình cập nhật từ Unity IL2CPP.
# Cập nhật vào đúng thư mục cũ; không sửa registry, PlayerPrefs, dữ liệu lưu hoặc CSDL.
[CmdletBinding()]
param(
    [string]$InstallDir,
    [string]$ServerBase = 'https://admin.tail024813.ts.net/game',
    [int]$MinimumBuild = 426377,
    [string]$WorkDir,
    [switch]$CheckOnly,
    [switch]$NoLaunch
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'Continue'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Net.Http
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function Resolve-ClientFolder([string]$Candidate) {
    if ([string]::IsNullOrWhiteSpace($Candidate)) { return $null }
    $taskPath = [IO.Path]::GetFullPath($Candidate.Trim().Trim('"'))
    if ((Test-Path -LiteralPath (Join-Path $taskPath 'HavenLord.exe') -PathType Leaf) -and
        (Test-Path -LiteralPath (Join-Path $taskPath 'HavenLord_Data') -PathType Container)) {
        return (Get-Item -LiteralPath $taskPath).FullName.TrimEnd('\')
    }
    return $null
}
function Find-ClientFolder {
    if ($InstallDir) {
        $taskFound = Resolve-ClientFolder $InstallDir
        if (-not $taskFound) { throw 'Thư mục đã chọn phải chứa cả HavenLord.exe và HavenLord_Data.' }
        return $taskFound
    }
    foreach ($taskLocation in @($PSScriptRoot, (Get-Location).Path)) {
        $taskFound = Resolve-ClientFolder $taskLocation
        if ($taskFound) { return $taskFound }
    }
    $taskRunning = @(Get-CimInstance Win32_Process -Filter "Name='HavenLord.exe'" -ErrorAction SilentlyContinue |
        ForEach-Object { if ($_.ExecutablePath) { Resolve-ClientFolder ([IO.Path]::GetDirectoryName($_.ExecutablePath)) } } |
        Where-Object { $_ } | Select-Object -Unique)
    if ($taskRunning.Count -eq 1) { return $taskRunning[0] }
    if ($taskRunning.Count -gt 1) { throw 'Đang mở game ở nhiều thư mục. Chạy lại với -InstallDir "thư mục game cần sửa".' }
    $taskRegistration = Get-ItemProperty -LiteralPath 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\HavenLord' -ErrorAction SilentlyContinue
    $taskFound = Resolve-ClientFolder $taskRegistration.InstallLocation
    if ($taskFound) { return $taskFound }
    $taskFound = Resolve-ClientFolder (Join-Path $env:LOCALAPPDATA 'Haven Lord')
    if ($taskFound) { return $taskFound }
    if ($CheckOnly) { throw 'Chưa tìm thấy client. Truyền -InstallDir "thư mục chứa HavenLord.exe".' }
    $taskFound = Resolve-ClientFolder (Read-Host 'Nhập thư mục đang chứa HavenLord.exe của bạn')
    if (-not $taskFound) { throw 'Không tìm thấy HavenLord.exe và HavenLord_Data trong thư mục đã nhập.' }
    return $taskFound
}
function Get-ChildPath([string]$Root, [string]$Relative) {
    if ([IO.Path]::IsPathRooted($Relative) -or $Relative -match '(^|[\\/])\.\.([\\/]|$)') {
        throw 'Gói cập nhật chứa đường dẫn không hợp lệ.'
    }
    $taskRootFull = [IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
    $taskFull = [IO.Path]::GetFullPath((Join-Path $Root $Relative.Replace('/', '\')))
    if (-not $taskFull.StartsWith($taskRootFull, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Đường dẫn gói cập nhật vượt khỏi thư mục cho phép.'
    }
    return $taskFull
}
function Get-Sha([string]$Path) { return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Download-Package([string]$Url, [string]$Path, [long]$Size) {
    $taskHttp = [Net.Http.HttpClient]::new()
    $taskHttp.Timeout = [TimeSpan]::FromMinutes(30)
    $taskResponse = $null; $taskInput = $null; $taskOutput = $null
    try {
        $taskResponse = $taskHttp.GetAsync($Url, [Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()
        $taskResponse.EnsureSuccessStatusCode() | Out-Null
        $taskInput = $taskResponse.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
        $taskOutput = [IO.File]::Create($Path)
        $taskBuffer = New-Object byte[] 65536
        [long]$taskDownloaded = 0
        while (($taskCount = $taskInput.Read($taskBuffer, 0, $taskBuffer.Length)) -gt 0) {
            $taskOutput.Write($taskBuffer, 0, $taskCount); $taskDownloaded += $taskCount
            Write-Progress -Activity 'Đang tải bản sửa cập nhật' -Status ('{0:N0} / {1:N0} MB' -f ($taskDownloaded / 1MB), ($Size / 1MB)) -PercentComplete ([math]::Min(100, 100 * $taskDownloaded / $Size))
        }
    } finally {
        if ($taskOutput) { $taskOutput.Dispose() }; if ($taskInput) { $taskInput.Dispose() }
        if ($taskResponse) { $taskResponse.Dispose() }; $taskHttp.Dispose()
        Write-Progress -Activity 'Đang tải bản sửa cập nhật' -Completed
    }
}

$taskInstall = Find-ClientFolder
$taskServerUri = [Uri]$ServerBase
if (-not $taskServerUri.IsAbsoluteUri -or ($taskServerUri.Scheme -ne 'https' -and -not ($taskServerUri.Scheme -eq 'http' -and $taskServerUri.IsLoopback))) {
    throw 'Máy chủ cập nhật phải dùng HTTPS.'
}
$taskServer = $ServerBase.TrimEnd('/')
$taskManifest = Invoke-RestMethod -Uri ($taskServer + '/api/client/version') -TimeoutSec 20
$taskEntry = $taskManifest.windows
$taskZip = $taskEntry.zip
if (-not $taskZip -or $taskZip.file -notmatch '^[A-Za-z0-9._-]{1,120}\.zip$' -or
    [long]$taskZip.size -le 0 -or $taskZip.sha256 -notmatch '^[a-fA-F0-9]{64}$' -or [int]$taskEntry.build -le 0) {
    throw 'Máy chủ chưa cung cấp gói Windows ZIP có mã SHA-256 hợp lệ.'
}
$taskCurrentVersion = (Get-Item -LiteralPath (Join-Path $taskInstall 'HavenLord.exe')).VersionInfo.ProductVersion
$taskCurrentBuild = 0
$taskVersionSource = 'unknown'
# HavenLord.exe thật mang phiên bản UNITY (6000.x), không phải Application.version.
# Chỉ tin dấu 1.0.<build>, hoặc DisplayVersion của đúng thư mục đang sửa.
if ($taskCurrentVersion -match '^1\.0\.(\d+)$') { $taskCurrentBuild = [int]$Matches[1]; $taskVersionSource = 'application-product-version' }
$taskRegistration = Get-ItemProperty -LiteralPath 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\HavenLord' -ErrorAction SilentlyContinue
if ($taskCurrentBuild -eq 0 -and $taskRegistration -and $taskRegistration.DisplayVersion -match '^1\.0\.(\d+)$') {
    $taskRegisteredBuild = [int]$Matches[1]
    $taskRegisteredFolder = Resolve-ClientFolder $taskRegistration.InstallLocation
    if ($taskRegisteredFolder -and [string]::Equals($taskRegisteredFolder, $taskInstall, [StringComparison]::OrdinalIgnoreCase)) {
        $taskCurrentBuild = $taskRegisteredBuild; $taskVersionSource = 'matching-uninstall-registration'
    }
}
$taskSummary = [ordered]@{ installDir = $taskInstall; installedBuild = $taskCurrentBuild; installedBuildSource = $taskVersionSource; server = $taskServer; latestBuild = [int]$taskEntry.build; minimumRepairBuild = $MinimumBuild; package = $taskZip.file; size = [long]$taskZip.size; sha256 = $taskZip.sha256.ToLowerInvariant(); checkOnly = [bool]$CheckOnly }
if ($CheckOnly) { $taskSummary | ConvertTo-Json; return }
if ([int]$taskEntry.build -lt $MinimumBuild) { throw 'Máy chủ chưa phát bản sửa tự cập nhật. Thư mục game chưa bị thay đổi; thử lại sau khi bản mới được phát.' }
if ($taskCurrentBuild -ge [int]$taskEntry.build) { Write-Output 'Client hiện tại đã bằng hoặc mới hơn bản phát hành.'; return }

# Lưu gói và sao lưu trên ổ D nếu có, tránh ghi các file lớn vào TEMP ổ C.
$taskWorkBase = if ($WorkDir) { [IO.Path]::GetFullPath($WorkDir) } elseif (Test-Path -LiteralPath 'D:\' -PathType Container) { 'D:\AetherUpdateRepair' } else { Join-Path ([IO.Directory]::GetParent($taskInstall).FullName) 'AetherUpdateRepair' }
$taskRun = Join-Path $taskWorkBase ((Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N'))
$taskStage = Join-Path $taskRun 'extracted'; $taskBackup = Join-Path $taskRun 'backup'
New-Item -ItemType Directory -Path $taskStage, $taskBackup -Force | Out-Null
$taskZipPath = Join-Path $taskRun $taskZip.file
$taskSummary | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $taskRun 'request.json') -Encoding utf8
Download-Package ($taskServer + '/api/client/file/' + [Uri]::EscapeDataString($taskZip.file)) $taskZipPath ([long]$taskZip.size)
if ((Get-Item -LiteralPath $taskZipPath).Length -ne [long]$taskZip.size -or (Get-Sha $taskZipPath) -ne $taskZip.sha256.ToLowerInvariant()) {
    throw "Gói tải về sai kích thước hoặc SHA-256. Game cũ chưa bị thay đổi. Bằng chứng: $taskRun"
}
$taskArchive = [IO.Compression.ZipFile]::OpenRead($taskZipPath)
try {
    [long]$taskExpandedBytes = 0
    $taskFiles = @($taskArchive.Entries | ForEach-Object {
        Get-ChildPath $taskStage $_.FullName | Out-Null
        Get-ChildPath $taskInstall $_.FullName | Out-Null
        if ((($_.ExternalAttributes -shr 16) -band 61440) -eq 40960) { throw 'Gói cập nhật không được chứa liên kết tượng trưng.' }
        if ($_.Name) { $taskExpandedBytes += $_.Length; $_.FullName.Replace('/', '\') }
    })
} finally { $taskArchive.Dispose() }
[long]$taskBackupBytes = 0
foreach ($taskRelative in $taskFiles) {
    $taskExisting = Get-ChildPath $taskInstall $taskRelative
    if (Test-Path -LiteralPath $taskExisting -PathType Leaf) { $taskBackupBytes += (Get-Item -LiteralPath $taskExisting).Length }
}
$taskWorkDrive = [IO.DriveInfo]::new([IO.Path]::GetPathRoot($taskWorkBase))
$taskInstallDrive = [IO.DriveInfo]::new([IO.Path]::GetPathRoot($taskInstall))
$taskInstallExtra = [math]::Max(0, $taskExpandedBytes - $taskBackupBytes)
$taskRequiredWork = $taskExpandedBytes + $taskBackupBytes
if ($taskWorkDrive.Name -eq $taskInstallDrive.Name) { $taskRequiredWork += $taskInstallExtra }
if ($taskWorkDrive.AvailableFreeSpace -lt $taskRequiredWork -or $taskInstallDrive.AvailableFreeSpace -lt $taskInstallExtra) {
    throw 'Ổ đĩa chưa đủ chỗ để giải nén và giữ bản sao lưu. Game cũ chưa bị thay đổi.'
}
[IO.Compression.ZipFile]::ExtractToDirectory($taskZipPath, $taskStage)
if (-not (Resolve-ClientFolder $taskStage)) { throw 'Gói cập nhật thiếu HavenLord.exe hoặc HavenLord_Data; game cũ chưa bị thay đổi.' }

# Chỉ đóng nhẹ nhàng đúng client trong thư mục đích; không tắt tiến trình khác.
$taskExe = Join-Path $taskInstall 'HavenLord.exe'
foreach ($taskRunning in @(Get-CimInstance Win32_Process -Filter "Name='HavenLord.exe'" -ErrorAction SilentlyContinue)) {
    if ($taskRunning.ExecutablePath -and [string]::Equals([IO.Path]::GetFullPath($taskRunning.ExecutablePath), $taskExe, [StringComparison]::OrdinalIgnoreCase)) {
        $taskProcess = Get-Process -Id $taskRunning.ProcessId -ErrorAction SilentlyContinue
        if ($taskProcess -and -not $taskProcess.HasExited) {
            $taskProcess.CloseMainWindow() | Out-Null
            if (-not $taskProcess.WaitForExit(15000)) { throw 'Đóng cửa sổ game rồi chạy lại bản sửa. Chưa chép đè file game.' }
        }
    }
}
$taskBefore = @{}
foreach ($taskRelative in $taskFiles) {
    $taskDestination = Get-ChildPath $taskInstall $taskRelative
    if (Test-Path -LiteralPath $taskDestination) {
        if (-not (Test-Path -LiteralPath $taskDestination -PathType Leaf)) { throw "Đường dẫn đích đang là thư mục: $taskRelative" }
        $taskSaved = Get-ChildPath $taskBackup $taskRelative
        New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($taskSaved)) -Force | Out-Null
        Copy-Item -LiteralPath $taskDestination -Destination $taskSaved
        $taskBefore[$taskRelative] = Get-Sha $taskSaved
    }
}
$taskBefore | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $taskRun 'before-hashes.json') -Encoding utf8
$taskWritten = @()
try {
    foreach ($taskRelative in $taskFiles) {
        $taskSource = Get-ChildPath $taskStage $taskRelative; $taskDestination = Get-ChildPath $taskInstall $taskRelative
        New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($taskDestination)) -Force | Out-Null
        $taskWritten += $taskRelative
        Copy-Item -LiteralPath $taskSource -Destination $taskDestination -Force
        if ((Get-Sha $taskSource) -ne (Get-Sha $taskDestination)) { throw "Chép file không toàn vẹn: $taskRelative" }
    }
} catch {
    $taskFailure = $_; $taskRollbackErrors = @()
    foreach ($taskRelative in $taskWritten) {
        try {
            $taskDestination = Get-ChildPath $taskInstall $taskRelative
            if ($taskBefore.ContainsKey($taskRelative)) {
                if (-not (Test-Path -LiteralPath $taskDestination -PathType Leaf) -or (Get-Sha $taskDestination) -ne $taskBefore[$taskRelative]) {
                    Copy-Item -LiteralPath (Get-ChildPath $taskBackup $taskRelative) -Destination $taskDestination -Force
                    if ((Get-Sha $taskDestination) -ne $taskBefore[$taskRelative]) { throw 'Sai mã kiểm sau phục hồi.' }
                }
            } elseif (Test-Path -LiteralPath $taskDestination -PathType Leaf) {
                # Chỉ xóa chính xác file mới đã ghi trong thư mục game đã xác minh.
                Remove-Item -LiteralPath $taskDestination -Force
            }
        } catch { $taskRollbackErrors += $taskRelative }
    }
    [ordered]@{ success = $false; rolledBack = ($taskRollbackErrors.Count -eq 0); rollbackErrors = $taskRollbackErrors; error = $taskFailure.Exception.Message; backup = $taskBackup } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $taskRun 'result.json') -Encoding utf8
    if ($taskRollbackErrors.Count) { throw "Cập nhật lỗi; cần xem bản sao lưu tại $taskBackup. File chưa phục hồi: $($taskRollbackErrors -join ', ')" }
    throw "Cập nhật lỗi; đã phục hồi file cũ. $($taskFailure.Exception.Message)"
}
$taskSummary['success'] = $true; $taskSummary['backup'] = $taskBackup; $taskSummary['verifiedFiles'] = $taskFiles.Count
$taskSummary | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $taskRun 'result.json') -Encoding utf8
Write-Output ("Đã cập nhật bản {0} vào đúng thư mục: {1}" -f $taskEntry.build, $taskInstall)
Write-Output "Bản sao lưu file cũ: $taskBackup"
if (-not $NoLaunch) { Start-Process -FilePath $taskExe -WorkingDirectory $taskInstall }
