const MonthlyClosing = require('../models/MonthlyClosing');
const CalculationService = require('../services/calculationService');
const { ObjectId } = require('mongodb');

exports.lockMonth = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const { month, year } = req.body;
        if (!month || !year) return res.status(400).json({ success: false, message: 'Month and year required' });

        const existing = await MonthlyClosing.findOne({ hostel_id: new ObjectId(hostelId), month, year });
        if (existing && existing.isLocked) return res.status(400).json({ success: false, message: 'Already locked' });

        const result = await CalculationService.generateMonthlyStatements(new ObjectId(hostelId), month, year);
        const closingData = {
            hostel_id: new ObjectId(hostelId), month, year,
            totalMeals: result.totalMeals, totalExpense: result.totalExpense, mealRate: result.mealRate,
            isLocked: true, lockedBy: req.user._id, lockedAt: new Date(),
            boarderStatements: result.statements.map(s => ({
                boarder_id: s.boarder._id, boarderName: s.boarder.fullName,
                totalMeals: s.totalMeals, mealCost: s.mealCost, seatRent: s.seatRent,
                totalPayment: s.totalPayment, openingBalance: s.openingBalance, due: s.due, advance: s.advance,
            })),
            created_by: req.user._id,
        };

        const closing = existing
            ? await MonthlyClosing.update(existing._id, closingData)
            : await MonthlyClosing.create(closingData);

        // If update returns result, we need the doc. Use findById maybe?
        // specific update logic in model returns doc or result.
        // I used 'returnDocument: after' in model.

        let finalClosing = closing;
        if (existing && closing.value) finalClosing = closing.value;

        res.status(200).json({ success: true, data: finalClosing });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.unlockMonth = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;

        // Find first to get ID for update
        const closingDoc = await MonthlyClosing.findOne({ hostel_id: new ObjectId(hostelId), month: req.body.month, year: req.body.year });

        if (!closingDoc) return res.status(404).json({ success: false, message: 'Not found' });

        const closing = await MonthlyClosing.update(
            closingDoc._id,
            { isLocked: false }
        );

        res.status(200).json({ success: true, data: closing.value || closing }); // Handle structure
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getClosingDetails = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const closing = await MonthlyClosing.findOne({ hostel_id: new ObjectId(hostelId), month: parseInt(req.params.month), year: parseInt(req.params.year) });

        if (!closing) {
            const result = await CalculationService.generateMonthlyStatements(new ObjectId(hostelId), parseInt(req.params.month), parseInt(req.params.year));
            return res.status(200).json({ success: true, data: result, isLocked: false });
        }

        // Populate lockedBy manually
        if (closing.lockedBy) {
            const user = await require('../models/User').findById(closing.lockedBy);
            if (user) closing.lockedBy = { name: user.name };
        }

        res.status(200).json({ success: true, data: closing, isLocked: closing.isLocked });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getBoarderStatement = async (req, res) => {
    try {
        const hostelId = req.hostelId || req.user.hostel_id;
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const result = await CalculationService.calculateBoarderBill(new ObjectId(req.params.boarderId), new ObjectId(hostelId), month, year);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
