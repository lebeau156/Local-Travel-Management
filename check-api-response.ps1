$loginBody = '{"email":"inspector@usda.gov","password":"Test123!"}'
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }
$auditResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/audit?limit=1" -Method GET -Headers $headers

Write-Host "First audit log (full response):"
$auditResponse.logs[0] | ConvertTo-Json -Depth 3
