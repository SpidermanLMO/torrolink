@echo off
cd /d C:\Users\Laign\TorroLink
if exist ".git\index.lock" del ".git\index.lock"
git add -A
git commit -m "Fix webhook body encoding; add manual order recovery function"
git push origin main
echo.
echo Done! Press any key to close.
pause
