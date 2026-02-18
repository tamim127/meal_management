const Hostel = require('../models/Hostel');
const { ObjectId } = require('mongodb');

// @desc    Create hostel
// @route   POST /api/hostels
exports.createHostel = async (req, res) => {
    try {
        req.body.created_by = req.user._id;
        const hostel = await Hostel.create(req.body);
        res.status(201).json({ success: true, data: hostel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all hostels
// @route   GET /api/hostels
exports.getHostels = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role !== 'superadmin') {
            filter._id = new ObjectId(req.user.hostel_id);
        }

        const hostels = await Hostel.find(filter);

        // Manual populate created_by?
        // Not implemented in model find helper, but lets assume minimal info needed for now.
        // If needed:
        /*
        if (hostels.length > 0) {
            // ... fetch users ...
        }
        */

        res.status(200).json({ success: true, data: hostels });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single hostel
// @route   GET /api/hostels/:id
exports.getHostel = async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        // Populate created_by if needed
        const user = await require('../models/User').findById(hostel.created_by);
        if (user) {
            hostel.created_by = { _id: user._id, name: user.name, email: user.email };
        }

        res.status(200).json({ success: true, data: hostel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update hostel
// @route   PUT /api/hostels/:id
exports.updateHostel = async (req, res) => {
    try {
        const hostel = await Hostel.update(req.params.id, req.body);
        if (!hostel) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }
        res.status(200).json({ success: true, data: hostel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all hostels (public)
// @route   GET /api/hostels/public
exports.getPublicHostels = async (req, res) => {
    try {
        const hostels = await Hostel.find({});
        // Only Return basic info
        const sanitized = hostels.map(h => ({ _id: h._id, name: h.name }));
        res.status(200).json({ success: true, data: sanitized });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete hostel
// @route   DELETE /api/hostels/:id
exports.deleteHostel = async (req, res) => {
    try {
        // delete method returns DeleteResult { acknowledged: true, deletedCount: 1 }
        const result = await Hostel.delete(req.params.id);
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }
        res.status(200).json({ success: true, message: 'Hostel deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

