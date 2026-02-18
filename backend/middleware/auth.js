const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Block deactivated/rejected users, but allow pending to proceed (controlled by authorize)
        if (user.approvalStatus === 'rejected') {
            return res.status(401).json({ success: false, message: 'Account has been rejected.' });
        }
        if (user.approvalStatus !== 'pending' && user.isActive === false) {
            return res.status(401).json({ success: false, message: 'Account is deactivated.' });
        }

        delete user.password;
        req.user = user;

        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
    }
};

// Authorize by roles AND optionally check approval status
const authorize = (...args) => {
    let roles = [];
    let requireApproved = true;

    // Handle different call signatures:
    // 1. authorize(['admin', 'manager'], false)
    // 2. authorize('admin', 'manager')
    // 3. authorize(['admin'])
    if (args.length > 0) {
        if (Array.isArray(args[0])) {
            roles = args[0];
            if (typeof args[1] === 'boolean') {
                requireApproved = args[1];
            }
        } else {
            // Check if last argument is boolean (requireApproved flag)
            if (typeof args[args.length - 1] === 'boolean') {
                requireApproved = args.pop();
                roles = args;
            } else {
                roles = args;
            }
        }
    }

    return (req, res, next) => {
        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this route`,
            });
        }

        if (requireApproved && req.user.approvalStatus !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending approval. Please wait for administrator confirmation.',
            });
        }

        next();
    };
};

// Tenant scope middleware - ensures hostel_id is attached
const tenantScope = (req, res, next) => {
    if (req.user.role === 'superadmin') {
        // Superadmin can access all hostels
        if (req.query.hostel_id) {
            req.hostelId = req.query.hostel_id;
        } else if (req.body.hostel_id) {
            req.hostelId = req.body.hostel_id;
        }
    } else {
        req.hostelId = req.user.hostel_id;
    }
    next();
};

module.exports = { protect, authorize, tenantScope };
