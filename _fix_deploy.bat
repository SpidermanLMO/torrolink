@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Gallery + Docs upload; 15 pattern variants with sub-picker UX; admin enhancements; social URL fix; dupe guard"

echo Pushing...
git push origin main

echo.
echo Done! Netlify is deploying (2-3 min).
echo.
pause
