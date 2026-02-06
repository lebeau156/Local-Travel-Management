$loginBody = '{"email":"inspector@usda.gov","password":"Test123!"}'

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful, token obtained"
    
    $headers = @{ Authorization = "Bearer $token" }
    
    Write-Host "Testing audit endpoint..."
    $auditResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/audit?limit=10" -Method GET -Headers $headers
    Write-Host "Success! Total logs: $($auditResponse.total)"
    Write-Host "Logs count: $($auditResponse.logs.Count)"
    
} catch {
    Write-Host "Error occurred:"
    Write-Host $_.Exception.Message
}
