var express = require("express");
const {
  jwtObject,
  getValidation,
  validate,
  authenticateUser,
} = require("../middleware/middlewareRules");
const systemUserController = require("../controllers/systemUserController");


const {
  getAllSystemUsers,
  getSystemUserById,
  createSystemUser,
  updateSystemUser,
  deleteSystemUser,
  loginSystemUser,
  logoutSystemUser
} = systemUserController();

var systemUserRouter = express.Router();

systemUserRouter.post(
  "/login",
  loginSystemUser
);

systemUserRouter.get("/list", jwtObject, getAllSystemUsers);
systemUserRouter.get("/:id", jwtObject, getSystemUserById);
systemUserRouter.post(
  "/create",
  [
    getValidation("create:user"),
    validate,
    jwtObject,
    authenticateUser,
  ],
  createSystemUser
);
systemUserRouter.put(
  "/update",
  [
    getValidation("update:user"),
    validate,
    jwtObject,
    authenticateUser,
  ],
  updateSystemUser
);
systemUserRouter.delete(
  "/delete/:id", 
  [jwtObject, authenticateUser], 
  deleteSystemUser
);
systemUserRouter.post(
  "/logout",
  [jwtObject, authenticateUser],
  logoutSystemUser
);

module.exports = systemUserRouter;