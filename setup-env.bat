@echo off
REM Script to setup .env file with your keys
REM Run this script: setup-env.bat

echo 🔧 Setting up .env file...

(
echo # Supabase Configuration
echo SUPABASE_URL=https://xpefuiggipujeclrasfv.supabase.co
echo SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZWZ1aWdnaXB1amVjbHJhc2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzczMzcsImV4cCI6MjEwNTE1MzMzN30.ME4a70pBlpfJYCUp5_6bU5RuoqoV5sNnsMKuzDgk5X0
echo.
echo # Stripe Configuration
echo STRIPE_PUBLISHABLE_KEY=sb_publishable_XrDMPR-JsAIHoOGmW94oow_LX29m0Db
echo STRIPE_SECRET_KEY=sb_secret_2Y3X9DrniS8U721kcETP9Q_ywrLnUKp
echo.
echo # Server Configuration
echo PORT=3000
echo NODE_ENV=development
) > .env

echo ✅ .env file created successfully!
echo 📝 Make sure .env is in .gitignore (it should be already)
echo 🚀 You can now run: npm start
pause