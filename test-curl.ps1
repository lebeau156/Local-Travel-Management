# Login
$loginBody = @{
    email = "inspector@usda.gov"
    password = "Test123!"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "✅ Logged in, token: $($token.Substring(0,20))..."

# Test audit endpoint
$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "`n📋 Testing audit endpoint..."
try {
    $auditResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/audit" -Method GET -Headers $headers
    Write-Host "✅ Audit endpoint works!"
    Write-Host "Total logs: $($auditResponse.total)"
    $auditResponse.logs | ForEach-Object {
        Write-Host "  - $($_.action) on $($_.entity_type) #$($_.entity_id)"
    }
} catch {
    Write-Host "❌ Error: $_"
    Write-Host "Response: $($_.Exception.Response)"
}
