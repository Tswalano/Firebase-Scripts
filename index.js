"use strict";

const express = require("express");
const app = express();
const port = 3001;
// Firebase
require("./scripts/fbConfig");
const admin = require("firebase-admin");
const db = admin.firestore();
const user = require("./scripts/fbCreateAuthUser");
const collection = require("./scripts/collectionRef");

app.get("/", (req, res) =>
  res.send([{ message: "Crack initializer", status: 200 }]),
);

// Get all users
app.get("/getAllUsers", (req, res) => {
  user
    .logUsers()
    .then((querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        console.log(doc.data());
        data.push(doc.data());
      });
      res.send({ message: "success", status: 200, data });
    })
    .catch((error) => {
      console.log(error);
      //   res.send({ message: "unknown error occured", status: 500 });
      res.send({
        message: "unknown error occured",
        code: "error",
        status: 500,
      });
    });
});

// Create user
app.get("/createUser", (req, res) => {
  const userObj = {
    email: "admin@fluidity.solutions",
    emailVerified: false,
    password: "password",
    displayName: "Coffee",
    disabled: false,
  };
  user
    .createUser(userObj)
    .then((data) => {
      res.send({
        message: "success",
        code: "OK",
        status: 200,
        data,
      });
    })
    .catch((error) => {
      console.log(error);
      if (error.errorInfo) {
        const { message, code } = error.errorInfo;
        //   firebase error
        res.send({ message, code, status: 500 });
      } else {
        res.send({
          message: "unknown error occured",
          code: "error",
          status: 500,
        });
      }
    });
});

// Delete user
app.get("/deletUser", (req, res) => {
  user
    .findUserWithEmailAndDelete("admin@fluidity.solutions")
    .then(function(data) {
      res.send({
        message: "{email} account deleted successfully",
        code: "success",
        status: 200,
        data,
      });
    })
    .catch((error) => {
      console.log(error);
      if (error.errorInfo) {
        const { message, code } = error.errorInfo;
        //   firebase error
        res.send({ message, code, status: 500 });
      } else {
        res.send({
          message: "unknown error occured",
          code: "error",
          status: 500,
        });
      }
    });
});

// Create Super Administrator
app.get("/addSuperAdmin", (req, res) => {
  const permissions = {
    superAdministrator: true,
    emailAddress: "paul@fluidity.solutions",
    Company_permissions: {
      EmRb9TagNNMTdbwzJoKQ: {
        role: "Administrator",
        roleKey: "iRmrs41C2FjqCEj18y2L",
        companyName: "my Company",
        companyId: "EmRb9TagNNMTdbwzJoKQ",
        owner: true,
        permissions: {
          name: "Administrator",
          canAction: false,
          canImport: true,
          default: true,
          canAdd: true,
          routes: [
            "/home",
            "/user-profile",
            "/team",
            "/pw-change",
            "/companies",
            "/company_users",
          ],
          canExport: true,
          canEdit: true,
          canDelete: true,
        },
      },
    },
  };

  const userRef = (key) => collection.user(key).get();
  const companyRef = collection
    .companies()
    .where("companyType", "==", "Service Production")
    .get();
  const roleRef = collection
    .userRoles()
    .where("name", "==", "Super Administrator")
    .get();

  user
    .findUserWithEmail("admin@fluidity.solutions")
    .then((userDoc) => {
      return userRef(userDoc.uid);
    })
    .then((userDoc) => {
      const userObject = {
        key: userDoc.id,
        ...userDoc.data(),
        superAdministrator: true,
      };
      let permissionsObject = {};
      roleRef
        .then((result) => {
          if (!result.empty) {
            result.forEach((doc) => {
              const permission = Object.keys(doc.data()).reduce(
                (object, key) => {
                  object[key] = doc.data()[key];
                  return object;
                },
                {},
              );
              permissionsObject = permission;
            });
          }
          return { userObject, permissionsObject };
        })
        .then((object) => {
          const { userObject, permissionsObject } = object;
          let companyObject = {};
          return companyRef.then((companySnap) => {
            if (!companySnap.empty) {
              companySnap.forEach((doc) => {
                let company = {};
                const { companyName } = doc.data();
                company.companyId = doc.id;
                company.companyName = companyName;
                companyObject[doc.id] = {
                  ...company,
                  permission: permissionsObject,
                };
              });
              return {
                company_permissions: { ...companyObject },
                ...userObject,
              };
            }
          });
        })
        .then((data) => {
          const { key } = data;
          user.setAdminPrivelagges(key, data).then((doc) => {
            res.send({
              status: "OK",
              message: "{email} now a super administrator admin",
              data: data,
            });
          });
        });
    })
    .catch((error) => {
      console.log("ünknown error", error);
      res.send({
        message: "unknown error occured",
        code: "error",
        status: 500,
      });
    });
});

// Ceate Roles & Permisions
// create roles

app.get("/setPermission", (req, res) => {
  const rights = [
    "Add",
    "Edit",
    "Update",
    "Delete",
    "Export",
    "Import",
    "Distribute",
    "View",
  ];
  const promises = [];
  rights.forEach((right) => {
    promises.push(db.collection("test_permissions").add({ name: right }));
  });

  [""].forEach((right) => {
    promises.push(db.collection("test_userrole").add({ name: right }));
  });

  Promise.all(promises)
    .then(() => {
      // Create link roles to permissions
      res.send({
        message: "success",
        code: "success",
        status: 200,
        data: resolved,
      });
    })
    .catch((error) => {
      console.error("setPermission", error);
      res.send({
        message: "unknown error occured",
        code: "error",
        status: 500,
      });
    });
});
app.listen(port, () => console.log(`sdk app listening on port ${port}!`));
