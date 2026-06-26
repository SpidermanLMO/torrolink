@echo off
setlocal enabledelayedexpansion

echo.
echo  PTorro Digital -- Deploy 8 Pitch Sites to Netlify
echo  ==================================================
echo.
echo  You need your Netlify Personal Access Token.
echo  Get it at: https://app.netlify.com/user/applications
echo  (Click "New access token", copy the value)
echo.
set /p NETLIFY_TOKEN=  Paste your token and press Enter:

if "%NETLIFY_TOKEN%"=="" (
    echo  ERROR: No token entered. Exiting.
    pause
    exit /b 1
)

set SITES_DIR=C:\Laign\Torrolink\ptorro-digital\pitch-sites
set TEMP_DIR=%TEMP%\ptorro-deploy
mkdir "%TEMP_DIR%" 2>nul

echo.
echo  Deploying all 8 sites...
echo.

call :deploy "4-a-plumber"               "b6600b31-b4ce-4ec6-9e1a-1e9a5b371135" "4aplumber-ptorro"
call :deploy "the-plumber-gary"           "8211eb23-f45c-453f-9145-07755361bccb" "theplumber-gary-ptorro"
call :deploy "capital-city-hvac"          "76bd1d40-a391-4827-8b3a-8c40def00859" "capitalcityhvac-ptorro"
call :deploy "5-star-ac-heating"          "b52448c0-b60b-4c90-b4ed-44caee7e76bd" "5starac-ptorro"
call :deploy "allison-electric"           "ea22f202-34aa-4411-8c39-c80fbcb717ef" "allisonelectric-ptorro"
call :deploy "independent-electric-hutto" "08a420eb-197f-40b0-904d-7d535ee01c96" "independentelectric-hutto"
call :deploy "revive-electric-hutto"      "43e64ecd-ea01-43a4-a882-d0c969b28a8d" "reviveelectric-ptorro"
call :deploy "pinar-fence-installers"     "7aa761d4-6e23-47e5-be1e-5d3737407ffd" "pinarfence-ptorro"

echo.
echo  ==========================================
echo  All 8 sites live! Your URLs:
echo  ==========================================
echo.
echo  4aplumber-ptorro.netlify.app
echo  theplumber-gary-ptorro.netlify.app
echo  capitalcityhvac-ptorro.netlify.app
echo  5starac-ptorro.netlify.app
echo  allisonelectric-ptorro.netlify.app
echo  independentelectric-hutto.netlify.app
echo  reviveelectric-ptorro.netlify.app
echo  pinarfence-ptorro.netlify.app
echo.
echo  Deploy pitch-lead.js too: run _fix_deploy.bat
echo.
pause
goto :eof

:deploy
set SLUG=%~1
set SITE_ID=%~2
set NAME=%~3
set ZIP_PATH=%TEMP_DIR%\%SLUG%.zip

powershell -Command "Compress-Archive -Path '%SITES_DIR%\%SLUG%\index.html' -DestinationPath '%ZIP_PATH%' -Force" >nul 2>&1

curl -s -o nul -w "  [%%{http_code}] %NAME%.netlify.app\n" ^
  -X POST "https://api.netlify.com/api/v1/sites/%SITE_ID%/deploys" ^
  -H "Authorization: Bearer %NETLIFY_TOKEN%" ^
  -H "Content-Type: application/zip" ^
  --data-binary "@%ZIP_PATH%"

goto :eof
