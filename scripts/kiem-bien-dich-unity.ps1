# Biên dịch C# bằng Roslyn đi kèm Unity, không cần SDK .NET. Không thay DLL trong Library hoặc bản game đã build.
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskProject = Join-Path $taskRoot 'UnityGame'
$taskOutput = Join-Path $taskRoot '.aether-stage/kiem-bien-dich'
New-Item -ItemType Directory -Force -Path $taskOutput | Out-Null
$taskClientRsp = Get-ChildItem -LiteralPath (Join-Path $taskProject 'Library/Bee/artifacts') -Recurse -Filter 'Aether.Client.rsp' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$taskEditorRsp = Get-ChildItem -LiteralPath (Join-Path $taskProject 'Library/Bee/artifacts') -Recurse -Filter 'Aether.Editor.rsp' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $taskClientRsp -or -not $taskEditorRsp) { throw 'Cần Library/Bee của dự án đã mở bằng Unity ít nhất một lần.' }
$taskEditorDir = $null
foreach ($taskLine in (Get-Content -LiteralPath $taskClientRsp.FullName)) {
    if ($taskLine -match '^-r:"(.*/Editor)/Data/NetStandard/') { $taskEditorDir = $Matches[1]; break }
}
if (-not $taskEditorDir) { throw 'Không xác định được thư mục Unity từ response file.' }
$taskDotnet = Join-Path $taskEditorDir 'Data/NetCoreRuntime/dotnet.exe'
$taskCompiler = Join-Path $taskEditorDir 'Data/DotNetSdkRoslyn/csc.dll'
Push-Location -LiteralPath $taskProject
try {
    foreach ($taskKind in @('Client', 'Editor')) {
        $taskOriginal = if ($taskKind -eq 'Client') { $taskClientRsp } else { $taskEditorRsp }
        $taskLines = @(Get-Content -LiteralPath $taskOriginal.FullName | Where-Object { $_ -notmatch '^[-/](out|refout|analyzer|additionalfile):' -and $_ -notmatch '^".*\.cs"$' })
        if ($taskKind -eq 'Editor') {
            $taskLines = $taskLines | ForEach-Object { if ($_ -match '^-r:.*Aether\.Client(\.ref)?\.dll"$') { '-r:"' + (Join-Path $taskOutput 'Aether.Client.ref.dll') + '"' } else { $_ } }
        }
        $taskLines += '-out:"' + (Join-Path $taskOutput ('Aether.' + $taskKind + '.dll')) + '"'
        $taskLines += '-refout:"' + (Join-Path $taskOutput ('Aether.' + $taskKind + '.ref.dll')) + '"'
        $taskSourceDir = Join-Path $taskProject ('Assets/Aether/' + $taskKind)
        $taskLines += Get-ChildItem -LiteralPath $taskSourceDir -Recurse -Filter '*.cs' | ForEach-Object { '"' + $_.FullName + '"' }
        $taskRspPath = Join-Path $taskOutput ($taskKind.ToLowerInvariant() + '.rsp')
        Set-Content -LiteralPath $taskRspPath -Value $taskLines -Encoding UTF8
        & $taskDotnet $taskCompiler ('@' + $taskRspPath)
        if ($LASTEXITCODE -ne 0) { throw ('Biên dịch ' + $taskKind + ' lỗi: ' + $LASTEXITCODE) }
        Write-Output ('PASS C# ' + $taskKind + ' (tham chiếu DLL Unity/Library hiện có; không phải import/play-mode test)')
    }
} finally { Pop-Location }
