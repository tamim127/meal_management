const express = require('express');
const router = express.Router();
const { getDashboard, getBoarderDashboard, getMonthlySummary } = require('../controllers/reportController');
const { protect, authorize, tenantScope } = require('../middleware/auth');

router.use(protect);
router.use(tenantScope);

router.get('/dashboard', authorize('admin', 'manager'), getDashboard);
router.get('/boarder-dashboard', authorize('boarder'), getBoarderDashboard);
router.get('/monthly-summary', authorize('admin'), getMonthlySummary);

module.exports = router;
