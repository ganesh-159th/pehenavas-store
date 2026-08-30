@echo off
REM Pehenavas one-time setup (Windows)
REM - Creates .env from .env.example (if missing) with PUBLIC values pre-filled
REM - Prompts only for SECRET values (never stored in git)
REM - Installs dependencies
setlocal EnableDelayedExpansion
cd /d "%~dp0"

if not exist .env (
  echo Creating .env from .env.example (public defaults are pre-filled^)...
  copy .env.example .env >nul
) else (
  echo .env already exists - skipping creation.
)

REM ---- SECRET 1: Firebase admin service account (base64) ----
findstr /R /C:"^FIREBASE_SERVICE_ACCOUNT_B64=$" .env >nul 2>&1
if %errorlevel%==0 (
  rem Auto-detect the admin JSON in the project root
  set "KEYJSON="
  for %%f in (pehenavas-db-firebase-adminsdk-*.json) do set "KEYJSON=%%f"
  if defined KEYJSON (
    echo Found !KEYJSON! - encoding automatically...
    powershell -NoProfile -Command "$c=[IO.File]::ReadAllBytes('%KEYJSON%'); [Convert]::ToBase64String($c)" > _b64.tmp
    set /p B64=<_b64.tmp
    del _b64.tmp
    set "B64=!B64: =!"
    powershell -NoProfile -Command "(Get-Content .env) -replace '^FIREBASE_SERVICE_ACCOUNT_B64=.*', 'FIREBASE_SERVICE_ACCOUNT_B64=%B64%' | Set-Content .env"
  ) else (
    echo No Firebase admin JSON found in project root.
    set /p B64=Paste the base64 of your Firebase admin key (or press Enter to skip^): 
    if defined B64 (
      set "B64=!B64: =!"
      powershell -NoProfile -Command "(Get-Content .env) -replace '^FIREBASE_SERVICE_ACCOUNT_B64=.*', 'FIREBASE_SERVICE_ACCOUNT_B64=%B64%' | Set-Content .env"
    ) else (
      echo Skipping Firebase admin - server still runs, only admin routes limited.
    )
  )
) else (
  echo FIREBASE_SERVICE_ACCOUNT_B64 already set - skipping.
)

REM ---- SECRET 2: Gmail SMTP (App Password) ----
findstr /R /C:"^EMAIL_PASS=your-16-char-app-password$" .env >nul 2>&1
if %errorlevel%==0 (
  echo.
  echo Optional: Gmail SMTP for automated emails.
  echo Skip this - the website still works, just no emails are sent.
  set /p EU=Your Gmail address (e.g. you@gmail.com^) or press Enter to skip: 
  if defined EU (
    set /p EP=Gmail App Password (16 chars, no spaces^): 
    powershell -NoProfile -Command "(Get-Content .env) -replace '^EMAIL_USER=.*', 'EMAIL_USER=%EU%' -replace '^EMAIL_PASS=.*', 'EMAIL_PASS=%EP%' -replace '^EMAIL_FROM=.*', 'EMAIL_FROM=%EU%' | Set-Content .env"
    echo Gmail SMTP configured.
  ) else (
    echo Skipping email configuration.
  )
) else (
  echo EMAIL_PASS already set - skipping.
)

REM ---- SECRET 3: Razorpay ----
findstr /R /C:"^RAZORPAY_KEY_SECRET=$" .env >nul 2>&1
if %errorlevel%==0 (
  echo.
  echo Optional: Razorpay keys for online card/UPI payments.
  echo Get test keys from https://dashboard.razorpay.com. Skip to disable online payments.
  set /p RZID=Razorpay Key ID (or press Enter to skip^): 
  if defined RZID (
    set /p RZS=Razorpay Key Secret: 
    powershell -NoProfile -Command "(Get-Content .env) -replace '^RAZORPAY_KEY_ID=.*', 'RAZORPAY_KEY_ID=%RZID%' -replace '^VITE_RAZORPAY_KEY_ID=.*', 'VITE_RAZORPAY_KEY_ID=%RZID%' -replace '^RAZORPAY_KEY_SECRET=.*', 'RAZORPAY_KEY_SECRET=%RZS%' | Set-Content .env"
    echo Razorpay configured.
  ) else (
    echo Skipping Razorpay configuration.
  )
) else (
  echo RAZORPAY_KEY_SECRET already set - skipping.
)

echo.
echo Installing dependencies...
call npm install

echo.
echo Setup complete! Run 'npm run dev:full' to start (frontend + backend^).
echo The website works with zero further configuration.
endlocal
