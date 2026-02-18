const { getDb, toObjectId } = require('../config/db');
const { ObjectId } = require('mongodb');

const collectionName = 'payments';

const Payment = {
    collection: () => getDb().collection(collectionName),

    async create(data) {
        if (!data.hostel_id || !data.boarder_id || !data.amount) {
            throw new Error('Hostel ID, Boarder ID and Amount are required');
        }

        const newPayment = {
            hostel_id: toObjectId(data.hostel_id),
            boarder_id: toObjectId(data.boarder_id),
            amount: Number(data.amount),
            date: data.date ? new Date(data.date) : new Date(),
            method: data.method || 'cash',
            referenceId: data.referenceId ? data.referenceId.trim() : '',
            notes: data.notes ? data.notes.trim() : '',
            addedBy: toObjectId(data.addedBy),
            created_by: toObjectId(data.created_by),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection().insertOne(newPayment);
        return { ...newPayment, _id: result.insertedId };
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
        if (sanitizedData.boarder_id) {
            sanitizedData.boarder_id = toObjectId(sanitizedData.boarder_id);
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

module.exports = Payment;
