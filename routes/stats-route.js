const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats-controller");
const verifyToken = require('../middlewares/verifyToken');

router.get("/getToplineStats", verifyToken, statsController.getToplineStats);
router.get("/getProfitStats", verifyToken, statsController.getProfit);
router.get("/getMonthlyProfitTrend", verifyToken, statsController.getMonthlyProfitTrend);
router.get("/getTopSellingProductsByBrand/:id", verifyToken, statsController.getTopSellingProductsByBrand);

module.exports = router;