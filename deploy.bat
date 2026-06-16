@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Restoring accidentally-staged deletions...
git restore --staged . 2>nul

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Fix: profile.js crash; Admin: full dashboard with suspend/activate/metrics/free-month/email"

echo Pushing...
git push origin main

echo.
echo Done. Netlify deploying (2-3 min).
echo.
echo NEXT: Run in Supabase SQL Editor:
echo   ALTER TABLE customers ADD COLUMN IF NOT EXISTS free_until timestamptz;
echo   ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS suspended boolean default false;
echo.
pause
