@echo off
cd /d "%~dp0"
title Origin Retail OS — Lanceur
color 0F
setlocal enabledelayedexpansion

:: ==================================================
:: Origin Retail OS — Lanceur Tout-en-Un
:: ==================================================
:: Premier lancement : installe les modules + crée raccourci
:: Lancements suivants : démarre serveur + Chrome + WhatsApp
:: Menu : scanner réseau, état, config
:: ==================================================

set PORT=8080
set PROJECT_DIR=%~dp0
set DATA_DIR=%PROJECT_DIR%data
set MARKER=%DATA_DIR%\.installed
set NODE_MODULES=%PROJECT_DIR%node_modules

:MENU
cls
echo ================================================
echo    Origin Retail OS — ERP Boutique
echo    Serveur local + WhatsApp + Scan reseau
echo ================================================
echo.
echo  Dossier: %PROJECT_DIR%
echo.

:: Vérifier Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%v in ('node --version') do set NODE_VER=%%v
    echo  [OK] Node.js %NODE_VER%
) else (
    echo  [!!] Node.js non installe
)

:: Vérifier modules
if exist "%NODE_MODULES%\package.json" (
    echo  [OK] Modules npm installes
) else (
    echo  [??] Modules npm manquants
)

:: Vérifier serveur
netstat -ano 2>nul | findstr ":%PORT% " | findstr LISTEN >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Serveur sur port %PORT%
) else (
    echo  [..] Serveur arrete
)

echo.
echo  ========== MENU ==========
echo  [1] Demarrer ERP + Chrome + WhatsApp
echo  [2] Scanner le reseau (rapide)
echo  [3] Scanner le reseau (complet)
echo  [4] Forcer l'arret du serveur
echo  [5] Etat du systeme
echo  [6] Installer les modules npm
echo  [7] Creer un raccourci Bureau
echo  [8] Lire la FAQ de l'agent WhatsApp
echo  [9] Quitter
echo.
set /p CHOIX="  Votre choix [1]: "

if "%CHOIX%"=="" goto START_ALL
if "%CHOIX%"=="1" goto START_ALL
if "%CHOIX%"=="2" goto SCAN_QUICK
if "%CHOIX%"=="3" goto SCAN_FULL
if "%CHOIX%"=="4" goto KILL_PORT
if "%CHOIX%"=="5" goto SHOW_STATUS
if "%CHOIX%"=="6" goto INSTALL_NPM
if "%CHOIX%"=="7" goto CREATE_SHORTCUT
if "%CHOIX%"=="8" goto SHOW_FAQ
if "%CHOIX%"=="9" goto END
goto MENU

:: ==============================================
:: PREMIER LANCEMENT
:: ==============================================
:FIRST_RUN
cls
echo ================================================
echo           PREMIERE INSTALLATION
echo ================================================
echo.

:: Vérifier Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ATTENTION] Node.js n'est pas installe.
    echo.
    echo Un installeur Node.js est fourni sur la cle USB :
    if exist "%PROJECT_DIR%node-installer\node-*-x64.msi" (
        echo    Dossier: node-installer\
        echo.
        echo  Lancez 'install-node.bat' dans ce dossier pour
        echo  installer Node.js automatiquement (hors ligne).
    ) else (
        echo    (non trouve sur la cle, telechargez-le depuis https://nodejs.org)
    )
    echo.
    echo *Apres* avoir installe Node.js, relancez ce programme.
    echo.
    pause
    goto MENU
)

:: Vérifier et installer les dépendances
if not exist "%NODE_MODULES%\package.json" (
    goto INSTALL_NPM
)

:: Créer le raccourci bureau si pas déjà fait
if not exist "%USERPROFILE%\Desktop\Origin Retail OS.cmd" (
    goto CREATE_SHORTCUT
)

:: Marquer comme installé
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
echo Installe: %DATE% %TIME% > "%MARKER%"

echo.
echo ================================================
echo    Installation terminee avec succes !
echo ================================================
echo.
echo  L'ERP va maintenant demarrer automatiquement.
echo  A chaque fois, double-cliquez sur ce fichier
echo  ou sur le raccourci 'Origin Retail OS' sur le Bureau.
echo.
pause
goto START_ALL

:: ==============================================
:: INSTALLER NODE.JS
:: ==============================================
:INSTALL_NODE_JS
cls
echo Installation de Node.js...
echo.
echo Methode 1: Installation via winget (recommande)
winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements 2>nul
if %errorlevel% equ 0 (
    echo Node.js installe avec succes via winget !
    goto :FIRST_RUN
)

echo Methode 2: Installation via MSI
echo Installation automatique depuis nodejs.org...
powershell -Command "& {try { $wc = New-Object System.Net.WebClient; $page = $wc.DownloadString('https://nodejs.org/dist/latest-v22.x/'); $msi = [regex]::Match($page, 'node-v[\d\.]+-x64\.msi').Value; if ($msi) { Write-Host 'Telechargement de ' $msi; $wc.DownloadFile('https://nodejs.org/dist/latest-v22.x/' + $msi, \"$env:TEMP\\$msi\"); Start-Process msiexec.exe -ArgumentList \"/i `\"$env:TEMP\\$msi`\" /qn /norestart\" -Wait; Write-Host 'Installation terminee !' } else { Write-Host 'MSI non trouve' } } catch { Write-Host 'Erreur: ' + $_.Exception.Message }}"

