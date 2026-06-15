@echo off
cd /d C:\Users\Laign\TorroLink
if exist ".git\index.lock" del ".git\index.lock"
git add -A
git commit -m "Fix: lead-notify anon key for leads INSERT; portal.js regex+apostrophe; schema GRANT docs"
git push origin main
echo.
echo Done! Press any key to close.
pause
