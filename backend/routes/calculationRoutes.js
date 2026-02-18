const express = require('express');
const router = express.Router();
const { getMealRate, getBoarderBill, getDueList } = require('../controllers/calculationController');
const { protect, authorize, tenantScope } = require('../middleware/auth');

router.use(protect);
router.use(tenantScope);

router.get('/meal-rate', authorize('admin', 'manager'), getMealRate);
router.get('/boarder-bill/:id', authorize('admin', 'manager', 'boarder'), getBoarderBill);
router.get('/due-list', authorize('admin'), getDueList);

module.exports = router;
