const Meal = require('../models/Meal');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const Boarder = require('../models/Boarder');
const { ObjectId } = require('mongodb');

class CalculationService {
    // Calculate meal rate for a given month
    static async calculateMealRate(hostelId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const hId = new ObjectId(hostelId);

        const [expenseResult, mealResult] = await Promise.all([
            Expense.aggregate([
                {
                    $match: {
                        hostel_id: hId,
                        date: { $gte: startDate, $lte: endDate },
                        isDeleted: false,
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Meal.aggregate([
                {
                    $match: {
                        hostel_id: hId,
                        date: { $gte: startDate, $lte: endDate },
                    },
                },
                { $group: { _id: null, total: { $sum: '$totalMeals' } } },
            ]),
        ]);

        const totalExpense = expenseResult[0]?.total || 0;
        const totalMeals = mealResult[0]?.total || 0;
        const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;

        return {
            totalExpense,
            totalMeals,
            mealRate: Math.round(mealRate * 100) / 100,
        };
    }

    // Calculate bill for a specific boarder
    static async calculateBoarderBill(boarderId, hostelId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const hId = new ObjectId(hostelId);
        const bId = new ObjectId(boarderId);

        const boarder = await Boarder.findById(bId);
        if (!boarder) throw new Error('Boarder not found');

        const { mealRate } = await this.calculateMealRate(hId, month, year);

        const [boarderMealResult, boarderPaymentResult] = await Promise.all([
            Meal.aggregate([
                {
                    $match: {
                        boarder_id: bId,
                        hostel_id: hId,
                        date: { $gte: startDate, $lte: endDate },
                    },
                },
                { $group: { _id: null, total: { $sum: '$totalMeals' } } },
            ]),
            Payment.aggregate([
                {
                    $match: {
                        boarder_id: bId,
                        hostel_id: hId,
                        date: { $gte: startDate, $lte: endDate },
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
        ]);

        const boarderMeals = boarderMealResult[0]?.total || 0;
        const boarderPayments = boarderPaymentResult[0]?.total || 0;
        const mealCost = Math.round(boarderMeals * mealRate * 100) / 100;
        const seatRent = boarder.seatRent || 0;
        const openingBalance = boarder.openingBalance || 0;
        const totalBill = mealCost + seatRent;
        const netDue = totalBill - boarderPayments - openingBalance; // Logic check: due = bill - payment + opening? Or opening is due?
        // Usually openingBalance is negative if advance, positive if due.
        // If openingBalance is due from previous months:
        // Net Due = Total Bill + Opening Due - Payments.
        // Using `openingBalance` name is ambiguous. `boarderController` defaults it to 0.
        // Let's assume openingBalance is "Due".
        // netDue = totalBill + openingBalance - boarderPayments?
        // The original code was: `totalBill - boarderPayments - openingBalance`.
        // This implies openingBalance is treated as a credit/advance initially? Or maybe passing mistake.
        // But I will keep it same to avoid logic break, assuming original was correct for their logic.

        return {
            boarder: {
                _id: boarder._id,
                fullName: boarder.fullName,
                roomNumber: boarder.roomNumber,
            },
            month,
            year,
            mealRate,
            totalMeals: boarderMeals,
            mealCost,
            seatRent,
            openingBalance,
            totalBill,
            totalPayment: boarderPayments,
            due: netDue > 0 ? Math.round(netDue * 100) / 100 : 0,
            advance: netDue < 0 ? Math.round(Math.abs(netDue) * 100) / 100 : 0,
        };
    }

    // Generate statements for all active boarders
    static async generateMonthlyStatements(hostelId, month, year) {
        const hId = new ObjectId(hostelId);

        // Native driver find returns plain objects array (from my model wrapper)
        const boarders = await Boarder.find({
            hostel_id: hId,
            isDeleted: false,
        });

        const statements = await Promise.all(
            boarders.map(b => this.calculateBoarderBill(b._id, hId, month, year))
        );

        const { mealRate, totalExpense, totalMeals } = await this.calculateMealRate(hId, month, year);

        return {
            hostelId: hId,
            month,
            year,
            mealRate,
            totalExpense,
            totalMeals,
            totalBoarders: boarders.length,
            statements,
        };
    }
}

module.exports = CalculationService;
