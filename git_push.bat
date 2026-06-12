@echo off
cd /d C:\Users\Laign\TorroLink
if exist ".git\index.lock" del ".git\index.lock"
git add -A
git commit -m "Fix dot styles in design portal; fix profile permissions"
git push origin main
echo.
echo Done! Press any key to close.
pause
