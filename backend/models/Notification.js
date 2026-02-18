const { getDb, toObjectId } = require('../config/db');
const { ObjectId } = require('mongodb');

const collectionName = 'notifications';

const Notification = {
    collection: () => getDb().collection(collectionName),

    async create(data) {
        const newNotification = {
            recipient: toObjectId(data.recipient), // User ID
            hostel_id: toObjectId(data.hostel_id),
            title: data.title,
            message: data.message,
            type: data.type || 'info', // info, success, warning, danger
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection().insertOne(newNotification);
        return { ...newNotification, _id: result.insertedId };
    },

    async find(query, sort = { createdAt: -1 }) {
        return await this.collection().find(query).sort(sort).toArray();
    },

    async update(id, updateData) {
        const objId = toObjectId(id);
        if (!objId) return null;

        updateData.updatedAt = new Date();
        const result = await this.collection().findOneAndUpdate(
            { _id: objId },
            { $set: updateData },
            { returnDocument: 'after' }
        );
        return result;
    },

    async delete(id) {
        const objId = toObjectId(id);
        if (!objId) return null;
        return await this.collection().deleteOne({ _id: objId });
    },

    async markAllAsRead(recipientId) {
        return await this.collection().updateMany(
            { recipient: toObjectId(recipientId), isRead: false },
            { $set: { isRead: true, updatedAt: new Date() } }
        );
    }
};

module.exports = Notification;
