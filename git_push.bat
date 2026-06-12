@echo off
cd /d C:\Users\Laign\TorroLink
if exist ".git\index.lock" del ".git\index.lock"
git add -A
git commit -m "Homepage: add roofer card, fix dropdown, SEO update; ungate profile-update"
git push origin main
echo.
echo Done! Press any key to close.
pause
