# Google Maps API Setup Script
# Run this script to create your .env file

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Google Maps API Configuration Setup  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
if (Test-Path "backend/.env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host "📖 Please read GOOGLE_MAPS_SETUP.md for detailed instructions" -ForegroundColor Green
Write-Host ""
Write-Host "Do you have a Google Maps API key?" -ForegroundColor Yellow
Write-Host "  1) Yes, I have an API key"
Write-Host "  2) No, I'll use mock mileage for now"
Write-Host ""

$choice = Read-Host "Enter your choice (1 or 2)"

$apiKey = ""
if ($choice -eq "1") {
    Write-Host ""
    $apiKey = Read-Host "Enter your Google Maps API key"
    if ($apiKey -eq "") {
        Write-Host "⚠️  No key entered, will use mock mileage" -ForegroundColor Yellow
    } else {
        Write-Host "✅ API key will be configured" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Will use mock mileage (random 10-60 miles)" -ForegroundColor Green
}

# Create .env file
$envContent = @"
# Backend Environment Variables

# Google Maps API Key (get from: https://console.cloud.google.com/)
# Leave empty to use mock mileage calculation
# See GOOGLE_MAPS_SETUP.md for detailed setup instructions
GOOGLE_MAPS_API_KEY=$apiKey

# Server Port
PORT=5000

# JWT Secret (change in production!)
JWT_SECRET=usda-travel-mileage-secret-key-2026-change-in-production
"@

$envContent | Out-File -FilePath "backend/.env" -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Configuration Complete!            " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

if ($apiKey -ne "") {
    Write-Host "🗺️  Google Maps API: ENABLED" -ForegroundColor Green
    Write-Host "   Your trips will use real driving distances" -ForegroundColor White
} else {
    Write-Host "🎲 Mock Mileage: ENABLED" -ForegroundColor Yellow
    Write-Host "   Trips will use random mileage (10-60 miles)" -ForegroundColor White
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart the backend server" -ForegroundColor White
Write-Host "  2. Create a test trip to verify mileage calculation" -ForegroundColor White
Write-Host ""
Write-Host "📖 For API setup help, see: GOOGLE_MAPS_SETUP.md" -ForegroundColor Gray
