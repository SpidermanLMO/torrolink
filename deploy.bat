@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Restoring accidentally-staged deletions...
git restore --staged . 2>nul

echo Restoring any corrupted working-tree files from HEAD...
git restore index.html netlify.toml script.js sitemap.xml styles.css success.html terms.html supabase-email-templates\HOW-TO-APPLY.md supabase-email-templates\magic-link.html 2>nul

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Fix: stripe-webhook duplicate profile guard; reviews GRANT; schema updated"

echo Pushing...
git push origin main

echo.
echo Done. Netlify deploying (2-3 min).
echo.
pause
