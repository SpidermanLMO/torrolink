@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Stripe: back-fill stripe_customer_id on re-purchase; Index: pricing CTA copy, Best Value badge, trust row; Styles: pricing-trust CSS"

echo Pushing...
git push origin main

echo.
echo Done! Netlify deploying (2-3 min).
echo.
pause
