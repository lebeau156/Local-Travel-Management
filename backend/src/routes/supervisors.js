const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const supervisorController = require('../controllers/supervisorController');

// Get list of all supervisors (for FLS supervisor lookup)
router.get('/list', authenticateToken, supervisorController.getSupervisorsList);

// Get available supervisors for current user to select
router.get('/available', authenticateToken, supervisorController.getAvailableSupervisors);

// Get available FLS supervisors for profile setup
router.get('/available-fls', authenticateToken, supervisorController.getAvailableFlsSupervisors);

// Get subordinates assigned to current supervisor
router.get('/subordinates', authenticateToken, supervisorController.getSubordinates);

// Assign a subordinate to a supervisor (for user management)
router.post('/assign', authenticateToken, supervisorController.assignSubordinate);

// Update current user's assigned supervisor
router.put('/assign-me', authenticateToken, supervisorController.updateAssignedSupervisor);

// Update current user's FLS supervisor
router.put('/assign-fls', authenticateToken, supervisorController.updateFlsSupervisor);

// SCSI-specific routes
router.get('/all-inspectors', authenticateToken, supervisorController.getAllInspectors);
router.post('/request-assignment/:inspectorId', authenticateToken, supervisorController.requestAssignment);
router.post('/cancel-assignment-request/:requestId', authenticateToken, supervisorController.cancelAssignmentRequest);
router.get('/assignment-requests', authenticateToken, supervisorController.getAssignmentRequests);

// FLS-specific routes (assignment request management)
router.get('/pending-assignment-requests', authenticateToken, supervisorController.getPendingAssignmentRequests);
router.post('/approve-assignment/:requestId', authenticateToken, supervisorController.approveAssignmentRequest);
router.post('/reject-assignment/:requestId', authenticateToken, supervisorController.rejectAssignmentRequest);

// FLS Dashboard Statistics
router.get('/fls-dashboard-stats', authenticateToken, supervisorController.getFlsDashboardStats);

// DDM Dashboard Statistics
router.get('/ddm-dashboard-stats', authenticateToken, supervisorController.getDdmDashboardStats);

// DM Dashboard Statistics
router.get('/dm-dashboard-stats', authenticateToken, supervisorController.getDmDashboardStats);

module.exports = router;
