const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brand-controller");

router.post("/add", brandController.addBrand);
router.get("/all", brandController.getAllBrands);
router.get("/:id", brandController.getBrand);
router.put("/update/:id", brandController.updateBrand);
router.delete("/delete/:id", brandController.deleteBrand);

module.exports = router;