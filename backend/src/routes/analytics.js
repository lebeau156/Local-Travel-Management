const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorize } = require('../middleware/auth');

console.log('🔷 Analytics routes loading...');

// Analytics routes - accessible by admin and fleet_manager
router.use(authenticateToken, authorize('admin', 'fleet_manager'));

// Filter options for advanced filtering
router.get('/filter-options', analyticsController.getFilterOptions);

// Overview and statistics
router.get('/overview', analyticsController.getAnalyticsOverview);
router.get('/monthly-comparison', analyticsController.getMonthlyComparison);
router.get('/expense-breakdown', analyticsController.getExpenseBreakdown);
router.get('/top-routes', analyticsController.getTopRoutes);
router.get('/supervisor-metrics', analyticsController.getSupervisorMetrics);
router.get('/year-over-year', analyticsController.getYearOverYearComparison);

// Custom reports
router.get('/custom-report', analyticsController.generateCustomReport);

console.log('✅ Analytics routes loaded');

module.exports = router;
