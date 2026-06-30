@echo off
cd /d C:\Laign\Claude\Torrolink\ptorro-digital\website

echo.
echo  PTorro Digital -- Deploy to Netlify
echo  =====================================
echo  Site:    ptorrodigital.com
echo  Site ID: d90d593d-4a8f-443f-b1d0-5bd9c5ed9772
echo  Source:  ptorro-digital\website\index.html
echo.
echo  This deploys the updated site with Netlify Forms
echo  so preview requests come straight to laign@ptorro.com.
echo.

:: Try netlify CLI first
where netlify >nul 2>&1
if %errorlevel% equ 0 (
  echo Using Netlify CLI...
  netlify deploy --prod --dir . --site d90d593d-4a8f-443f-b1d0-5bd9c5ed9772
  goto done
)

:: Fallback: npx
echo Netlify CLI not found -- using npx (first run takes ~60 sec)...
echo.
npx netlify-cli deploy --prod --dir . --site d90d593d-4a8f-443f-b1d0-5bd9c5ed9772

:done
echo.
echo  Done! Live at: https://ptorrodigital.com
echo  Check form submissions at: https://app.netlify.com/sites/ptorro-digital/forms
echo.
pause
