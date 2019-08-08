const admin = require("firebase-admin");
var serviceAccount = require("./../prod_serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
