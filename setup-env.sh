#!/bin/bash

# Script to setup .env file with your keys
# Run this script: bash setup-env.sh

echo "🔧 Setting up .env file..."

cat > .env << 'EOF'
# Supabase Configuration
SUPABASE_URL=https://xpefuiggipujeclrasfv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwZWZ1aWdnaXB1amVjbHJhc2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzczMzcsImV4cCI6MjEwNTE1MzMzN30.ME4a70pBlpfJYCUp5_6bU5RuoqoV5sNnsMKuzDgk5X0

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=sb_publishable_XrDMPR-JsAIHoOGmW94oow_LX29m0Db
STRIPE_SECRET_KEY=sb_secret_2Y3X9DrniS8U721kcETP9Q_ywrLnUKp

# Server Configuration
PORT=3000
NODE_ENV=development
EOF

echo "✅ .env file created successfully!"
echo "📝 Make sure .env is in .gitignore (it should be already)"
echo "🚀 You can now run: npm start"