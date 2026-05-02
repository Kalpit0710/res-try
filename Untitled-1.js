// test-mongo.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Try to load server .env if present
const envPath = path.resolve(__dirname, 'apps', 'server', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const uri = process.env.MONGO_URI || process.argv[2];
if (!uri) {
  console.error('Usage: MONGO_URI="<uri>" node test-mongo.js');
  console.error('Or add MONGO_URI to apps/server/.env and re-run.');
  process.exit(2);
}

// Mask credentials between :// and @ for logging (robust without regex)
let masked = uri;
const protoIdx = uri.indexOf('://');
const atIdx = uri.indexOf('@');
if (protoIdx >= 0 && atIdx > protoIdx) {
  masked = uri.slice(0, protoIdx + 3) + '*******@' + uri.slice(atIdx + 1);
}
console.log('Testing MongoDB connection to:', masked);

// Detect multiple '@' in the authority segment which indicates unencoded '@' in password
const firstSlashAfterProto = uri.indexOf('/', protoIdx + 3) >= 0 ? uri.indexOf('/', protoIdx + 3) : uri.length;
const authority = protoIdx >= 0 ? uri.slice(protoIdx + 3, firstSlashAfterProto) : uri;
const atCount = (authority.match(/@/g) || []).length;
if (atCount > 1) {
  console.error('\nDetected multiple "@" characters in the connection string authority portion.');
  console.error('This usually means your DB password contains an @ which is not URL-encoded.');
  console.error('Please URL-encode special characters in the password (e.g. @ -> %40) or create a DB user with a simpler password.');
  process.exit(3);
}

mongoose
  .connect(uri, { connectTimeoutMS: 10000, serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Connection error:');
    // Helpful hints for common error cases
    if (err && err.message) console.error(err.message);
    if (err && err.name === 'MongoNetworkError') {
      console.error('- Network error: check Atlas IP whitelist and your network connectivity.');
    }
    if (err && /ReplicaSetNoPrimary/.test(err.message)) {
      console.error('- ReplicaSetNoPrimary: the cluster has no primary node yet (cluster starting) or network is blocked.');
    }
    if (err && /Authentication failed/.test(err.message)) {
      console.error('- Authentication failed: verify DB user and password in the connection string.');
    }
    process.exit(1);
  });