@echo off
cd /d C:\Users\Laign\TorroLink
if exist ".git\index.lock" del ".git\index.lock"
git add -A
git commit -m "Fix portal auth: server-side signup + Resend password reset; add password strength validation"
git push origin main
echo.
echo Done! Press any key to close.
pause
