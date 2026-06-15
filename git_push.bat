@echo off
cd /d C:\Users\Laign\TorroLink
if exist ".git\index.lock" del ".git\index.lock"
git add -A
git commit -m "Fix: anon key for metrics/portal-save profile reads; lead-notify anon INSERT; portal.js regex+apostrophe; GRANT SQL docs" --allow-empty
git push --force-with-lease origin main
echo.
echo Done! Press any key to close.
pause
