module.exports = {
    jwt: {
        secret: process.env.JWT_SECRET,
        expire: process.env.JWT_EXPIRE || '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
    },
    smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
