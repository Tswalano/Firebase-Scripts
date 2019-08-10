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
var request = require("request");

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
  // const { email } = req.body;
  console.log("/createUser", req.param);
  const userObj = {
    email: email,
    emailVerified: false,
    password: "password",
    displayName: "Admin",
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
    .findUserWithEmailAndDelete("paul@fluidity.solutions")
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
    .findUserWithEmail("paul@fluidity.solutions")
    .then((userDoc) => {
      return userRef(userDoc.uid);
    })
    .then((userDoc) => {
      const userObject = {
        uid: userDoc.id,
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
                { roleKey: "xxxxxx" },
              );
              permissionsObject = permission;
            });
          }
          console.log("permissionsObject", permissionsObject);
          return { userObject, permissionsObject };
        })
        .then((object) => {
          console.log("object", object);
          const { userObject, permissionsObject } = object;
          let companyObject = {};
          return companyRef.then((companySnap) => {
            if (!companySnap.empty) {
              companySnap.forEach((doc) => {
                let company = {};
                const { companyName } = doc.data();
                company.companyId = doc.id;
                company.companyName = companyName;
                company.owner = false;
                company.role = permissionsObject.name;
                company.roleKey = permissionsObject.rolekey;
                companyObject[doc.id] = {
                  ...company,
                  permissions: permissionsObject,
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
          console.log("setAdminPrivelagges data => ", data.uid);
          const { uid } = data;
          user
            .setAdminPrivelagges(uid, data)
            .then((doc) => {
              res.send({
                status: "OK",
                message: "{email} now a super administrator admin",
                data: data,
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
        })
        .catch((error) => {
          console.log("ünknown error", error);
          res.send({
            message: "unknown error occured",
            code: "error",
            status: 500,
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

// Set User Permission
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

  const permissionsPromises = [];
  rights.forEach((right) => {
    console.log("setting up permission: " + right);
    permissionsPromises.push(collection.permissions().add({ name: right }));
  });
  // 1. Create System permissions
  console.log("Create System permissions");
  Promise.all(permissionsPromises)
    .then(() => {
      // 2. When done request to set-up default system roles and permission config
      request("http://localhost:3001/setUserRole", function(
        error,
        response,
        body,
      ) {
        if (response && response.statusCode) {
          res.send({
            message: "Role Configuration Scripts Done",
            code: "success",
            status: 200,
          });
        } else {
          res.send({
            message: "Error Occured",
            code: "success",
            status: 500,
          });
        }
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

// Create company
app.get("/createCompany", (req, res) => {
  const compamny = {
    companyType: "Service Production",
    companyName: "The Crack-Lab",
    productionName: "Crack-Lab (Pty) Ltd",
    contactName: "Demian Hauptla",
    phone: "+21 123456789",
    emailAddress: "admin@crack-lab.com",
    imageURL:
      "https://www.facebook.com/616313961858253/photos/643261152496867/",
    ownerUID: "YwT70sFzKmg9nyYuUdeBVjsmUoe2",
  };

  collection
    .companies()
    .add({ ...compamny, contactNumber: "0123456789" })
    .then(() => {
      console.log("company created ");
      res.send({
        message: "company created",
        code: "success",
        status: 200,
      });
    })
    .catch((error) => {
      console.log("error occured", error);
      res.send({
        message: "unknown error occured",
        code: "error",
        status: 500,
      });
    });
});

// Set User Role
app.get("/setUserRole", (req, res) => {
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
  const routes = [
    // default routes - super admin | admin | profile user
    "/home",
    "/user-profile",
    "/pw-change",
    "/team",
    // super admin | admin
    "/companies",
    "/company_users",
    // super admin only
    "/admin",
    "/user-management",
    "/gs-config",
    // SA FILM Academy - admin
    "/alumni",
  ];
  const user = {
    role: ["Profile User"],
    rights: [], // user doesnt have any rights - can only view team member
    routes: [
      // default routes - super admin | admin | profile user
      "/home",
      "/user-profile",
      "/pw-change",
      "/team",
    ],
  };

  const admin = {
    role: ["Administrator"],
    rights: ["Add", "Edit", "Update", "Delete", "Export", "Distribute", "View"],
    routes: [
      // default routes - super admin | admin | profile user
      "/home",
      "/user-profile",
      "/pw-change",
      "/team",
      // super admin | admin
      "/companies",
      "/company_users",
    ],
  };

  const superadmin = {
    role: ["Super Administrator"],
    rights: rights,
    routes: [
      // default routes - super admin
      "/home",
      "/user-profile",
      "/pw-change",
      "/team",
      // super admin | admin
      "/companies",
      "/company_users",
      // super admin only
      "/admin",
      "/user-management",
      "/gs-config",
    ],
  };

  const filmadmin = {
    role: ["Academy Administrator"],
    rights: rights,
    routes: [
      // SA FILM Academy - admin
      "/alumni",
    ],
  };
  console.log("1. add the user roles");
  // 1. add the user roles
  const systemRoles = [superadmin, admin, user, filmadmin];
  const promises = [];
  systemRoles.forEach((promise) => {
    promises.push(
      collection
        .userRoles()
        .add({ name: promise.role[0], routes: promise.routes }),
    );
  });

  Promise.all(promises)
    .then(() => {
      console.log("2. fnd the user roles");
      // 2. fnd the user roles
      const roleObject = {};
      const arr = [];
      return collection
        .userRoles()
        .get()
        .then((docSnap) => {
          if (!docSnap.empty) {
            docSnap.forEach((doc) => {
              arr.push({
                name: doc.data()["name"],
                key: doc.id,
              });
            });
          }
          return arr;
        });
    })
    .then((userRole) => {
      // 3. find the keys of the permission collection
      let permissionObject = {};
      return collection
        .permissions()
        .get()
        .then((docSnap) => {
          if (!docSnap.empty) {
            docSnap.forEach((doc) => {
              permissionObject[doc.id] = doc.data()["name"];
            });
          }
          return { permissions: permissionObject, roles: userRole };
        });
    })
    .then((userRolePermissions) => {
      console.log("4. Configure Roles & Permissions");
      const finalArray = [];
      const tempArray = [];
      // 4. Configure Roles & Permissions
      const { roles, permissions } = userRolePermissions;
      systemRoles.forEach((config) => {
        const { role, rights } = config;
        console.log("Configuring " + role[0] + " User Role & Permissions...!");
        const p = Object.keys(permissions).reduce(
          (object, key) => {
            if ([permissions[key]].some((right) => rights.includes(right))) {
              const result = roles.find((r) => r.name === role[0]);
              console.log(
                "Link Permission Key => " + key,
                "With Role Key => " + result.key,
              );
              tempArray.push({ permission_key: key, role_key: result.key });
              object["can" + permissions[key]] = true;
              object.key = result.key;
            }
            return { ...object, link: tempArray };
          },
          { role_ref: role[0] }, // set a refrence to every object
        );
        return finalArray.push(p);
      });
      return finalArray;
    })
    .then((finalize) => {
      // 5. Link Role & Permissions on Firebase
      console.log("5. Link Role & Permissions on Firebase");
      const promises1 = [];
      const promises2 = [];
      finalize.forEach((data) => {
        if (data.key) {
          console.log(data.key);
          const { link } = data;
          link.map((object) => {
            // 5.1 Add role_permissions
            promises1.push(collection.rolePermissions().add(object));
          });
          const result = finalize.find((r) => r.role_ref === data.role_ref);
          delete result.link; // deleting fields not needed anymore
          delete result.role_ref; // deleting fields not needed anymore
          // delete result.key; // deleting fields not needed anymore
          // 5.2 Update user roles with linked permissions
          promises2.push(
            collection.userRole(data.key).set(result, { merge: true }),
          );
        }
      });
      return Promise.all(promises1, promises2);
      // res.send({ status: "ÖK" });
    })
    .then(() => {
      // 6. Send a response to the client
      console.log("6. Sending a response to the client");
      res.send({
        message: "Role Configuration Scripts Done",
        code: "success",
        status: 200,
      });
    })
    .catch((error) => {
      console.log("error occured", error);
      res.send({
        message: "unknown error occured",
        code: "error",
        status: 500,
      });
    });
});

app.get("/the-team", (req, res) => {
  const theTeam = {
    crewStatus: "P1",
    department: "IT Department",
    jobTitle: "Developer",
    firstName: "Glen",
    lastName: "Mogane",
    nationality: "ZA",
    cell: "+27617262421",
    emailAddress: "glen@fluidity.solutions",
  };

  collection
    .theTeams()
    .add(theTeam)
    .then((ref) => {
      request(
        "http://localhost:3001/setCompanyUserRole?docID=" + ref.id,
        function(error, response, body) {
          if (response && response.statusCode) {
            res.send({
              message: "Role Configuration Scripts Done",
              code: "success",
              status: 200,
            });
          } else {
            res.send({
              message: "Error Occured",
              code: "success",
              status: 500,
            });
          }
        },
      );
    })
    .catch((error) => {
      console.log("Error Occured On /the-team => ", error);
      res.send({
        message: "Error Occured",
        code: "error",
        status: 500,
      });
    });
});

// setCompanyUserRole
app.get("/setCompanyUserRole", (req, res) => {
  user
    .createUser({
      email: "glen@fluidity.solutions",
      password: "password",
      displayName: "Tswalano",
    })
    .then((response) => {
      console.log("User Created =>", response);
      const compamnyUserRole = {
        company: "FL41tzHLdjhK1aKUUSmo",
        role: "Administrator",
        team_key: req.param.docID,
        uid: response.uid,
      };
      return collection.companyUserRoles().add(compamnyUserRole);
    })
    .then((companyUserRoleDoc) => {
      console.log("company user role created => ", companyUserRoleDoc.id);
      res.send({
        message: "Team Member Created and Authenticated",
        code: "success",
        status: 200,
      });
    })
    .catch((error) => {
      console.log("Error Occured On /companyUserRoles => ", error);
      res.send({
        message: "Error Occured",
        code: "error",
        status: 500,
      });
    });
});

app.listen(port, () => console.log(`sdk app listening on port ${port}!`));
