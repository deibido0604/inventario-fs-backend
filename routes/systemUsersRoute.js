var express = require("express");
const {
  getValidation,
  validate,
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

systemUserRouter.post("/login", loginSystemUser);
systemUserRouter.get("/list", getAllSystemUsers);
systemUserRouter.get("/:id", getSystemUserById);
systemUserRouter.post(
  "/create",
  [getValidation("create:user"), validate],
  createSystemUser
);
systemUserRouter.put(
  "/update",
  [getValidation("update:user"), validate],
  updateSystemUser
);
systemUserRouter.delete("/delete/:id", deleteSystemUser);
systemUserRouter.post("/logout", logoutSystemUser);

module.exports = systemUserRouter;