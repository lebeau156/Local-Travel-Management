# ============================================
# USDA TRAVEL SYSTEM - PUBLIC DEMO SETUP
# ============================================

Write-Host "`n🚀 USDA Travel Voucher System - Public Demo Setup`n" -ForegroundColor Green

# Check if servers are running
Write-Host "📊 Checking if servers are running..." -ForegroundColor Cyan

$backendPort = netstat -ano | Select-String "5000" | Select-String "LISTENING"
$frontendPort = netstat -ano | Select-String "5173" | Select-String "LISTENING"

if (!$backendPort) {
    Write-Host "❌ Backend not running on port 5000!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start backend first:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor White
    Write-Host "  node src/server.js" -ForegroundColor White
    Write-Host ""
    exit 1
}

if (!$frontendPort) {
    Write-Host "❌ Frontend not running on port 5173!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start frontend first:" -ForegroundColor Yellow
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Both servers are running!`n" -ForegroundColor Green

# Instructions for ngrok
Write-Host "📡 Next Steps: Create Public URLs with Ngrok`n" -ForegroundColor Cyan

Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host "STEP 1: Open a NEW terminal and run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ngrok http 5000" -ForegroundColor White
Write-Host ""
Write-Host "This creates a public URL for your BACKEND" -ForegroundColor Gray
Write-Host "Copy the HTTPS Forwarding URL (looks like: https://abc123.ngrok-free.app)" -ForegroundColor Gray
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host ""

Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host "STEP 2: Update frontend configuration:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Edit file: frontend/.env" -ForegroundColor White
Write-Host "  Set: VITE_API_URL=<your-backend-ngrok-url>" -ForegroundColor White
Write-Host ""
Write-Host "Example:" -ForegroundColor Gray
Write-Host "  VITE_API_URL=https://abc123.ngrok-free.app" -ForegroundColor Gray
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host ""

Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host "STEP 3: Restart frontend server:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Go to frontend terminal" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop" -ForegroundColor White
Write-Host "  Run: npm run dev" -ForegroundColor White
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host ""

Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host "STEP 4: Open ANOTHER new terminal and run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ngrok http 5173" -ForegroundColor White
Write-Host ""
Write-Host "This creates a public URL for your FRONTEND" -ForegroundColor Gray
Write-Host "Copy the HTTPS Forwarding URL (looks like: https://xyz789.ngrok-free.app)" -ForegroundColor Gray
Write-Host "=" * 60 -ForegroundColor DarkGray
Write-Host ""

Write-Host "🎉 FINAL STEP: Share the Frontend URL with USDA officials!" -ForegroundColor Green
Write-Host ""
Write-Host "Example email:" -ForegroundColor Cyan
Write-Host "  Demo URL: https://xyz789.ngrok-free.app" -ForegroundColor White
Write-Host "  Login as inspector@usda.gov / Test123!" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  IMPORTANT NOTES:" -ForegroundColor Yellow
Write-Host "  • Keep all terminals open during demo" -ForegroundColor Gray
Write-Host "  • Ngrok free tunnels expire after 2 hours" -ForegroundColor Gray
Write-Host "  • Officials may see ngrok warning - tell them to click 'Visit Site'" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Ready to go! Good luck with your presentation! 🍀`n" -ForegroundColor Green
