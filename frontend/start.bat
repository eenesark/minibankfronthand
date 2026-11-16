@echo off
chcp 65001 > nul
title MiniBank Frontend

echo [BILGI] MiniBank Frontend (http://localhost:3000) baslatiliyor...
start http://localhost:3000
call npm.cmd run dev
pause
