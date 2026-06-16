@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Overnight s3: portal markDirty complete coverage (images+pattern+cardstyle+photolayout+qrdot+content+drag+checkbox); profile fetchpriority LCP; toEmbedUrl security+escHtml; portal-save video URL allowlist; netlify.toml truncation fix"

echo Pushing...
git push origin main

echo.
echo Done! Netlify deploying (2-3 min).
echo.
pause
