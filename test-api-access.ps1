echo "Testing Supervisor Access to Admin Endpoints"
echo "=============================================="
echo ""

# Login as FLS
echo "1. Logging in as FLS..."
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"fls@usda.gov","password":"Test123!"}'

if ($loginResponse.token) {
    echo "   ✓ Login successful"
    $token = $loginResponse.token
    echo "   Token received: $($token.Substring(0, [Math]::Min(30, $token.Length)))..."
    
    # Test GET /api/admin/users?role=supervisor
    echo ""
    echo "2. Testing GET /api/admin/users?role=supervisor..."
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $users = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users?role=supervisor" -Headers $headers
        echo "   ✓ SUCCESS - Retrieved $($users.Count) supervisors"
        $users | ForEach-Object {
            echo "     - $($_.first_name) $($_.last_name) ($($_.position))"
        }
    } catch {
        echo "   ✗ FAILED: $($_.Exception.Message)"
        exit 1
    }
    
    # Test GET /api/supervisors/subordinates
    echo ""
    echo "3. Testing GET /api/supervisors/subordinates..."
    try {
        $subordinates = Invoke-RestMethod -Uri "http://localhost:5000/api/supervisors/subordinates" -Headers $headers
        echo "   ✓ SUCCESS - Retrieved $($subordinates.Count) team members"
        $subordinates | ForEach-Object {
            echo "     - $($_.name) ($($_.position))"
        }
    } catch {
        echo "   ✗ FAILED: $($_.Exception.Message)"
        exit 1
    }
    
    echo ""
    echo "=============================================="
    echo "✓ ALL TESTS PASSED!"
    echo ""
    echo "Next Steps:"
    echo "1. Refresh browser (Ctrl+R)"
    echo "2. Login as FLS: fls@usda.gov / Test123!"
    echo "3. Click Team Management"
    echo "4. Page should load without errors"
    echo "=============================================="
} else {
    echo "   ✗ Login failed"
    exit 1
}
