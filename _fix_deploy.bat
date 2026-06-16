@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Overnight polish: gallery tab complete, sub-picker UX, share+vCard buttons, SEO meta, 404 redesign, vcard.js, mobile scroll tabs, save flash, caching headers"

echo Pushing...
git push origin main

echo.
echo Done! Netlify deploying (2-3 min).
echo.
pause
