const Meal = require('../models/Meal');
const Boarder = require('../models/Boarder');
const MonthlyClosing = require('../models/MonthlyClosing');
const { ObjectId } = require('mongodb');

// @desc    Add daily meal entry
// @route   POST /api/meals
exports.addMeal = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const { boarder_id, date, breakfast, lunch, dinner, customMeals, isOff } = req.body;

        // Check if month is locked
        const mealDate = new Date(date);
        const closing = await MonthlyClosing.findOne({
            hostel_id: new ObjectId(hostelId),
            month: mealDate.getMonth() + 1,
            year: mealDate.getFullYear(),
            isLocked: true,
        });

        if (closing) {
            return res.status(403).json({ success: false, message: 'This month is locked. Cannot modify meals.' });
        }

        // Check for existing entry
        const startOfDay = new Date(mealDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999));

        const existing = await Meal.findOne({
            boarder_id: new ObjectId(boarder_id),
            date: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Meal entry already exists for this boarder on this date. Use update instead.' });
        }

        const meal = await Meal.create({
            boarder_id,
            hostel_id: hostelId,
            date,
            breakfast: breakfast || 0,
            lunch: lunch || 0,
            dinner: dinner || 0,
            customMeals: customMeals || [],
            isOff: isOff || false,
            addedBy: req.user._id,
            created_by: req.user._id,
        });

        res.status(201).json({ success: true, data: meal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Bulk meal entry (multiple boarders at once)
// @route   POST /api/meals/bulk
exports.bulkMealEntry = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const { date, entries } = req.body;

        if (!entries || !Array.isArray(entries)) {
            return res.status(400).json({ success: false, message: 'Invalid entries format' });
        }

        // Check if month is locked
        const mealDate = new Date(date);
        const closing = await MonthlyClosing.findOne({
            hostel_id: new ObjectId(hostelId),
            month: mealDate.getMonth() + 1,
            year: mealDate.getFullYear(),
            isLocked: true,
        });

        if (closing) {
            return res.status(403).json({ success: false, message: 'This month is locked.' });
        }

        const results = [];
        const errors = [];

        const startOfDay = new Date(new Date(date).setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999));

        for (const entry of entries) {
            try {
                // Upsert logic
                // Check if exists
                const existing = await Meal.findOne({
                    boarder_id: new ObjectId(entry.boarder_id),
                    hostel_id: new ObjectId(hostelId),
                    date: { $gte: startOfDay, $lte: endOfDay },
                });

                let meal;
                if (existing) {
                    // Update
                    meal = await Meal.update(existing._id, {
                        breakfast: entry.breakfast || 0,
                        lunch: entry.lunch || 0,
                        dinner: entry.dinner || 0,
                        customMeals: entry.customMeals || [],
                        isOff: entry.isOff || false,
                        addedBy: new ObjectId(req.user._id), // assuming update tracks who last modified
                    });
                    // Re-fetch updated document? Or construct it.
                    // findOneAndUpdate returns document. My Meal.update returns result from findOneAndUpdate.
                    if (meal.value) meal = meal.value;
                } else {
                    // Create
                    meal = await Meal.create({
                        boarder_id: entry.boarder_id,
                        hostel_id: hostelId,
                        date,
                        breakfast: entry.breakfast || 0,
                        lunch: entry.lunch || 0,
                        dinner: entry.dinner || 0,
                        customMeals: entry.customMeals || [],
                        isOff: entry.isOff || false,
                        addedBy: req.user._id,
                        created_by: req.user._id,
                    });
                }

                results.push(meal);
            } catch (e) {
                errors.push({ boarder_id: entry.boarder_id, error: e.message });
            }
        }

        res.status(200).json({
            success: true,
            data: results,
            errors: errors.length > 0 ? errors : undefined,
            count: results.length,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get meals (date filter, boarder filter)
// @route   GET /api/meals
exports.getMeals = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const match = { hostel_id: new ObjectId(hostelId) };

        if (req.query.date) {
            const date = new Date(req.query.date);
            match.date = {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(req.query.date).setHours(23, 59, 59, 999)),
            };
        }

        if (req.query.month && req.query.year) {
            const startDate = new Date(req.query.year, req.query.month - 1, 1);
            const endDate = new Date(req.query.year, req.query.month, 0, 23, 59, 59);
            match.date = { $gte: startDate, $lte: endDate };
        }

        if (req.query.boarder_id) {
            match.boarder_id = new ObjectId(req.query.boarder_id);
        }

        // Aggregation to populate boarder info
        const pipeline = [
            { $match: match },
            {
                $lookup: {
                    from: 'boarders',
                    localField: 'boarder_id',
                    foreignField: '_id',
                    as: 'boarder'
                }
            },
            { $unwind: { path: '$boarder', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    boarder_id: {
                        _id: '$boarder._id',
                        fullName: '$boarder.fullName',
                        roomNumber: '$boarder.roomNumber'
                    },
                    date: 1,
                    breakfast: 1,
                    lunch: 1,
                    dinner: 1,
                    customMeals: 1,
                    totalMeals: 1,
                    isOff: 1,
                }
            },
            { $sort: { date: -1, 'boarder_id.fullName': 1 } }
        ];

        const meals = await Meal.aggregate(pipeline);

        res.status(200).json({ success: true, data: meals });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get boarder's meals
// @route   GET /api/meals/boarder/:id
exports.getBoarderMeals = async (req, res) => {
    try {
        const filter = { boarder_id: new ObjectId(req.params.id) };
        if (req.query.month && req.query.year) {
            const startDate = new Date(req.query.year, req.query.month - 1, 1);
            const endDate = new Date(req.query.year, req.query.month, 0, 23, 59, 59);
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const meals = await Meal.find(filter, { date: -1 });

        // Calculate summary
        const totalMeals = meals.reduce((sum, m) => sum + (m.totalMeals || 0), 0);

        res.status(200).json({
            success: true,
            data: meals,
            summary: { totalMeals, totalDays: meals.length },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update meal entry
// @route   PUT /api/meals/:id
exports.updateMeal = async (req, res) => {
    try {
        const meal = await Meal.findById(req.params.id);
        if (!meal) {
            return res.status(404).json({ success: false, message: 'Meal entry not found' });
        }

        // Check if month is locked
        const closing = await MonthlyClosing.findOne({
            hostel_id: new ObjectId(meal.hostel_id),
            month: meal.date.getMonth() + 1,
            year: meal.date.getFullYear(),
            isLocked: true,
        });

        if (closing) {
            return res.status(403).json({ success: false, message: 'This month is locked.' });
        }

        // Only manager can edit same day, admin can edit past entries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mealDate = new Date(meal.date);
        mealDate.setHours(0, 0, 0, 0);

        if (req.user.role === 'manager' && mealDate.getTime() < today.getTime()) {
            return res.status(403).json({ success: false, message: 'Managers can only edit same day entries' });
        }

        // Recalculate totals if meal components are updated
        let totalMeals = meal.totalMeals;
        let breakfast = req.body.breakfast !== undefined ? req.body.breakfast : meal.breakfast;
        let lunch = req.body.lunch !== undefined ? req.body.lunch : meal.lunch;
        let dinner = req.body.dinner !== undefined ? req.body.dinner : meal.dinner;
        let customMeals = req.body.customMeals !== undefined ? req.body.customMeals : meal.customMeals;
        let isOff = req.body.isOff !== undefined ? req.body.isOff : meal.isOff;

        if (isOff) {
            breakfast = 0;
            lunch = 0;
            dinner = 0;
            totalMeals = 0;
        } else {
            let customTotal = 0;
            if (customMeals && customMeals.length > 0) {
                customTotal = customMeals.reduce((sum, m) => sum + (m.value || 0), 0);
            }
            totalMeals = breakfast + lunch + dinner + customTotal;
        }

        const updateData = {
            ...req.body,
            breakfast,
            lunch,
            dinner,
            customMeals,
            isOff,
            totalMeals
        };

        const result = await Meal.update(req.params.id, updateData);
        // Result is FindOneAndUpdate result.

        res.status(200).json({ success: true, data: result.value });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get monthly meal summary
// @route   GET /api/meals/summary
exports.getMealSummary = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const summary = await Boarder.aggregate([
            {
                $match: {
                    hostel_id: new ObjectId(hostelId),
                    isDeleted: false,
                    status: 'active',
                },
            },
            {
                $lookup: {
                    from: 'meals',
                    let: { bId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$boarder_id', '$$bId'] },
                                        { $gte: ['$date', startDate] },
                                        { $lte: ['$date', endDate] },
                                    ],
                                },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalMeals: { $sum: '$totalMeals' },
                                totalBreakfast: { $sum: '$breakfast' },
                                totalLunch: { $sum: '$lunch' },
                                totalDinner: { $sum: '$dinner' },
                                daysPresent: { $sum: 1 },
                            },
                        },
                    ],
                    as: 'mealStats',
                },
            },
            { $unwind: { path: '$mealStats', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    boarder_id: '$_id',
                    boarderName: '$fullName',
                    roomNumber: '$roomNumber',
                    totalMeals: { $ifNull: ['$mealStats.totalMeals', 0] },
                    totalBreakfast: { $ifNull: ['$mealStats.totalBreakfast', 0] },
                    totalLunch: { $ifNull: ['$mealStats.totalLunch', 0] },
                    totalDinner: { $ifNull: ['$mealStats.totalDinner', 0] },
                    daysPresent: { $ifNull: ['$mealStats.daysPresent', 0] },
                },
            },
            { $sort: { boarderName: 1 } },
        ]);

        const grandTotal = summary.reduce((sum, s) => sum + s.totalMeals, 0);

        res.status(200).json({
            success: true,
            data: summary,
            grandTotal,
            month,
            year,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
