const express = require("express");
const router = express.Router();
const multer = require("multer");
const brandController = require("../controllers/brand-controller");
const verifyToken = require('../middlewares/verifyToken');

// Multer setup for single image
const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

router.post("/add", verifyToken, upload.single("image"), brandController.addBrand);
router.get("/all", verifyToken, brandController.getAllBrands);
router.get("/search", verifyToken, brandController.searchBrands);
router.get("/:id", verifyToken, brandController.getBrand);
router.put("/update/:id", verifyToken, upload.single("image"), brandController.updateBrand);
router.delete("/delete/:id", verifyToken, brandController.deleteBrand);

module.exports = router;