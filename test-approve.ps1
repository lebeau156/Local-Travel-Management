# PowerShell script to test approval endpoint
$loginBody = @{
    email = "fleetmgr@usda.gov"
    password = "Test123!"
} | ConvertTo-Json

# Login
Write-Host "Logging in..."
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "Login successful, token: $($token.Substring(0,20))..."

# Approve voucher
Write-Host "`nApproving voucher 3..."
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $approveResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/vouchers/3/approve-fleet" -Method Put -Headers $headers -Body "{}"
    Write-Host "Approval successful!"
    Write-Host ($approveResponse | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "Error: $_"
    Write-Host "StatusCode:" $_.Exception.Response.StatusCode.value__
}
