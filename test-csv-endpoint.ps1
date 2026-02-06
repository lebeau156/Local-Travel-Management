Write-Host "Testing CSV Template Endpoint..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/csv/template" -UseBasicParsing -ErrorAction Stop
    Write-Host "Success! Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content:" -ForegroundColor Yellow
    Write-Host $response.Content
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Request failed with status code: $statusCode" -ForegroundColor Red
    
    if ($statusCode -eq 401) {
        Write-Host "Authentication required - this is expected" -ForegroundColor Yellow
        Write-Host "The endpoint requires a valid Bearer token" -ForegroundColor Yellow
    } elseif ($statusCode -eq 404) {
        Write-Host "Route not found - check backend routing" -ForegroundColor Red
    } else {
        Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    }
}
