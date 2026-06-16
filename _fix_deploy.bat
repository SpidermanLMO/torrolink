@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Staging all changes...
git add -A

echo Committing...
git commit -m "CRITICAL: Profile: fix jsonLd module-scope crash (all profile pages 500); image onerror fallbacks; Portal: TOKEN_REFRESHED handler, 401 session-expiry handling"

echo Pushing...
git push origin main

echo.
echo Done! Netlify deploying (2-3 min).
echo.
pause
