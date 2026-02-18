const { getDb, toObjectId } = require('../config/db');
const { ObjectId } = require('mongodb');

const collectionName = 'boarders';

const Boarder = {
    collection: () => getDb().collection(collectionName),

    async create(data) {
        const newBoarder = {
            fullName: data.fullName ? data.fullName.trim() : '',
            hostel_id: toObjectId(data.hostel_id),
            user_id: toObjectId(data.user_id),
            phone: data.phone ? data.phone.trim() : '',
            email: data.email ? data.email.toLowerCase().trim() : '',
            roomNumber: data.roomNumber ? data.roomNumber.trim() : '',
            seatRent: Number(data.seatRent) || 0,
            joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
            status: data.status || 'active',
            openingBalance: Number(data.openingBalance) || 0,
            isDeleted: data.isDeleted || false,
            created_by: toObjectId(data.created_by),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection().insertOne(newBoarder);
        return { ...newBoarder, _id: result.insertedId };
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

        const { _id, ...sanitizedData } = updateData; // Prevent updating _id

        sanitizedData.updatedAt = new Date();
        if (sanitizedData.hostel_id) sanitizedData.hostel_id = toObjectId(sanitizedData.hostel_id);
        if (sanitizedData.user_id) sanitizedData.user_id = toObjectId(sanitizedData.user_id);

        const result = await this.collection().findOneAndUpdate(
            { _id: objId },
            { $set: sanitizedData },
            { returnDocument: 'after' }
        );
        return result;
    },

    async insertMany(docs) {
        const processedDocs = docs.map(d => ({
            ...d,
            hostel_id: toObjectId(d.hostel_id),
            created_by: toObjectId(d.created_by),
            createdAt: new Date(),
            updatedAt: new Date(),
            joinDate: d.joinDate ? new Date(d.joinDate) : new Date()
        }));

        const result = await this.collection().insertMany(processedDocs);

        const insertedDocs = processedDocs.map((doc, index) => ({
            ...doc,
            _id: result.insertedIds[index]
        }));

        return insertedDocs;
    },

    async countDocuments(query) {
        return await this.collection().countDocuments(query);
    },

    async aggregate(pipeline) {
        return await this.collection().aggregate(pipeline).toArray();
    }
};

module.exports = Boarder;
