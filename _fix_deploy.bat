@echo off
cd /d C:\Laign\Torrolink

:: Try to find git — check common install locations if not in PATH
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

:: Set identity (required for commits)
%GIT% config --global user.email "laign@ptorro.com"
%GIT% config --global user.name "Laign"

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Staging all changes...
%GIT% add -A

echo Committing...
%GIT% commit -m "Profile: Show QR button + TorroLink CTA moved to bottom of all profiles"

echo Pushing...
%GIT% push origin main

echo.
echo Done! Netlify deploying (2-3 min).
echo.
pause
