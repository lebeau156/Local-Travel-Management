const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { authenticateToken } = require('../middleware/auth');

// Order matters! More specific routes first
router.get('/all', authenticateToken, voucherController.getAllVouchers);
router.get('/inspectors', authenticateToken, voucherController.getInspectors);
router.get('/pending-fleet', authenticateToken, (req, res, next) => {
  console.log('✅ PENDING-FLEET ROUTE HIT!!!');
  voucherController.getPendingFleetVouchers(req, res, next);
});
router.get('/pending', authenticateToken, voucherController.getPendingVouchers);
router.get('/:id/pdf', authenticateToken, (req, res, next) => {
  console.log('🔍 PDF route matched! ID:', req.params.id);
  voucherController.downloadVoucherPDF(req, res, next);
});
router.get('/:id', authenticateToken, voucherController.getVoucher);
router.get('/', authenticateToken, voucherController.getVouchers);
router.post('/', authenticateToken, voucherController.createVoucher);
router.put('/:id/submit', authenticateToken, voucherController.submitVoucher);
router.put('/:id/reopen', authenticateToken, voucherController.reopenVoucher);
router.put('/:id/approve-supervisor', authenticateToken, voucherController.approveVoucherAsSupervisor);
router.put('/:id/approve-fleet', authenticateToken, voucherController.approveVoucherAsFleetManager);
router.put('/:id/reject', authenticateToken, voucherController.rejectVoucher);
router.delete('/:id', authenticateToken, voucherController.deleteVoucher);

console.log('✅ Voucher routes registered');

module.exports = router;
