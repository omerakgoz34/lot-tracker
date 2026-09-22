@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Unblock-File -LiteralPath '%~dp0DEPO-LOT-TAKIP.html'" >nul 2>&1
start "" "%~dp0DEPO-LOT-TAKIP.html"
