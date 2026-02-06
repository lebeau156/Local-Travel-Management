$loginBody = '{"email":"inspector@usda.gov","password":"Test123!"}'

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

$headers = @{ 
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Creating multiple actions for audit log testing..."
Write-Host ""

# Create trip 1
Write-Host "1. Creating trip 1..."
$trip1 = Invoke-RestMethod -Uri "http://localhost:5000/api/trips" -Method POST -Body '{"date":"2025-02-21","from_address":"Location A","to_address":"Location B","site_name":"Plant 1","purpose":"Inspection","miles_calculated":30,"lodging_cost":100,"meals_cost":40,"other_expenses":15}' -Headers $headers
Write-Host "   Created trip ID:" $trip1.trip.id

# Create trip 2
Write-Host "2. Creating trip 2..."
$trip2 = Invoke-RestMethod -Uri "http://localhost:5000/api/trips" -Method POST -Body '{"date":"2025-02-22","from_address":"Location B","to_address":"Location C","site_name":"Plant 2","purpose":"Inspection","miles_calculated":50,"lodging_cost":0,"meals_cost":30,"other_expenses":0}' -Headers $headers
Write-Host "   Created trip ID:" $trip2.trip.id

# Create a voucher
Write-Host "3. Creating voucher for February 2025..."
$voucher = Invoke-RestMethod -Uri "http://localhost:5000/api/vouchers" -Method POST -Body '{"month":2,"year":2025}' -Headers $headers
Write-Host "   Created voucher ID:" $voucher.voucher.id

# Update a trip
Write-Host "4. Updating trip" $trip1.trip.id "..."
$updateBody = "{`"date`":`"2025-02-21`",`"from_address`":`"Updated Location A`",`"to_address`":`"Location B`",`"site_name`":`"Plant 1`",`"purpose`":`"Inspection`",`"miles_calculated`":35,`"meals_cost`":50}"
$updated = Invoke-RestMethod -Uri "http://localhost:5000/api/trips/$($trip1.trip.id)" -Method PUT -Body $updateBody -Headers $headers
Write-Host "   Updated successfully"

Start-Sleep -Seconds 1

# Fetch audit logs
Write-Host ""
Write-Host "Fetching audit logs..."
$auditResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/audit?limit=20" -Method GET -Headers $headers
Write-Host "Total audit logs:" $auditResponse.total
Write-Host ""
Write-Host "Recent activities:"
$auditResponse.logs | Select-Object action,resource_type,resource_id,@{Name='Time';Expression={Get-Date $_.created_at -Format 'HH:mm:ss'}} | Format-Table

Write-Host "✅ Test complete! Refresh the browser to see the audit logs."
