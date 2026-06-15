@echo off
cd /d C:\Users\Laign\TorroLink
if exist .git\index.lock del /f .git\index.lock
git add netlify/functions/portal.js netlify/functions/portal-save.js netlify/functions/profile.js index.html terms.html schema.sql
git commit -m "Fix: social URLs, improved patterns (camo/leopard/tropical), custom bg photo, remove US250th, ToS page"
git push
echo.
echo === DONE — Netlify is deploying ===
echo.
echo IMPORTANT: Run this SQL in Supabase SQL Editor:
echo ALTER TABLE profiles ADD COLUMN IF NOT EXISTS background_image text;
echo.
pause
