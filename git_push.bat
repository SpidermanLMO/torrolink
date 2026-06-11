@echo off
cd /d "C:\Users\Laign\TorroLink"
if exist ".git\index.lock" del ".git\index.lock"
git add -A
git commit -m "Fix: replace incorrect face painter photo"
git push
echo.
echo Done! Press any key to close.
pause
