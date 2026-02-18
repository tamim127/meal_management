const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Boarder = require('../models/Boarder');
const Notification = require('../models/Notification');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const config = require('../config/config');
const jwt = require('jsonwebtoken');

// @desc    Register user + create hostel (admin) or register boarder
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, hostelName, hostelAddress, hostel_id } = req.body;

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        let hostelId = hostel_id;
        let user;

        // If registering as admin, create a hostel
        if (role === 'admin' && hostelName) {
            // 1. Create user heavily relies on insertOne returning _id
            // We create user first with dummy hostel_id or null, then update it?
            // Or create hostel first? Hostel needs created_by (user id).
            // User needs hostel_id. Circular dependency if we want both references perfectly.
            // Usually: Create User (Admin), get ID -> Create Hostel with User ID -> Update User with Hostel ID.

            user = await User.create({
                name,
                email,
                password,
                role: 'admin',
                isActive: true,
                approvalStatus: 'approved'
            });

            const hostel = await Hostel.create({
                name: hostelName,
                address: hostelAddress || '',
                created_by: user._id,
            });

            hostelId = hostel._id;

            // Update user with hostel_id
            await User.update(user._id, { hostel_id: hostelId });
            user.hostel_id = hostelId; // Update local object

            const accessToken = User.generateAuthToken(user);
            const refreshToken = User.generateRefreshToken(user);

            await User.update(user._id, { refreshToken });

            return res.status(201).json({
                success: true,
                data: {
                    user: { _id: user._id, name: user.name, email: user.email, role: user.role, hostel_id: hostelId, approvalStatus: 'approved' },
                    accessToken,
                    refreshToken,
                },
            });
        }

        // Regular user registration
        user = await User.create({
            name,
            email,
            password,
            role: role || 'boarder',
            hostel_id: hostelId,
            approvalStatus: 'pending',
            isActive: false
        });

        // Create a basic Boarder profile for the user if they are a boarder
        if (user.role === 'boarder') {
            await Boarder.create({
                fullName: name,
                email,
                user_id: user._id,
                hostel_id: hostelId,
                status: 'pending', // Match approval status
                isDeleted: false
            });

            // Notify Admin
            const admin = await User.collection().findOne({ hostel_id: new ObjectId(hostelId), role: 'admin' });
            if (admin) {
                await Notification.create({
                    recipient: admin._id,
                    hostel_id: hostelId,
                    title: 'New Boarder Registration',
                    message: `${name} has registered and is pending approval.`,
                    type: 'info'
                });
            }
        }

        const accessToken = User.generateAuthToken(user);
        const refreshToken = User.generateRefreshToken(user);

        await User.update(user._id, { refreshToken });

        res.status(201).json({
            success: true,
            data: {
                user: { _id: user._id, name: user.name, email: user.email, role: user.role, hostel_id: user.hostel_id, approvalStatus: 'pending' },
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Allow login if pending, otherwise check isActive
        if (user.approvalStatus !== 'pending' && user.isActive === false) {
            return res.status(401).json({ success: false, message: 'Account is deactivated or rejected. Please contact administrator.' });
        }

        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const accessToken = User.generateAuthToken(user);
        const refreshToken = User.generateRefreshToken(user);

        await User.update(user._id, { refreshToken });

        // Remove password from response
        const userResp = { ...user };
        delete userResp.password;

        // Attach boarder_id if boarder
        if (userResp.role === 'boarder') {
            const boarder = await Boarder.findOne({
                $or: [
                    { user_id: new ObjectId(userResp._id) },
                    { email: userResp.email.toLowerCase() }
                ]
            });
            if (boarder) {
                userResp.boarder_id = boarder._id;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                user: userResp,
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token is required' });
        }

        // Verify token (depends on how we handle verification without mongoose methods)
        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const newAccessToken = User.generateAuthToken(user);
        const newRefreshToken = User.generateRefreshToken(user);

        await User.update(user._id, { refreshToken: newRefreshToken });

        res.status(200).json({
            success: true,
            data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findByEmail(req.body.email);
        if (!user) {
            return res.status(404).json({ success: false, message: 'No user found with that email' });
        }

        // Generate token and save to DB
        const resetTokenRaw = crypto.randomBytes(32).toString('hex');
        const resetPasswordToken = crypto.createHash('sha256').update(resetTokenRaw).digest('hex');
        const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await User.update(user._id, {
            resetPasswordToken,
            resetPasswordExpires
        });

        const resetUrl = `${config.clientUrl}/reset-password/${resetTokenRaw}`;

        // Email sending removed as requested
        console.log(`Password reset link (email disabled): ${resetUrl}`);

        res.status(200).json({ success: true, message: 'Reset email simulates sending (check server logs)' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        // Find user with valid token
        const db = User.collection();
        const user = await db.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        // Hash new password
        const salt = await require('bcryptjs').genSalt(12);
        const hashedPassword = await require('bcryptjs').hash(req.body.password, salt);

        await User.update(user._id, {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user && user.role === 'boarder') {
            const boarder = await Boarder.findOne({
                $or: [
                    { user_id: new ObjectId(user._id) },
                    { email: user.email.toLowerCase() }
                ]
            });
            if (boarder) {
                user.boarder_id = boarder._id;
            }
        }

        if (user && user.hostel_id) {
            const hostel = await Hostel.findById(user.hostel_id);
            user.hostel_id = hostel;
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all pending users (admin only)
// @route   GET /api/auth/pending-users
exports.getPendingUsers = async (req, res) => {
    try {
        const { toObjectId } = require('../config/db');
        const db = User.collection();
        const users = await db.find({
            hostel_id: toObjectId(req.user.hostel_id),
            approvalStatus: 'pending'
        }).toArray();


        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Approve user account
// @route   PUT /api/auth/approve/:id
exports.approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await User.approve(user._id, req.user._id);

        // Also update Boarder status if it exists
        if (user.role === 'boarder') {
            const db = require('../config/db').getDb();
            await db.collection('boarders').updateOne(
                { user_id: new ObjectId(user._id) },
                { $set: { status: 'active', updatedAt: new Date() } }
            );
        }

        res.status(200).json({ success: true, message: 'User approved successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reject user account
// @route   PUT /api/auth/reject/:id
exports.rejectUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await User.reject(user._id, req.user._id);

        // Also update Boarder status if it exists
        if (user.role === 'boarder') {
            const db = require('../config/db').getDb();
            await db.collection('boarders').updateOne(
                { user_id: new ObjectId(user._id) },
                { $set: { status: 'inactive', updatedAt: new Date() } }
            );
        }

        res.status(200).json({ success: true, message: 'User rejected successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Logout
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
    try {
        if (req.user && req.user.id) {
            await User.update(req.user.id, { refreshToken: null });
        }
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
