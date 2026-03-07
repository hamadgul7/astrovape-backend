const statsService = require("../services/stats-service");
const Brand = require("../models/brand-model");

async function getToplineStats(req, res) {
    try {
        const stats = await statsService.getToplineStats();
        return res.status(200).json({
            success: true,
            allTime: stats.allTime,
            currentMonth: stats.currentMonth
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }

}


async function getProfit(req, res) {
    try {
        const { year, month } = req.query;

        const stats = await statsService.getProfitByPeriod(
            Number(year),
            month ? Number(month) : null
        );

        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


async function getMonthlyProfitTrend(req, res) {
    try {
        const data = await statsService.getMonthlyProfitTrend();

        return res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getTopSellingProductsByBrand(req, res) {
    try {
        const brandId  = req.params.id;

        const brand = await Brand.findById(brandId).select("name");
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found"
            });
        }

        const topProducts = await statsService.getTopSellingProductsByBrand(brandId);

        return res.status(200).json({
            success: true,
            data: {
                brandId: brand._id,
                brandName: brand.name,
                topProducts
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


async function getBranchSales(req, res) {
    try {
        const salesData = await statsService.calculateBranchSales();
        return res.status(200).json({ success: true, data: salesData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}


module.exports = {
    getToplineStats,
    getProfit,
    getMonthlyProfitTrend,
    getTopSellingProductsByBrand,
    getBranchSales
};
