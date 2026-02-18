const { getDb, toObjectId } = require('../config/db');
const { ObjectId } = require('mongodb');

const collectionName = 'expenses';

const Expense = {
    collection: () => getDb().collection(collectionName),

    async create(data) {
        if (!data.hostel_id || !data.amount || !data.category || !data.date) {
            throw new Error('Hostel ID, Amount, Category, and Date are required');
        }

        const newExpense = {
            hostel_id: toObjectId(data.hostel_id),
            date: data.date ? new Date(data.date) : new Date(),
            category: data.category,
            description: data.description ? data.description.trim() : '',
            amount: Number(data.amount),
            attachment: data.attachment || null,
            addedBy: toObjectId(data.addedBy),
            isDeleted: data.isDeleted || false,
            created_by: toObjectId(data.created_by),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection().insertOne(newExpense);
        return { ...newExpense, _id: result.insertedId };
    },

    async findById(id) {
        const objId = toObjectId(id);
        if (!objId) return null;
        return await this.collection().findOne({ _id: objId });
    },

    async find(query, sort = {}) {
        return await this.collection().find(query).sort(sort).toArray();
    },

    async update(id, updateData) {
        const objId = toObjectId(id);
        if (!objId) return null;

        const { _id, ...sanitizedData } = updateData;

        sanitizedData.updatedAt = new Date();
        if (sanitizedData.hostel_id) {
            sanitizedData.hostel_id = toObjectId(sanitizedData.hostel_id);
        }

        const result = await this.collection().findOneAndUpdate(
            { _id: objId },
            { $set: sanitizedData },
            { returnDocument: 'after' }
        );
        return result;
    },

    async aggregate(pipeline) {
        return await this.collection().aggregate(pipeline).toArray();
    }
};

module.exports = Expense;
