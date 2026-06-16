@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Restoring accidentally-staged deletions...
git restore --staged . 2>nul

echo Restoring any corrupted working-tree files from HEAD...
git restore index.html netlify.toml 2>nul

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Fix: portal-save bg_image SELECT; admin HMAC token; qr country header"

echo Pushing...
git push origin main

echo.
echo Done. Netlify deploying (2-3 min).
echo.
pause
