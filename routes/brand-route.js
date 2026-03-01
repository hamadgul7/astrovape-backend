const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brand-controller");
const verifyToken = require('../middlewares/verifyToken');

router.post("/add", verifyToken, brandController.addBrand);
router.get("/all", verifyToken, brandController.getAllBrands);
router.get("/:id", verifyToken, brandController.getBrand);
router.put("/update/:id", verifyToken, brandController.updateBrand);
router.delete("/delete/:id", verifyToken, brandController.deleteBrand);

module.exports = router;