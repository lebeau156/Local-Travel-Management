$loginBody = '{"email":"inspector@usda.gov","password":"Test123!"}'

try {
    # Login
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Logged in"
    
    $headers = @{ 
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Create a trip
    $tripBody = '{"date":"2025-02-20","from_address":"Office A","to_address":"Plant B","site_name":"Test Site","purpose":"Inspection","miles_calculated":45,"lodging_cost":0,"meals_cost":25,"other_expenses":0}'
    Write-Host "Creating trip..."
    $tripResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/trips" -Method POST -Body $tripBody -Headers $headers
    Write-Host "✅ Trip created with ID: $($tripResponse.trip.id)"
    
    # Wait a moment
    Start-Sleep -Seconds 1
    
    # Check audit logs
    Write-Host "`n📋 Checking audit logs..."
    $auditResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/audit?limit=10" -Method GET -Headers $headers
    Write-Host "✅ Found $($auditResponse.total) audit log(s)"
    
    if ($auditResponse.logs.Count -gt 0) {
        $auditResponse.logs | ForEach-Object {
            Write-Host "  - Action: $($_.action) on $($_.resource_type) #$($_.resource_id) at $(Get-Date $_.created_at -Format 'HH:mm:ss')"
        }
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
}
