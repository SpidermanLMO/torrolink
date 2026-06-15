@echo off
cd /d C:\Users\Laign\TorroLink
if exist .git\index.lock del /f .git\index.lock
git add netlify/functions/portal.js index.html styles.css
git commit -m "Fix: portal JS syntax error in renderReviewCard onclick; restore portal.js from truncation; Member Login nav"
git push
pause
