try {
    console.log('Attempting to require server.js...');
    const app = require('./server');
    console.log('Server loaded successfully');
} catch (e) {
    console.error('ERROR LOADING SERVER:');
    console.error(e);
}
