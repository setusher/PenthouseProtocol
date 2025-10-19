var admin = require("firebase-admin");
var serviceAcc = require("/penthouse-protocol-service.json");

const app = initializeApp({
  credential: admin.credential.cert(serviceAcc),
});

const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth };