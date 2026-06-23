@echo off
title Origin Retail OS - Lanceur
cd /d "C:\Users\hp\Desktop\projet boutique\stitch_boutique_network_erp_dashboard\stitch_boutique_network_erp_dashboard"
echo ==================================================
echo Origin Retail OS
echo ==================================================
echo.
echo Demarrage automatique:
echo - navigateur local
echo - acces distant HTTPS + QR code
echo.
echo.
echo Demarrage distant automatique...
npm.cmd run remote
goto end

:end
echo.
echo Origin Retail OS est arrete.
echo Appuyer sur une touche pour fermer.
pause >nul
