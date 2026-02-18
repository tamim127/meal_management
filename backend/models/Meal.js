const { getDb, toObjectId } = require('../config/db');
const { ObjectId } = require('mongodb');

const collectionName = 'meals';

const Meal = {
    collection: () => getDb().collection(collectionName),

    async create(data) {
        let breakfast = data.breakfast || 0;
        let lunch = data.lunch || 0;
        let dinner = data.dinner || 0;
        let customMeals = data.customMeals || [];
        let totalMeals = 0;

        if (data.isOff) {
            breakfast = 0;
            lunch = 0;
            dinner = 0;
            totalMeals = 0;
        } else {
            let customTotal = 0;
            if (customMeals.length > 0) {
                customTotal = customMeals.reduce((sum, m) => sum + (m.value || 0), 0);
            }
            totalMeals = breakfast + lunch + dinner + customTotal;
        }

        const newMeal = {
            boarder_id: toObjectId(data.boarder_id),
            hostel_id: toObjectId(data.hostel_id),
            date: data.date ? new Date(data.date) : new Date(),
            breakfast,
            lunch,
            dinner,
            customMeals,
            totalMeals,
            isOff: data.isOff || false,
            addedBy: toObjectId(data.addedBy),
            created_by: toObjectId(data.created_by),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection().insertOne(newMeal);
        return { ...newMeal, _id: result.insertedId };
    },

    async findOne(query) {
        return await this.collection().findOne(query);
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
        if (sanitizedData.boarder_id) sanitizedData.boarder_id = toObjectId(sanitizedData.boarder_id);
        if (sanitizedData.hostel_id) sanitizedData.hostel_id = toObjectId(sanitizedData.hostel_id);

        const result = await this.collection().findOneAndUpdate(
            { _id: objId },
            { $set: sanitizedData },
            { returnDocument: 'after' }
        );
        return result;
    },

    async aggregate(pipeline) {
        return await this.collection().aggregate(pipeline).toArray();
    },

    // Equivalent to findOneAndUpdate with upsert
    async findOneAndUpdate(query, update, options = {}) {
        const nativeOptions = {};
        if (options && options.upsert) nativeOptions.upsert = true;
        if (options && options.new) nativeOptions.returnDocument = 'after';

        return await this.collection().findOneAndUpdate(query, update, nativeOptions);
    }
};

module.exports = Meal;
