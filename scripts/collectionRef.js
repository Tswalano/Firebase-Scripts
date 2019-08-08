const admin = require("firebase-admin");
require("./fbConfig");
var db = admin.firestore();

module.exports = {
  user: user,
  users: users,
  // permissions
  permission: permission,
  permissions: permissions,
  // user roles
  userRole: userRole,
  userRoles: userRoles,
  // companies
  company: company,
  companies: companies,
};

function user(key) {
  return db.doc(`users/${key}`);
}
function users() {
  return db.collection("users");
}
// permissions
function permission(key) {
  return db.doc(`permission/${key}`);
}
function permissions() {
  return db.collection("permission");
}
// user roles
function userRole(key) {
  return db.doc(`users-roles/${key}`);
}
function userRoles() {
  return db.collection("users-roles");
}
// companies
function company() {
  return db.collection("company");
}
function companies(key) {
  return db.doc(`company/${key}`);
}
