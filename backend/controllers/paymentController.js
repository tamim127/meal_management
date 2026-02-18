const Payment = require('../models/Payment');
const MonthlyClosing = require('../models/MonthlyClosing');
const { paginateQuery } = require('../utils/pagination');
const { ObjectId } = require('mongodb');

// @desc    Record payment
// @route   POST /api/payments
exports.addPayment = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;

        const payment = await Payment.create({
            ...req.body,
            hostel_id: hostelId,
            addedBy: req.user._id,
            created_by: req.user._id,
        });

        res.status(201).json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get payments with filters
// @route   GET /api/payments
exports.getPayments = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const filter = { hostel_id: new ObjectId(hostelId) };

        if (req.query.boarder_id) {
            filter.boarder_id = new ObjectId(req.query.boarder_id);
        }

        if (req.query.method) {
            filter.method = req.query.method;
        }

        if (req.query.month && req.query.year) {
            const startDate = new Date(req.query.year, req.query.month - 1, 1);
            const endDate = new Date(req.query.year, req.query.month, 0, 23, 59, 59);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const result = await paginateQuery(Payment, filter, {
            page: req.query.page,
            limit: req.query.limit,
            sort: { date: -1 },
            // populate: 'boarder_id addedBy',
        });

        // Manual populate
        if (result.data.length > 0) {
            const db = require('../config/db').getDb();
            // Populate boarder_id
            const boarderIds = [...new Set(result.data.map(p => p.boarder_id && p.boarder_id.toString()).filter(id => id))];
            if (boarderIds.length > 0) {
                const boarders = await db.collection('boarders').find({ _id: { $in: boarderIds.map(id => new ObjectId(id)) } }).project({ fullName: 1, roomNumber: 1 }).toArray();
                const boarderMap = {};
                boarders.forEach(b => boarderMap[b._id.toString()] = b);
                result.data.forEach(p => {
                    if (p.boarder_id && boarderMap[p.boarder_id.toString()]) p.boarder_id = boarderMap[p.boarder_id.toString()];
                });
            }

            // Populate addedBy
            const userIds = [...new Set(result.data.map(p => p.addedBy && p.addedBy.toString()).filter(id => id))];
            if (userIds.length > 0) {
                const users = await db.collection('users').find({ _id: { $in: userIds.map(id => new ObjectId(id)) } }).project({ name: 1 }).toArray();
                const userMap = {};
                users.forEach(u => userMap[u._id.toString()] = u);
                result.data.forEach(p => {
                    if (p.addedBy && userMap[p.addedBy.toString()]) p.addedBy = userMap[p.addedBy.toString()];
                });
            }
        }

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get boarder payments
// @route   GET /api/payments/boarder/:id
exports.getBoarderPayments = async (req, res) => {
    try {
        const filter = { boarder_id: new ObjectId(req.params.id) };

        if (req.query.month && req.query.year) {
            const startDate = new Date(req.query.year, req.query.month - 1, 1);
            const endDate = new Date(req.query.year, req.query.month, 0, 23, 59, 59);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const payments = await Payment.find(filter, { date: -1 });

        // Populate addedBy manual?
        // Let's do it if needed.
        if (payments.length > 0) {
            const userIds = [...new Set(payments.map(p => p.addedBy && p.addedBy.toString()).filter(id => id))];
            if (userIds.length > 0) {
                const users = await require('../config/db').getDb().collection('users').find({ _id: { $in: userIds.map(id => new ObjectId(id)) } }).project({ name: 1 }).toArray();
                const userMap = {};
                users.forEach(u => userMap[u._id.toString()] = u);
                payments.forEach(p => {
                    if (p.addedBy && userMap[p.addedBy.toString()]) p.addedBy = userMap[p.addedBy.toString()];
                });
            }
        }

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        res.status(200).json({
            success: true,
            data: payments,
            totalPaid,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update payment (admin only)
// @route   PUT /api/payments/:id
exports.updatePayment = async (req, res) => {
    try {
        const payment = await Payment.update(req.params.id, req.body);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        res.status(200).json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
