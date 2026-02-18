const express = require('express');
const router = express.Router();
const { lockMonth, unlockMonth, getClosingDetails, getBoarderStatement } = require('../controllers/monthlyClosingController');
const { protect, authorize, tenantScope } = require('../middleware/auth');

router.use(protect);
router.use(tenantScope);

router.post('/lock', authorize('admin'), lockMonth);
router.post('/unlock', authorize('admin'), unlockMonth);
router.get('/statement/:boarderId', authorize('admin', 'boarder'), getBoarderStatement);
router.get('/:month/:year', authorize('admin'), getClosingDetails);

module.exports = router;
