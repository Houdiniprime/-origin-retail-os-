@echo off
cd /d "%~dp0"
title Installation Node.js — Origin Retail OS
color 0B
setlocal enabledelayedexpansion

:: ==================================================
:: Installation silencieuse de Node.js depuis le MSI
:: Utilisation : install-node.bat
:: Le MSI doit être dans le même dossier
:: ==================================================

:: Chercher le MSI
set MSI_FILE=
for %%f in (node-*-x64.msi) do set MSI_FILE=%%f

if not defined MSI_FILE (
    echo ================================================
    echo   ERREUR : Fichier MSI Node.js introuvable
    echo ================================================
    echo.
    echo Veuillez placer le fichier node-vXX.XX.X-x64.msi
    echo dans ce dossier et relancer ce script.
    echo.
    echo Pour telecharger : https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Vérifier si Node.js est déjà installé
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ================================================
    echo  Node.js est deja installe !
    echo ================================================
    echo.
    for /f "delims=" %%v in ('node --version') do echo  Version: %%v
    echo.
    echo Pour reinstaller, desinstallez d'abord Node.js
    echo depuis Parametres ^> Applications.
    echo.
    pause
    exit /b 0
)

echo ================================================
echo   Installation de Node.js %MSI_FILE%
echo ================================================
echo.
echo  Veuillez patienter, l'installation est silencieuse...
echo.

:: Vérifier les droits administrateur
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ATTENTION] Les droits administrateur sont necessaires.
    echo Le programme va demander l'elevation de privileges...
    echo.
    
    :: Se relancer en administrateur
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b 0
)

:: Installation silencieuse
echo  Installation en cours...
echo  (La fenetre peut sembler figee, patientez...)
echo.

msiexec /i "%MSI_FILE%" /qn /norestart ADDLOCAL=ALL

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo   Node.js installe avec succes !
    echo ================================================
    echo.
    
    :: Ajouter au PATH pour la session courante
    set "PATH=%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs;%APPDATA%\npm;%PATH%"
    
    :: Rafraîchir le PATH système
    for /f "tokens=3*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do (
        set "SYSPATH=%%a %%b"
    )
    set "PATH=%SYSPATH%;%PATH%"
    
    :: Vérifier l'installation
    node --version >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "delims=" %%v in ('node --version') do echo  Version installee: %%v
        npm --version >nul 2>&1 && (
            for /f "delims=" %%v in ('npm --version') do echo  npm version: %%v
        )
    )
    
    echo.
    echo  Vous pouvez fermer cette fenetre.
    echo.
) else (
    echo.
    echo ================================================
    echo   ERREUR : Echec de l'installation
    echo   Code d'erreur: %errorlevel%
    echo ================================================
    echo.
    echo  Causes possibles :
    echo  - Le fichier MSI est corrompu
    echo  - Vous n'avez pas les droits administrateur
    echo  - Une version anterieure de Node.js est installee
    echo.
    echo  Essayez de desinstaller Node.js d'abord, puis
    echo  de relancer ce script.
    echo.
)

pause
exit /b %errorlevel%
