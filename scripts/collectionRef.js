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
  // role permission
  rolePermission: rolePermission,
  rolePermissions: rolePermissions,
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
// role_permission
function rolePermission(key) {
  return db.doc(`role_permissions/${key}`);
}
function rolePermissions() {
  return db.collection("role_permissions");
}
// companies
function company(key) {
  return db.doc(`company/${key}`);
}
function companies() {
  return db.collection("company");
}
