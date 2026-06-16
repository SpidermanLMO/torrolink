@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Restoring accidentally-staged deletions...
git restore --staged terms.html success.html supabase-email-templates\ 2>nul

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Fix: populateThemeControls p.background_image ReferenceError"

echo Pushing...
git push origin main

echo.
echo Done. Netlify deploying now (2-3 min).
pause
