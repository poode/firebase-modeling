require('dotenv').config();
const admin = require('firebase-admin');

const adminSDK = require(process.env.adminsdkJSONFullPath);

admin.initializeApp({
  credential: admin.credential.cert(adminSDK),
  databaseURL: process.env.databaseURL,
  storageBucket: process.env.storageBucket,
});

const db = admin.firestore();
db.settings({ timestampsInSnapshots: true });

module.exports = db

