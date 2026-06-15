@echo off
cd /d "C:\Users\Laign\TorroLink"

if exist ".git\index.lock" del ".git\index.lock"

git add -A

git commit -m "Feature: reviews system, content blocks (updates/menu/services), hero layout, SVG icons, US flag, QR styling"

git push --force-with-lease origin main

echo Done! Check Netlify for deployment status.
pause
