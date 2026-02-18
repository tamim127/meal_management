const express = require('express');
const router = express.Router();
const { addMeal, bulkMealEntry, getMeals, getBoarderMeals, updateMeal, getMealSummary } = require('../controllers/mealController');
const { protect, authorize, tenantScope } = require('../middleware/auth');

router.use(protect);
router.use(tenantScope);

router.route('/')
    .post(authorize('admin', 'manager'), addMeal)
    .get(authorize('admin', 'manager'), getMeals);

router.post('/bulk', authorize('admin', 'manager'), bulkMealEntry);
router.get('/summary', authorize('admin', 'manager'), getMealSummary);
router.get('/boarder/:id', authorize('admin', 'manager', 'boarder'), getBoarderMeals);
router.put('/:id', authorize('admin', 'manager'), updateMeal);

module.exports = router;