echo.
echo Si l'installation automatique a echoue, telechargez Node.js manuellement:
echo https://nodejs.org
echo.
echo Appuyez sur une touche quand Node.js est installe...
pause >nul
goto FIRST_RUN

:: ==============================================
:: INSTALLER LES DEPENDANCES NPM
:: ==============================================
:INSTALL_NPM
cls
echo.
echo ================================================
echo    Installation des dependances npm
echo ================================================
echo.
echo  Cette operation necessite une connexion Internet
echo  pour la premiere installation.
echo.
pause
echo.
cd /d "%PROJECT_DIR%"
call npm.cmd install
if %errorlevel% equ 0 (
    echo.
    echo [OK] Dependances installees avec succes !
) else (
    echo.
    echo [ERREUR] Echec de l'installation.
    echo Verifiez votre connexion Internet et reessayez.
)
echo.
pause
goto MENU

:: ==============================================
:: DEMARRER TOUT (SERVEUR + CHROME + WHATSAPP)
:: ==============================================
:START_ALL
cls
echo ================================================
echo    Demarrage de Origin Retail OS...
echo ================================================
echo.

:: Vérifier première installation
if not exist "%MARKER%" (
    if not exist "%NODE_MODULES%\package.json" (
        goto FIRST_RUN
    )
)

:: Tuer l'ancien processus si existant
netstat -ano 2>nul | findstr ":%PORT% " | findstr LISTEN >nul 2>&1
if !errorlevel! equ 0 (
    echo [INFO] Ancien serveur sur le port %PORT%, arret en cours...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTEN') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

:: Demander le mode
set MODE_WHATSAPP=
echo  Mode de demarrage:
echo  [1] ERP seul (rapide)
echo  [2] ERP + Agent WhatsApp (QR code)
echo.
set /p MODE_CHOICE="  Votre choix [1]: "
if "%MODE_CHOICE%"=="2" set MODE_WHATSAPP=1

:: Démarrer le serveur (dans une nouvelle fenêtre)
echo [1/3] Demarrage du serveur...
if defined MODE_WHATSAPP (
    start "Origin ERP + WhatsApp" /D "%PROJECT_DIR%" cmd /k "title Origin ERP + WhatsApp && color 0A && echo ============================================ && echo   Origin ERP + Agent WhatsApp && echo ============================================ && echo. && set WHATSAPP_ENABLED=true && npm.cmd start"
    echo [OK] Serveur + WhatsApp demarres
) else (
    start "Origin ERP Server" /MIN /D "%PROJECT_DIR%" cmd /c "title Origin ERP Server && npm.cmd start"
    echo [OK] Serveur demarre
)

:: Attendre que le serveur soit prêt
echo       Attente du serveur...
set SERVER_READY=
for /l %%i in (1,1,10) do (
    timeout /t 1 /nobreak >nul
    netstat -ano 2>nul | findstr ":%PORT% " | findstr LISTEN >nul 2>&1
    if !errorlevel! equ 0 (
        set SERVER_READY=1
        goto SERVER_READY
    )
)
:SERVER_READY
if defined SERVER_READY (
    echo [OK] Serveur pret sur http://localhost:%PORT%/app.html
) else (
    echo [??] Port %PORT% non detecte, mais peut-etre en demarrage...
)

:: Ouvrir Chrome
echo [2/3] Ouverture du navigateur...
if exist "%PROGRAMFILES%\Google\Chrome\Application\chrome.exe" (
    start "" "%PROGRAMFILES%\Google\Chrome\Application\chrome.exe" --app=http://localhost:%PORT%/app.html --no-first-run
    echo [OK] Chrome ouvert en mode app
) else if exist "%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe" --app=http://localhost:%PORT%/app.html --no-first-run
    echo [OK] Chrome ouvert en mode app
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --app=http://localhost:%PORT%/app.html --no-first-run
    echo [OK] Chrome ouvert en mode app
) else (
    start http://localhost:%PORT%/app.html
    echo [OK] Navigateur par defaut ouvert
)

