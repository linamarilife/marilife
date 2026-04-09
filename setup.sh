#!/bin/bash

echo "🚀 Setting up ACA Insurance Savings Funnel"
echo "=========================================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Node.js $(node --version) and npm $(npm --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Setup Prisma
echo "🗄️ Setting up database..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to push database schema"
    exit 1
fi

echo "✅ Database setup complete"

# Create initial data if needed
echo "📝 Creating initial data..."
cat > /tmp/test_lead.sql << 'EOF'
-- Test data can be inserted here if needed
EOF

echo "✅ Initial data ready"

# Build the project
echo "🏗️ Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Copy example env file if .env doesn't exist
if [ ! -f .env ]; then
  echo "📄 Creating .env file from example..."
  cp .env.example .env
  echo "⚠️  Please update .env with your actual API keys"
fi

# Instructions
echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "  cd /home/lina/Escritorio/aca-funnel"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "📋 NEXT STEPS FOR PRODUCTION:"
echo ""
echo "1. API Integrations:"
echo "   • HealthSherpa: Get API key from https://developers.healthsherpa.com/"
echo "   • Twilio: Get credentials from https://www.twilio.com/ (for SMS follow-ups)"
echo "   • Update .env with your actual keys"
echo ""
echo "2. Database for production:"
echo "   • Change DATABASE_URL to PostgreSQL in .env"
echo "   • Run: npx prisma db push"
echo ""
echo "3. Deployment:"
echo "   • Vercel: npm run build && vercel --prod"
echo "   • Docker: Dockerfile included in project"
echo ""
echo "4. Auto follow-ups (Twilio cron job):"
echo "   • Set up cron: 0 * * * * node /path/to/scripts/twilio-followup.js"
echo "   • Test: node scripts/twilio-followup.js"
echo ""
echo "5. Compliance:"
echo "   • Add Privacy Policy and Terms of Service pages"
echo "   • Ensure TCPA compliance for SMS"
echo "   • Add agent licensing information"
echo ""
echo "Need help? Check README.md for detailed instructions."