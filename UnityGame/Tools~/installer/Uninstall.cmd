@echo off
rem Go cai dat Haven Lord: chay ban sao script o %TEMP% de xoa duoc ca thu muc nay (xem uninstall.ps1).
copy /y "%~dp0uninstall.ps1" "%TEMP%\havenlord-uninstall.ps1" >nul
start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%TEMP%\havenlord-uninstall.ps1" -Dir "%~dp0."
exit
