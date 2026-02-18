const express = require('express');
const router = express.Router();
const { createBoarder, getBoarders, getBoarder, updateBoarder, deleteBoarder, bulkImport } = require('../controllers/boarderController');
const { protect, authorize, tenantScope } = require('../middleware/auth');

router.use(protect);
router.use(tenantScope);

router.route('/')
    .post(authorize('admin'), createBoarder)
    .get(authorize('admin', 'manager'), getBoarders);

router.post('/bulk-import', authorize('admin'), bulkImport);

router.route('/:id')
    .get(authorize('admin', 'manager', 'boarder'), getBoarder)
    .put(authorize('admin'), updateBoarder)
    .delete(authorize('admin'), deleteBoarder);

module.exports = router;
