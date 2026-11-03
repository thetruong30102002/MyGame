$ErrorActionPreference='Stop'
$workspace=[IO.Path]::GetFullPath('D:/truong/MyGame').TrimEnd('\')+'\'
$quarantine=[IO.Path]::GetFullPath('D:/truong/MyGame/.havenlord-stage/discarded-gpt-20261102').TrimEnd('\')+'\'
New-Item -ItemType Directory -Path $quarantine -Force | Out-Null
$paths=@(
'packages/asset-pipeline/sources/layered-character/mau-1/motion-polish',
'packages/asset-pipeline/sources/layered-character/mau-1/motion-redraw-v2',
'packages/asset-pipeline/sources/layered-character/mau-1/motion-redraw-pixellab-20261102',
'apps/server/site/media/layered/class-motion-20261102',
'apps/server/site/media/layered/sword-consistency-20261102',
'apps/server/site/media/layered/weapons-redraw-20261102',
'apps/server/site/media/layered/pixellab-combo-20261102',
'apps/server/site/media/layered/motion-polish-20261102',
'packages/asset-pipeline/src/layered/motionPresentation.ts',
'packages/asset-pipeline/tests/layered-motion.test.ts',
'scripts/note-motion-polish-20261102.mts',
'.havenlord-stage/motion-polish/after',
'.havenlord-stage/motion-polish/before',
'.havenlord-stage/motion-polish/game-qa',
'.havenlord-stage/motion-polish/genshin-reference',
'.havenlord-stage/motion-polish/locked-comparison-frames',
'.havenlord-stage/motion-polish/native-frames',
'.havenlord-stage/motion-polish/other-class-frames'
)
$paths+=Get-ChildItem -LiteralPath ($workspace+'.havenlord-stage/motion-polish') -File | Where-Object {$_.Extension -in @('.ts','.mts','.mjs','.py','.png','.gif','.webp')} | ForEach-Object {[IO.Path]::GetRelativePath($workspace,$_.FullName)}
$moved=0
foreach($relative in $paths){
 $from=[IO.Path]::GetFullPath((Join-Path $workspace $relative))
 $to=[IO.Path]::GetFullPath((Join-Path $quarantine ($relative.Replace('/','__').Replace('\','__'))))
 if(-not $from.StartsWith($workspace,[StringComparison]::OrdinalIgnoreCase) -or -not $to.StartsWith($quarantine,[StringComparison]::OrdinalIgnoreCase)){throw 'Unsafe path'}
 if(Test-Path -LiteralPath $from){if(Test-Path -LiteralPath $to){throw "Đích đã tồn tại: $to"};Move-Item -LiteralPath $from -Destination $to;$moved++}
}
"Isolated $moved discarded experiments outside source, website and build inputs; no permanent deletion."
