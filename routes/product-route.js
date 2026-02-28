const express = require("express");
const router = express.Router();
const productController = require("../controllers/product-controller");

// CRUD routes
router.post("/addProduct", productController.addProduct);           // Add product + batch
router.get("/getAllProducts", productController.getAllProducts);       // Get all products (pagination)
router.get("/getProductById/:id", productController.getProductById);    // Get single product
router.patch("/updateProductById/:id", productController.updateProduct);     // Update product
router.delete("/deleteProductById/:id", productController.deleteProduct);  // Delete product + batches

module.exports = router;