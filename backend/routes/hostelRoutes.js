const express = require('express');
const router = express.Router();
const { createHostel, getHostels, getHostel, updateHostel, deleteHostel, getPublicHostels } = require('../controllers/hostelController');
const { protect, authorize, tenantScope } = require('../middleware/auth');

router.get('/public', getPublicHostels);

router.use(protect);
router.use(tenantScope);

router.route('/')
    .post(authorize('superadmin'), createHostel)
    .get(authorize('superadmin', 'admin'), getHostels);

router.route('/:id')
    .get(authorize('superadmin', 'admin', 'manager'), getHostel)
    .put(authorize('superadmin', 'admin'), updateHostel)
    .delete(authorize('superadmin'), deleteHostel);

module.exports = router;
