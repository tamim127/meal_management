const { getDb, toObjectId } = require('../config/db');
const { ObjectId } = require('mongodb');

const collectionName = 'monthly_closings';

const MonthlyClosing = {
    collection: () => getDb().collection(collectionName),

    async create(data) {
        const newClosing = {
            hostel_id: toObjectId(data.hostel_id),
            month: data.month,
            year: data.year,
            totalMeals: data.totalMeals || 0,
            totalExpense: data.totalExpense || 0,
            mealRate: data.mealRate || 0,
            isLocked: data.isLocked || false,
            lockedBy: toObjectId(data.lockedBy),
            lockedAt: data.lockedAt || null,
            boarderStatements: data.boarderStatements || [],
            created_by: toObjectId(data.created_by),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection().insertOne(newClosing);
        return { ...newClosing, _id: result.insertedId };
    },

    async findOne(query) {
        return await this.collection().findOne(query);
    },

    async findById(id) {
        const objId = toObjectId(id);
        if (!objId) return null;
        return await this.collection().findOne({ _id: objId });
    },

    async update(id, updateData) {
        const objId = toObjectId(id);
        if (!objId) return null;

        const { _id, ...sanitizedData } = updateData;

        sanitizedData.updatedAt = new Date();
        if (sanitizedData.hostel_id) sanitizedData.hostel_id = toObjectId(sanitizedData.hostel_id);
        if (sanitizedData.lockedBy) sanitizedData.lockedBy = toObjectId(sanitizedData.lockedBy);

        const result = await this.collection().findOneAndUpdate(
            { _id: objId },
            { $set: sanitizedData },
            { returnDocument: 'after' }
        );
        return result;
    }
};

module.exports = MonthlyClosing;
