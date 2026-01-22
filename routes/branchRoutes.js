const express = require("express");
const {
  getValidation,
  validate,
  authenticateUser,
  jwtObject,
} = require("../middleware/middlewareRules");

const branchController = require("../controllers/branchController");

let branchControllerFunc;
try {
  branchControllerFunc = branchController();
} catch (error) {
  branchControllerFunc = branchController;
}

const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchStats,
  getActiveBranches,
  getDestinationBranchesForUser,
} = branchControllerFunc;

const BranchRouter = express.Router();

BranchRouter.use(jwtObject, authenticateUser);

BranchRouter.get("/list", getAllBranches);
BranchRouter.get("/stats", getBranchStats);
BranchRouter.get("/active", getActiveBranches);
BranchRouter.get("/user-destinations", getDestinationBranchesForUser);

BranchRouter.get("/:id", getBranchById);
BranchRouter.delete("/delete/:id", deleteBranch);

BranchRouter.post(
  "/create",
  [getValidation("create:branch"), validate],
  createBranch,
);

BranchRouter.put(
  "/update",
  [getValidation("update:branch"), validate],
  updateBranch,
);

module.exports = BranchRouter;