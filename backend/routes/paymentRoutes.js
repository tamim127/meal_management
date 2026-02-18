const express = require('express');
const router = express.Router();
const { addPayment, getPayments, getBoarderPayments, updatePayment } = require('../controllers/paymentController');
const { protect, authorize, tenantScope } = require('../middleware/auth');

router.use(protect);
router.use(tenantScope);

router.route('/')
    .post(authorize('admin'), addPayment)
    .get(authorize('admin'), getPayments);

router.get('/boarder/:id', authorize('admin', 'boarder'), getBoarderPayments);
router.put('/:id', authorize('admin'), updatePayment);

module.exports = router;
