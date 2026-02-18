const { getDb, toObjectId } = require('../config/db');
const { ObjectId } = require('mongodb');

const collectionName = 'hostels';

const Hostel = {
    collection: () => getDb().collection(collectionName),

    async create(hostelData) {
        if (!hostelData.name || !hostelData.created_by) {
            throw new Error('Hostel name and creator are required');
        }

        const newHostel = {
            name: hostelData.name.trim(),
            address: hostelData.address ? hostelData.address.trim() : '',
            totalSeats: hostelData.totalSeats || 0,
            monthlyRent: hostelData.monthlyRent || 0,
            mealTypes: hostelData.mealTypes || ['breakfast', 'lunch', 'dinner'],
            currency: hostelData.currency || 'BDT',
            status: hostelData.status || 'active',
            created_by: toObjectId(hostelData.created_by),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection().insertOne(newHostel);
        return { ...newHostel, _id: result.insertedId };
    },

    async findById(id) {
        const objId = toObjectId(id);
        if (!objId) return null;
        return await this.collection().findOne({ _id: objId });
    },

    async findOne(query) {
        return await this.collection().findOne(query);
    },

    async find(query, sort = {}) {
        return await this.collection().find(query).sort(sort).toArray();
    },

    async update(id, updateData) {
        const objId = toObjectId(id);
        if (!objId) return null;

        const { _id, ...sanitizedData } = updateData;

        sanitizedData.updatedAt = new Date();
        if (sanitizedData.created_by) sanitizedData.created_by = toObjectId(sanitizedData.created_by);

        const result = await this.collection().findOneAndUpdate(
            { _id: objId },
            { $set: sanitizedData },
            { returnDocument: 'after' }
        );
        return result;
    },

    async delete(id) {
        const objId = toObjectId(id);
        if (!objId) return null;
        return await this.collection().deleteOne({ _id: objId });
    }
};

module.exports = Hostel;
