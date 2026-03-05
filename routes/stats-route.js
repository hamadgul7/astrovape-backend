const express = require("express");
const router = express.Router();
const statsController = require("../controllers/stats-controller");

router.get("/getToplineStats", statsController.getToplineStats);
router.get("/getProfitStats", statsController.getProfit);
router.get("/getMonthlyProfitTrend", statsController.getMonthlyProfitTrend);
router.get("/getTopSellingProductsByBrand/:id", statsController.getTopSellingProductsByBrand);

module.exports = router;