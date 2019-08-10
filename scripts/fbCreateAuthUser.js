const admin = require("firebase-admin");
require("./fbConfig");
var db = admin.firestore();

module.exports = {
  logUsers: logUsers,
  createUser: createUser,
  updateUser: updateUser,
  findUserWithEmail: findUserWithEmail,
  setAdminPrivelagges: setAdminPrivelagges,
  findUserWithEmailAndDelete: findUserWithEmailAndDelete,
};

function logUsers() {
  return db.collection("users").get();
}

function createUser(userObject) {
  return admin.auth().createUser({
    email: userObject.email,
    emailVerified: false,
    password: userObject.password,
    displayName: userObject.displayName,
    disabled: false,
  });
}

function updateUser(uid) {
  admin
    .auth()
    .updateUser(uid, {
      disabled: true,
    })
    .then(function(userRecord) {
      // See the UserRecord reference doc for the contents of userRecord.
      console.log("Successfully updated user", userRecord.toJSON());
    })
    .catch(function(error) {
      console.log("Error updating user:", error);
    });
}

async function findUserWithEmail(email) {
  return admin.auth().getUserByEmail(email);
}

async function findUserWithEmailAndDelete(email, nextPageToken) {
  // List batch of users, 1000 at a time.
  try {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    listUsersResult.users.forEach(function(userRecord) {
      if (userRecord.email === email) {
        // console.log("user ano: ", userRecord.isAnonymous);
        // console.log("user", userRecord.toJSON());
        var uid = userRecord.uid;
        return admin.auth().deleteUser(uid);
      } else {
        return false;
      }
    });
    if (listUsersResult.pageToken) {
      // List next batch of users.
      findUserWithEmailAndDelete(listUsersResult.pageToken, email);
    }
  } catch (error) {
    console.log("Error Deleting users:", error);
  }
}

function setAdminPrivelagges(key, data) {
  console.log("setAdminPrivelagges =>", key, data);
  return db
    .collection("users")
    .doc(key)
    .set(data, { merge: true });
}
