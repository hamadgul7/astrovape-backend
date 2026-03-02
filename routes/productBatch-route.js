const express = require("express");
const router = express.Router();
const productBatchController = require("../controllers/productBatch-controller");
const verifyToken = require('../middlewares/verifyToken');


router.post("/addProductBatch", verifyToken, productBatchController.addProductBatch);
router.get("/getProductAllBatchesById/:id", productBatchController.getProductAllBatches);
router.get("/getProductBatchById/:id", productBatchController.getProductBatchById);
router.patch("/updateProductBatchById/:id", verifyToken, productBatchController.updateProductBatch);
router.delete("/deleteProductBatchById/:id", verifyToken, productBatchController.deleteProductBatch);
// router.get("/search", productBatchController.searchProductBatches);

module.exports = router;