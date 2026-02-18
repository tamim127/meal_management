const { getDb, toObjectId } = require('../config/db');
const { ObjectId } = require('mongodb');

const collectionName = 'audit_logs';

const AuditLog = {
    collection: () => getDb().collection(collectionName),

    async create(data) {
        const newLog = {
            hostel_id: toObjectId(data.hostel_id),
            user_id: toObjectId(data.user_id),
            action: data.action,
            entity: data.entity,
            entityId: toObjectId(data.entityId),
            changes: data.changes || null,
            ipAddress: data.ipAddress || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection().insertOne(newLog);
        return { ...newLog, _id: result.insertedId };
    },

    async find(query, sort = { createdAt: -1 }) {
        return await this.collection().find(query).sort(sort).toArray();
    }
};

module.exports = AuditLog;
