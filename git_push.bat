@echo off
cd /d C:\Users\Laign\TorroLink
if exist ".git\index.lock" del ".git\index.lock"
git add -A
git commit -m "Fix: orders@torrolink.com everywhere; new pricing model (qr-code/branding/metrics); rebuild index.html for app-centric model"
git push origin main
echo.
echo Done! Press any key to close.
pause
