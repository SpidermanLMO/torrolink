@echo off
cd /d C:\Users\Laign\TorroLink
if exist ".git\index.lock" del ".git\index.lock"
git add -A
git commit -m "Fix: QR dot styles + logo-in-center, image compression, schema qr_url column" --allow-empty
git push --force-with-lease origin main
echo.
echo Done! Press any key to close.
pause
