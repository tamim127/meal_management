const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { addExpense, getExpenses, updateExpense, deleteExpense, getExpenseSummary } = require('../controllers/expenseController');
const { protect, authorize, tenantScope } = require('../middleware/auth');

// Multer config for attachment uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
    storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|pdf/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        cb(ext && mime ? null : new Error('Only images and PDF allowed'), ext && mime);
    }
});

router.use(protect);
router.use(tenantScope);

router.route('/')
    .post(authorize('admin', 'manager'), upload.single('attachment'), addExpense)
    .get(authorize('admin', 'manager'), getExpenses);

router.get('/summary', authorize('admin'), getExpenseSummary);

router.route('/:id')
    .put(authorize('admin', 'manager'), upload.single('attachment'), updateExpense)
    .delete(authorize('admin'), deleteExpense);

module.exports = router;
