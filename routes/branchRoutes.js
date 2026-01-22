const express = require("express");
const {
  getValidation,
  validate,
  authenticateUser,
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

BranchRouter.get("/list", getAllBranches);
BranchRouter.get("/stats", getBranchStats);
BranchRouter.get("/active", getActiveBranches);
BranchRouter.get("/:id", getBranchById);

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

BranchRouter.delete("/delete/:id", deleteBranch);

BranchRouter.get("/user-destinations", getDestinationBranchesForUser);

module.exports = BranchRouter;
