@echo off
cd /d "%~dp0"
title Installation Origin Retail OS
echo Origin Retail OS - Installation client
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-client.ps1"
echo.
echo Appuyer sur une touche pour fermer.
pause >nul
