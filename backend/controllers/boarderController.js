const Boarder = require('../models/Boarder');
const User = require('../models/User');
const { paginateQuery } = require('../utils/pagination');
const { ObjectId } = require('mongodb');

// @desc    Create boarder
// @route   POST /api/boarders
exports.createBoarder = async (req, res) => {
    try {
        req.body.hostel_id = req.hostelId || req.user.hostel_id;
        req.body.created_by = req.user._id;

        // Optionally create a user account for the boarder
        if (req.body.email && req.body.createAccount) {
            const existingUser = await User.findByEmail(req.body.email);
            if (!existingUser) {
                const user = await User.create({
                    name: req.body.fullName,
                    email: req.body.email,
                    password: req.body.password || 'boarder123',
                    role: 'boarder',
                    hostel_id: req.body.hostel_id,
                });
                req.body.user_id = user._id;
            }
        }

        const boarder = await Boarder.create(req.body);
        res.status(201).json({ success: true, data: boarder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get boarders with search, filter, pagination
// @route   GET /api/boarders
exports.getBoarders = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const filter = { hostel_id: new ObjectId(hostelId), isDeleted: false };

        // Search by name, phone, email
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filter.$or = [
                { fullName: searchRegex },
                { phone: searchRegex },
                { email: searchRegex },
                { roomNumber: searchRegex },
            ];
        }

        // Filter by status
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const result = await paginateQuery(Boarder, filter, {
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort ? JSON.parse(req.query.sort) : { fullName: 1 },
        });

        // Manual populate user_id
        if (result.data.length > 0) {
            const userIds = [...new Set(result.data.map(b => b.user_id && b.user_id.toString()).filter(id => id))];
            if (userIds.length > 0) {
                const users = await require('../config/db').getDb().collection('users')
                    .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
                    .project({ name: 1, email: 1 }) // Select fields
                    .toArray();
                const userMap = {};
                users.forEach(u => userMap[u._id.toString()] = u);

                result.data.forEach(b => {
                    if (b.user_id && userMap[b.user_id.toString()]) {
                        b.user_id = userMap[b.user_id.toString()];
                    }
                });
            }
        }

        res.status(200).json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single boarder
// @route   GET /api/boarders/:id
exports.getBoarder = async (req, res) => {
    try {
        const boarder = await Boarder.findById(req.params.id);
        if (!boarder || boarder.isDeleted) {
            return res.status(404).json({ success: false, message: 'Boarder not found' });
        }

        // Manual populate
        if (boarder.user_id) {
            const user = await User.findById(boarder.user_id);
            if (user) {
                // Only minimal info
                boarder.user_id = { _id: user._id, name: user.name, email: user.email };
            }
        }

        res.status(200).json({ success: true, data: boarder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update boarder
// @route   PUT /api/boarders/:id
exports.updateBoarder = async (req, res) => {
    try {
        // Native update returns the document if returnDocument: 'after' is passed in model
        const boarder = await Boarder.update(req.params.id, req.body);

        if (!boarder) { // or boarder.value if using raw result
            return res.status(404).json({ success: false, message: 'Boarder not found' });
        }
        // Assuming Boarder.update returns the document since we used returnDocument: 'after' 
        // AND newer node driver which returns doc directly if configured?
        // Let's assume safely it might return { value: doc } or doc.
        // If it's doc, ok. If {value: doc}, we need check.
        // Actually findOneAndUpdate returns null if not found.

        res.status(200).json({ success: true, data: boarder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Soft delete boarder
// @route   DELETE /api/boarders/:id
exports.deleteBoarder = async (req, res) => {
    try {
        const boarder = await Boarder.update(
            req.params.id,
            { isDeleted: true, status: 'inactive' }
        );
        if (!boarder) {
            return res.status(404).json({ success: false, message: 'Boarder not found' });
        }
        res.status(200).json({ success: true, message: 'Boarder deleted', data: boarder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Bulk import boarders from Import data
// @route   POST /api/boarders/bulk-import
exports.bulkImport = async (req, res) => {
    try {
        const { boarders } = req.body;
        if (!boarders || !Array.isArray(boarders)) {
            return res.status(400).json({ success: false, message: 'Invalid data format' });
        }

        const hostelId = req.hostelId || req.user.hostel_id;
        const boarderDocs = boarders.map(b => ({
            ...b,
            hostel_id: hostelId,
            created_by: req.user._id,
        }));

        // Use custom insertMany method in Boarder model
        const result = await Boarder.insertMany(boarderDocs);

        res.status(201).json({ success: true, data: result, count: result.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
