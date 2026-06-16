@echo off
cd /d C:\Users\Laign\TorroLink

echo Removing git lock if present...
if exist .git\index.lock del /f .git\index.lock

echo Restoring accidentally-staged deletions...
git restore --staged terms.html success.html supabase-email-templates\ 2>nul

echo Staging all changes...
git add -A

echo Committing...
git commit -m "Launch prep: stripe webhook events, privacy policy, netlify redirects, footer links"

echo Pushing...
git push origin main

echo.
echo =========================================================
echo  DONE. Netlify is deploying now (2-3 minutes).
echo.
echo  MANUAL STEPS REMAINING (see LAUNCH_CHECKLIST.md):
echo  1. Supabase SQL - run background_image migration
echo  2. Stripe Dashboard - add webhook endpoint + get secret
echo  3. Netlify env vars - add STRIPE_WEBHOOK_SECRET
echo  4. When ready to go live: swap Stripe test keys to live
echo =========================================================
echo.
pause
