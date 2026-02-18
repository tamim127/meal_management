const Boarder = require('../models/Boarder');
const Meal = require('../models/Meal');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const CalculationService = require('../services/calculationService');
const { ObjectId } = require('mongodb');

// @desc    Admin dashboard metrics
exports.getDashboard = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const hid = new ObjectId(hostelId);

        const [totalBoarders, mealData, expenseData, paymentData] = await Promise.all([
            // Boarder.countDocuments? I added it to Boarder model? 
            // I should double check Boarder model. I added countDocuments.
            Boarder.countDocuments({ hostel_id: hid, isDeleted: false, status: 'active' }),
            Meal.aggregate([{ $match: { hostel_id: hid, date: { $gte: startDate, $lte: endDate } } }, { $group: { _id: null, total: { $sum: '$totalMeals' } } }]),
            Expense.aggregate([{ $match: { hostel_id: hid, date: { $gte: startDate, $lte: endDate }, isDeleted: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Payment.aggregate([{ $match: { hostel_id: hid, date: { $gte: startDate, $lte: endDate } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        ]);

        const totalMeals = mealData[0]?.total || 0;
        const totalExpense = expenseData[0]?.total || 0;
        const totalPayment = paymentData[0]?.total || 0;
        const mealRate = totalMeals > 0 ? Math.round((totalExpense / totalMeals) * 100) / 100 : 0;

        // Calculate total due
        const statements = await CalculationService.generateMonthlyStatements(hid, month, year);
        const totalDue = statements.statements.reduce((s, st) => s + st.due, 0);
        const totalBill = statements.statements.reduce((s, st) => s + st.totalBill, 0);
        const collectionRate = totalBill > 0 ? Math.round((totalPayment / totalBill) * 100) : 0;

        res.status(200).json({
            success: true,
            data: { totalBoarders, totalMeals, totalExpense, mealRate, totalDue: Math.round(totalDue * 100) / 100, totalPayment, collectionRate, month, year },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Boarder dashboard
exports.getBoarderDashboard = async (req, res) => {
    try {
        const hostelId = req.user.hostel_id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const boarder = await Boarder.findOne({ user_id: new ObjectId(req.user._id), hostel_id: new ObjectId(hostelId) });
        if (!boarder) return res.status(404).json({ success: false, message: 'Boarder profile not found' });

        const bill = await CalculationService.calculateBoarderBill(boarder._id, new ObjectId(hostelId), month, year);
        const payments = await Payment.find({ boarder_id: boarder._id }, { date: -1 }); // sort in options? 
        // My Payment.find second arg is sort object
        // Correct usage: Payment.find({ boarder_id: boarder._id }, { date: -1 }) matches my model signature

        // Limit 10 manually if needed or update model to support limit via options?
        // My Payment.find implementation: await this.collection().find(query).sort(sort).toArray();
        // It doesn't use limit.
        // I should probably slice the result or update model.

        const recentPayments = payments.slice(0, 10);

        res.status(200).json({ success: true, data: { ...bill, recentPayments } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Monthly summary report
exports.getMonthlySummary = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const result = await CalculationService.generateMonthlyStatements(new ObjectId(hostelId), month, year);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
