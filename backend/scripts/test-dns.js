const dns = require('dns');

const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8']);

console.log('Testing resolution for cluster0.p1jaoj3.mongodb.net...');

resolver.resolveSrv('_mongodb._tcp.cluster0.p1jaoj3.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('SRV Error:', err.message);
    } else {
        console.log('SRV Records:', addresses);
    }
});

resolver.resolveTxt('cluster0.p1jaoj3.mongodb.net', (err, records) => {
    if (err) {
        console.error('TXT Error:', err.message);
    } else {
        console.log('TXT Records:', records);
    }
});

resolver.resolve4('cluster0.p1jaoj3.mongodb.net', (err, addresses) => {
    if (err) {
        console.error('A Record Error:', err.message);
    } else {
        console.log('A Records:', addresses);
    }
});
