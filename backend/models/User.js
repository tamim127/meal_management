const { getDb, toObjectId } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const config = require('../config/config');

const collectionName = 'users';

const User = {
    collection: () => getDb().collection(collectionName),

    async create(userData) {
        // Basic Validation
        if (!userData.email || !userData.password || !userData.name) {
            throw new Error('Please provide name, email and password');
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const newUser = {
            name: userData.name.trim(),
            email: userData.email.toLowerCase().trim(),
            password: hashedPassword,
            role: userData.role || 'boarder',
            hostel_id: toObjectId(userData.hostel_id),
            isEmailVerified: false,
            isActive: userData.isActive !== undefined ? userData.isActive : false,
            approvalStatus: userData.approvalStatus || 'pending',
            approvedBy: toObjectId(userData.approvedBy),
            approvedAt: userData.approvedAt || null,
            rejectedBy: toObjectId(userData.rejectedBy),
            rejectedAt: userData.rejectedAt || null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await this.collection().insertOne(newUser);
        return { ...newUser, _id: result.insertedId };
    },

    async findByEmail(email) {
        return await this.collection().findOne({ email: email.toLowerCase() });
    },

    async findById(id) {
        const objId = toObjectId(id);
        if (!objId) return null;
        return await this.collection().findOne({ _id: objId });
    },

    async update(id, updateData) {
        const objId = toObjectId(id);
        if (!objId) return null;

        const { _id, ...sanitizedData } = updateData; // Prevent updating _id

        if (sanitizedData.hostel_id) {
            sanitizedData.hostel_id = toObjectId(sanitizedData.hostel_id);
        }

        sanitizedData.updatedAt = new Date();

        const result = await this.collection().findOneAndUpdate(
            { _id: objId },
            { $set: sanitizedData },
            { returnDocument: 'after' }
        );
        return result;
    },

    async approve(id, adminId) {
        return await this.update(id, {
            isActive: true,
            approvalStatus: 'approved',
            approvedBy: toObjectId(adminId),
            approvedAt: new Date()
        });
    },

    async reject(id, adminId) {
        return await this.update(id, {
            isActive: false,
            approvalStatus: 'rejected',
            rejectedBy: toObjectId(adminId),
            rejectedAt: new Date()
        });
    },

    // Methods that were previously instance methods
    async comparePassword(candidatePassword, userPassword) {
        return await bcrypt.compare(candidatePassword, userPassword);
    },

    generateAuthToken(user) {
        return jwt.sign(
            { id: user._id, role: user.role, hostel_id: user.hostel_id },
            config.jwt.secret,
            { expiresIn: config.jwt.expire }
        );
    },

    generateRefreshToken(user) {
        return jwt.sign(
            { id: user._id },
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpire }
        );
    },

    // Note: Email verification and password reset tokens need to be saved to DB
    async generateEmailVerificationToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await this.update(userId, {
            emailVerificationToken: hashedToken,
            emailVerificationExpires: expires
        });

        return token;
    },

    async generateResetPasswordToken(userId) {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        await this.update(userId, {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: expires
        });

        return token;
    }
};

module.exports = User;
