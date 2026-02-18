const AuditLog = require('../models/AuditLog');

const auditLog = (action, entity) => {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        res.json = function (data) {
            // Only log successful operations
            if (data && data.success) {
                const logEntry = {
                    hostel_id: req.hostelId || req.user?.hostel_id,
                    user_id: req.user?._id,
                    action,
                    entity,
                    entityId: data.data?._id || req.params.id,
                    changes: {
                        body: req.body,
                        params: req.params,
                    },
                    ipAddress: req.ip,
                };

                // Fire and forget audit log creation
                AuditLog.create(logEntry).catch(err => {
                    console.error('Audit log error:', err.message);
                });
            }

            return originalJson(data);
        };

        next();
    };
};

module.exports = auditLog;
