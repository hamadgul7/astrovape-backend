const express = require("express");
const router = express.Router();
const productController = require("../controllers/product-controller");
const verifyToken = require('../middlewares/verifyToken');

router.post("/addProduct", verifyToken, productController.addProduct);          
router.get("/getAllProducts",  productController.getAllProducts);      
router.get("/getProductById/:id",  productController.getProductById);   
router.patch("/updateProductById/:id", verifyToken, productController.updateProduct);     
router.delete("/deleteProductById/:id", verifyToken, productController.deleteProduct); 

module.exports = router;