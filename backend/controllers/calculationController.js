const CalculationService = require('../services/calculationService');
const { ObjectId } = require('mongodb');

// @desc    Get current meal rate
// @route   GET /api/calculations/meal-rate
exports.getMealRate = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const result = await CalculationService.calculateMealRate(
            new ObjectId(hostelId),
            month,
            year
        );

        res.status(200).json({ success: true, data: result, month, year });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get boarder bill breakdown
// @route   GET /api/calculations/boarder-bill/:id
exports.getBoarderBill = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const result = await CalculationService.calculateBoarderBill(
            new ObjectId(req.params.id),
            new ObjectId(hostelId),
            month,
            year
        );

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get due list for all boarders
// @route   GET /api/calculations/due-list
exports.getDueList = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const result = await CalculationService.generateMonthlyStatements(
            new ObjectId(hostelId),
            month,
            year
        );

        // Show all boarders, sorted by due amount (highest first)
        const dueList = result.statements
            .sort((a, b) => b.due - a.due);

        const totalDue = dueList.reduce((sum, s) => sum + s.due, 0);

        res.status(200).json({
            success: true,
            data: dueList,
            totalDue,
            mealRate: result.mealRate,
            month,
            year,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
