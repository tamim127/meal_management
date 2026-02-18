const Notification = require('../models/Notification');
const { ObjectId } = require('mongodb');

// @desc    Get user notifications
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
    try {
        const query = { recipient: new ObjectId(req.user._id) };
        const notifications = await Notification.find(query);
        const unreadCount = notifications.filter(n => !n.isRead).length;

        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
    try {
        const result = await Notification.update(req.params.id, { isRead: true });
        if (!result.value) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.status(200).json({ success: true, data: result.value });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user._id);
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
    try {
        const result = await Notification.delete(req.params.id);
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
