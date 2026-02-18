const Expense = require('../models/Expense');
const MonthlyClosing = require('../models/MonthlyClosing');
const { paginateQuery } = require('../utils/pagination');
const { ObjectId } = require('mongodb');
const path = require('path');

// @desc    Add expense
// @route   POST /api/expenses
exports.addExpense = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;

        // Check if month is locked
        const expDate = new Date(req.body.date);
        const closing = await MonthlyClosing.findOne({
            hostel_id: new ObjectId(hostelId),
            month: expDate.getMonth() + 1,
            year: expDate.getFullYear(),
            isLocked: true,
        });

        if (closing) {
            return res.status(403).json({ success: false, message: 'This month is locked.' });
        }

        const expenseData = {
            ...req.body,
            hostel_id: hostelId,
            addedBy: req.user._id,
            created_by: req.user._id,
        };

        // Handle file upload
        if (req.file) {
            expenseData.attachment = req.file.filename;
        }

        const expense = await Expense.create(expenseData);
        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get expenses with filters
// @route   GET /api/expenses
exports.getExpenses = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const filter = { hostel_id: new ObjectId(hostelId), isDeleted: false };

        if (req.query.category) {
            filter.category = req.query.category;
        }

        if (req.query.month && req.query.year) {
            const startDate = new Date(req.query.year, req.query.month - 1, 1);
            const endDate = new Date(req.query.year, req.query.month, 0, 23, 59, 59);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        if (req.query.startDate && req.query.endDate) {
            filter.date = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
        }

        const result = await paginateQuery(Expense, filter, {
            page: req.query.page,
            limit: req.query.limit,
            sort: { date: -1 },
            // populate: 'addedBy', // Manual populate logic needed if we want names
        });

        // Manual populate addedBy
        // Implement if needed for UI
        if (result.data.length > 0) {
            const userIds = [...new Set(result.data.map(e => e.addedBy && e.addedBy.toString()).filter(id => id))];
            if (userIds.length > 0) {
                const users = await require('../config/db').getDb().collection('users')
                    .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
                    .project({ name: 1 })
                    .toArray();
                const userMap = {};
                users.forEach(u => userMap[u._id.toString()] = u);
                result.data.forEach(e => {
                    if (e.addedBy && userMap[e.addedBy.toString()]) {
                        e.addedBy = userMap[e.addedBy.toString()];
                    }
                });
            }
        }

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
    try {
        if (req.file) {
            req.body.attachment = req.file.filename;
        }

        const expense = await Expense.update(req.params.id, req.body);

        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        res.status(200).json({ success: true, data: expense });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Soft delete expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.update(
            req.params.id,
            { isDeleted: true }
        );
        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }
        res.status(200).json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Monthly expense summary
// @route   GET /api/expenses/summary
exports.getExpenseSummary = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const summary = await Expense.aggregate([
            {
                $match: {
                    hostel_id: new ObjectId(hostelId),
                    date: { $gte: startDate, $lte: endDate },
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { total: -1 } },
        ]);

        const grandTotal = summary.reduce((sum, s) => sum + s.total, 0);

        // Daily breakdown
        const dailyBreakdown = await Expense.aggregate([
            {
                $match: {
                    hostel_id: new ObjectId(hostelId),
                    date: { $gte: startDate, $lte: endDate },
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.status(200).json({
            success: true,
            data: { categoryBreakdown: summary, dailyBreakdown, grandTotal },
            month,
            year,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
