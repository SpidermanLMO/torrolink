@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Index: 2 new FAQ entries (post-purchase flow, lead form); Success: 3-step next-steps guide"

echo Pushing...
git push origin main

echo.
echo Done! Netlify deploying (2-3 min).
echo.
pause
