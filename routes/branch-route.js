const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branch-controller");
const verifyToken = require('../middlewares/verifyToken');

router.post("/createBranch", verifyToken, branchController.createBranch);
router.patch("/updateBranch/:id", verifyToken, branchController.updateBranch);
router.get("/getAllBranches", verifyToken, branchController.getAllBranches);

module.exports = router;