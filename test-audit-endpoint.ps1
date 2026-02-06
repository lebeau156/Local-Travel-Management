$loginBody = @{
    email = "inspector@usda.gov"
    password = "Test123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful"
    Write-Host "Token: $($token.Substring(0,30))..."
    
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    Write-Host "`n📋 Testing /api/audit endpoint..."
    $auditResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/audit?limit=10" -Method GET -Headers $headers
    Write-Host "✅ Audit endpoint works!"
    Write-Host "Total logs: $($auditResponse.total)"
    Write-Host "Logs returned: $($auditResponse.logs.Count)"
    
    if ($auditResponse.logs.Count -gt 0) {
        Write-Host "`nFirst log:"
        $auditResponse.logs[0] | ConvertTo-Json
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body:" $responseBody
    }
}
