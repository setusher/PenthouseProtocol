var admin = require("firebase-admin");
var serviceAcc = require("/penthouse-protocol-service.json");

const app = initializeApp({
  credential: admin.credential.cert(serviceAcc),
});

const firebaseAuthMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided." });
  }

  try {
    var res = await admin.auth().verifyIdToken(token);
  } catch (e) {
    return res.status(403).json({ error: e });
  }

  if (res) {
    req.user = { uid: res.uid };
  }

  next();
};

module.exports = firebaseAuthMiddleware;
