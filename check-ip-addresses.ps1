$loginBody = '{"email":"inspector@usda.gov","password":"Test123!"}'
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }
$auditResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/audit?limit=10" -Method GET -Headers $headers

Write-Host "Checking IP addresses in audit logs:"
$auditResponse.logs | Select-Object id,action,resource_type,ip_address | Format-Table
