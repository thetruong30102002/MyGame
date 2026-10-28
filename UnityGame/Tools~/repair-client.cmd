@echo off
setlocal
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0repair-client.ps1" %*
set "RepairExitCode=%ERRORLEVEL%"
if not "%RepairExitCode%"=="0" pause
exit /b %RepairExitCode%
