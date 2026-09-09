@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22.12 or later, then run this file again.
  pause
  exit /b 1
)
if exist "dist\index.html" (
  echo Starting the included game build. No installation needed.
  node serve.mjs --open
  exit /b
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Installing the game dependencies...
  call npm ci --no-audit --no-fund
  if errorlevel 1 (
    echo Installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
echo Starting Cinder Circuit. Keep this window open while playing.
call npm run dev -- --open --port 5173
