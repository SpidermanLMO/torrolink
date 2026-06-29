@echo off
cd /d C:\Laign\Claude\Torrolink\ptorro-digital\site

echo Deploying PTorro Digital to Netlify...
echo Site: ptorro-digital.netlify.app
echo.

npx -y @netlify/mcp@latest --site-id d90d593d-4a8f-443f-b1d0-5bd9c5ed9772 --proxy-path "https://netlify-mcp.netlify.app/proxy/eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..KOh2iFmF8c24G8eD.JIwtJmndV73i7Bo_8BSzSFh0U-95YlkBugFNobG5SkSyatrTsJx2qe7D_OPk-iZcA4G_34-93xZqHjEl0dSyVyUtoVuKVMPD6qh0YCsYxeAjWTLU-Iedoxn-0eoS5GbFi6kpN0J0yo3jJa96DIEys5Y1sYruFJm64fvV-q1JZBfd6QcRgyecWmMOn3xD9Ye1Z1MhKVl00OtfMMdXHM60aUv3maSNUpr9rAqM97XBPjt9ar9EILJYVwGjYTOuzMNWphH5S7w_4a802_6uZ8G_pJVuhS0kScq3hg31D1zt-hzDUEOLIoX7PQnsx2VthUR65A0Q_LH-7f57rWyoSnyN2masyc57soHOBuqkgb-LwcZLv4v7O4PPv7HnRTCUwv7HM1GSa9t9.kHAzB_-H8RCgSR5YlUHacA"

echo.
echo Done! Check https://ptorro-digital.netlify.app
pause
