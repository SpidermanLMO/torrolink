@echo off
cd /d C:\Users\Laign\TorroLink
if exist ".git\index.lock" del ".git\index.lock"
git fetch origin
git pull --rebase origin main
git add -A
git commit -m "Fix: anon key for metrics/portal-save profile reads; lead-notify anon INSERT; portal.js regex+apostrophe; GRANT SQL docs"
git push origin main
echo.
echo Done! Press any key to close.
pause
