@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Portal: live password hints on signup; Profile: Google Business label, review success msg; Index: setup-time stat, compare row, modal label"

echo Pushing...
git push origin main

echo.
echo Done! Netlify deploying (2-3 min).
echo.
pause
