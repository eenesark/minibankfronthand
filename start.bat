@echo off
chcp 65001 > nul
title MiniBank Frontend Başlatıcı

echo ========================================================
echo       MiniBank Frontend - Gelistirme Sunucusu
echo       Hedef Backend: http://localhost:5257
echo ========================================================
echo.

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [BILGI] Ilk calistirma algilandi. Paketler yukleniyor...
    call npm.cmd install
    if errorlevel 1 (
        echo [HATA] Paketler yuklenirken bir sorun olustu. Node.js yuklu oldugundan emin olun.
        pause
        exit /b %errorlevel%
    )
)

echo [BILGI] Frontend sunucusu (http://localhost:3000) baslatiliyor...
start http://localhost:3000
call npm.cmd run dev

pause

