@echo off
cd /d C:\Laign\Claude\Torrolink

:: Find git
where git >nul 2>&1
if %errorlevel% neq 0 (
  if exist "C:\Program Files\Git\cmd\git.exe" (
    set GIT="C:\Program Files\Git\cmd\git.exe"
  ) else if exist "C:\Program Files (x86)\Git\cmd\git.exe" (
    set GIT="C:\Program Files (x86)\Git\cmd\git.exe"
  ) else (
    echo ERROR: Git not found. Please reinstall from https://git-scm.com
    pause
    exit /b 1
  )
) else (
  set GIT=git
)

:: Identity (required for commits)
%GIT% config --global user.email "laign@ptorro.com"
%GIT% config --global user.name "Laign"

:: Remove a stale lock if present
if exist ".git\index.lock" del /f /q ".git\index.lock"

:: Self-heal a corrupt git index using git only (NO file deletion).
:: read-tree rebuilds the index from HEAD; working files are never touched.
echo Checking git index...
%GIT% status >nul 2>&1
if errorlevel 1 (
  echo Index unhealthy - rebuilding from HEAD...
  %GIT% read-tree HEAD
)

echo Staging changes...
%GIT% add -A

echo Committing...
%GIT% commit -m "deploy: ptorro-digital favicon + pending site/agent/pricing updates"

echo Pushing...
%GIT% push origin main

echo.
echo Done. Netlify deploying (2-3 min).
echo.
pause
