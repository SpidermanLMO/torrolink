@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Homepage: preconnect, og:image, Twitter card, JSON-LD FAQ schema, FAQ section, social proof bar, skip-nav, sticky mobile CTA; Profile: lightbox swipe+arrows+keyboard; Portal: drag-drop gallery, SVG download, copy-link, upgrade loading state; sitemap lastmod"

echo Pushing...
git push origin main

echo.
echo Done! Netlify deploying (2-3 min).
echo.
pause
