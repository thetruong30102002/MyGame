param([int]$UnityProcessId)
$ErrorActionPreference='Stop'
if(Get-Process -Id $UnityProcessId -ErrorAction SilentlyContinue){Wait-Process -Id $UnityProcessId}
if(-not(Test-Path -LiteralPath '.havenlord-stage/web-pixellab-release/mobile/index.html')){throw 'Unity chưa xuất đủ gói mobile'}
& npx tsx scripts/compress-mobile-web.mts .havenlord-stage/web-pixellab-release/mobile
if($LASTEXITCODE -ne 0){throw 'Nén mobile lỗi; chưa phát trang mới'}
& npx tsx scripts/publish-pixellab-web.mts mobile
if($LASTEXITCODE -ne 0){throw 'Phát mobile lỗi'}
