@echo off
cd /d C:\Laign\Claude\Torrolink\ptorro-digital\site

echo Deploying PTorro Digital to Netlify...
echo Site ID: d90d593d-4a8f-443f-b1d0-5bd9c5ed9772
echo URL: https://ptorro-digital.netlify.app
echo.

:: Try netlify CLI first (requires: npm install -g netlify-cli && netlify login)
where netlify >nul 2>&1
if %errorlevel% equ 0 (
  echo Using Netlify CLI...
  netlify deploy --prod --dir . --site d90d593d-4a8f-443f-b1d0-5bd9c5ed9772
  goto done
)

:: Fallback: use npx (slower, ~1 min first run)
echo Netlify CLI not found, using npx...
echo (Run: npm install -g netlify-cli   then   netlify login   for faster deploys)
echo.
npx netlify-cli deploy --prod --dir . --site d90d593d-4a8f-443f-b1d0-5bd9c5ed9772

:done
echo.
echo Done! https://ptorro-digital.netlify.app
echo.
pause
