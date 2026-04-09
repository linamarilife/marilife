#!/bin/bash

# Launch script for ACA Insurance Savings Funnel

cd "$(dirname "$0")"

echo "🚀 Launching ACA Insurance Savings Funnel..."
echo "=========================================="

# Check if already running
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️  Server is already running on port 3000"
  echo "   Opening browser..."
  xdg-open http://localhost:3000 2>/dev/null || open http://localhost:3000 2>/dev/null
  exit 0
fi

# Start the development server
echo "Starting development server..."
npm run dev &

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Check if server started successfully
if curl -s http://localhost:3000 > /dev/null; then
  echo "✅ Server is running!"
  echo "🌐 Open your browser to: http://localhost:3000"
  
  # Try to open browser
  xdg-open http://localhost:3000 2>/dev/null || \
  open http://localhost:3000 2>/dev/null || \
  echo "   Please open http://localhost:3000 in your browser"
else
  echo "❌ Server failed to start"
  echo "   Check the logs above for errors"
  exit 1
fi

echo ""
echo "📋 Useful commands:"
echo "   • Stop server: Ctrl+C"
echo "   • View logs: tail -f logs.txt"
echo "   • Admin: http://localhost:3000/api/lead (GET for leads)"
echo "   • Health: http://localhost:3000/api/health"
echo ""
echo "🔧 Configuration:"
echo "   • Edit .env file to add API keys"
echo "   • Run ./setup.sh for initial setup"
echo ""

# Keep script running
wait