echo.
echo [3/3] Demarrage termine
echo.
echo ================================================
echo    Origin Retail OS est en cours d'execution
echo ================================================
echo.
echo  App Chrome: http://localhost:%PORT%/app.html
echo.
if defined MODE_WHATSAPP (
    echo  WhatsApp: scannez le QR code dans la fenetre serveur
) else (
    echo  WhatsApp: non active (relancez avec l'option 2 pour le QR code)
)
echo.
echo  Appuyez sur CTRL+C dans les fenetres pour arreter.
echo.
echo  Appuyez sur une touche pour revenir au menu...
pause >nul
goto MENU

:: ==============================================
:: SCANNER RESEAU RAPIDE
:: ==============================================
:SCAN_QUICK
cls
echo ================================================
echo    Scan reseau rapide (ARP)
echo ================================================
echo.

echo Table ARP :
echo.
arp -a
echo.
echo ------------------------------------------------
echo.
echo Pour acceder a l'ERP depuis une autre machine:
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    echo   http://%%a:%PORT%/app.html
)
echo.
echo Sur le telephone/tablette (meme WiFi):
echo   Ouvrez le navigateur et tapez l'une des URLs ci-dessus
echo.
pause
goto MENU

:: ==============================================
:: SCANNER RESEAU COMPLET
:: ==============================================
:SCAN_FULL
cls
echo ================================================
echo    Scan reseau complet (Node.js)
echo ================================================
echo.
echo Utilisation du script Node.js pour un scan plus precis...
echo.
if exist "%PROJECT_DIR%scripts\network-scanner.js" (
    cd /d "%PROJECT_DIR%"
    node scripts/network-scanner.js
) else (
    echo [ERREUR] Script network-scanner.js introuvable.
    echo Utilisation de la methode ARP alternative...
    goto SCAN_QUICK
)
echo.
pause
goto MENU

:: ==============================================
:: TUER LE SERVEUR
:: ==============================================
:KILL_PORT
cls
echo ================================================
echo    Arret du serveur (port %PORT%)
echo ================================================
echo.
netstat -ano 2>nul | findstr ":%PORT% " | findstr LISTEN >nul 2>&1
if %errorlevel% equ 0 (
    echo Recherche du processus sur le port %PORT%...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTEN') do (
        echo PID trouve: %%a
        taskkill /F /PID %%a >nul 2>&1
        echo [OK] Processus tue.
    )
) else (
    echo [OK] Aucun processus sur le port %PORT%.
)
echo.
pause
goto MENU

:: ==============================================
:: ETAT DU SYSTEME
:: ==============================================
:SHOW_STATUS
cls
echo ================================================
echo    Etat du systeme
echo ================================================
echo.

:: Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%v in ('node --version') do echo Node.js: %%v
) else (
    echo Node.js: NON INSTALLE
)

:: npm
npm.cmd --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%v in ('npm.cmd --version') do echo npm:     %%v
) else (
    echo npm:     NON INSTALLE
)

:: Modules
if exist "%NODE_MODULES%" (
    for /f %%s in ('dir /s /b "%NODE_MODULES%" 2^>nul ^| find /c ""') do set COUNT=%%s
    echo Modules: INSTALLES
) else (
    echo Modules: NON INSTALLES
)

:: Serveur
netstat -ano 2>nul | findstr ":%PORT% " | findstr LISTEN >nul 2>&1
if %errorlevel% equ 0 (
    echo Serveur: EN COURS (port %PORT%)
) else (
    echo Serveur: ARRETE
)

:: Données
if exist "%DATA_DIR%\erp-state.json" (
    for /f %%s in ('dir /b "%DATA_DIR%\erp-state.json"') do set SIZE=%%s
    echo Donnees: PRESENTES
) else (
    echo Donnees: AUCUNE
)

:: Projet
echo Projet:  %PROJECT_DIR%

:: Version EXE
if exist "%PROJECT_DIR%OriginRetailOS.exe" (
    echo Launcher: PRESENT
) else (
    echo Launcher: VERSION BATCH
)

echo.
echo Date: %DATE% %TIME%
echo.
pause
goto MENU

:: ==============================================
:: CREER RACCOURCI BUREAU
:: ==============================================
:CREATE_SHORTCUT
cls
echo ================================================
echo    Creation du raccourci Bureau
echo ================================================
echo.
set SHORTCUT=%USERPROFILE%\Desktop\Origin Retail OS.cmd

:: Créer le fichier de raccourci
echo @echo off > "%SHORTCUT%"
echo cd /d "%PROJECT_DIR%" >> "%SHORTCUT%"
echo start "" "%~f0" >> "%SHORTCUT%"
echo exit >> "%SHORTCUT%"

if exist "%SHORTCUT%" (
    echo [OK] Raccourci cree: %SHORTCUT%
    echo.
    echo Desormais, double-cliquez sur 'Origin Retail OS.cmd'
    echo sur le Bureau pour lancer l'application.
) else (
    echo [ERREUR] Impossible de creer le raccourci.
)
echo.
pause
goto MENU

:: ==============================================
:: AFFICHER FAQ
:: ==============================================
:SHOW_FAQ
if exist "%PROJECT_DIR%FAQ_AGENT_WHATSAPP.md" (
    notepad "%PROJECT_DIR%FAQ_AGENT_WHATSAPP.md"
) else (
    echo Fichier FAQ introuvable.
    timeout /t 2 >nul
)
goto MENU

:: ==============================================
:: FIN
:: ==============================================
:END
cls
echo.
echo  Au revoir !
echo.
timeout /t 2 >nul
exit /b 0
