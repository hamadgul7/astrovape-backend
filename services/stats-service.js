const Product = require("../models/product-model");
const Invoice = require("../models/invoice-model");
const Brand = require("../models/brand-model");
const mongoose = require("mongoose");



const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

async function getToplineStats() {
    try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        function getPipeline(matchFilter = {}) {
            return [
                { $match: matchFilter },
                {
                    $project: {
                        totalRevenue: "$totalAmount",
                        totalDiscount: 1,
                        totalProfit: {
                            $sum: {
                                $map: {
                                    input: "$items",
                                    as: "item",
                                    in: {
                                        $multiply: [
                                            { $subtract: ["$$item.unitPrice", "$$item.unitBuyingCost"] },
                                            "$$item.quantity"
                                        ]
                                    }
                                }
                            }
                        },
                        items: 1
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$totalRevenue" },
                        totalDiscount: { $sum: "$totalDiscount" },
                        totalProfit: { $sum: { $subtract: ["$totalProfit", "$totalDiscount"] } },
                        allItems: { $push: "$items" }
                    }
                }
            ];
        }

        // All-time stats
        const allTimeResult = await Invoice.aggregate(getPipeline());
        let allTimeStats = { totalRevenue: 0, totalProfit: 0, totalDiscount: 0, topSellingProduct: null };
        if (allTimeResult.length) {
            const r = allTimeResult[0];
            allTimeStats = {
                totalRevenue: r.totalRevenue,
                totalProfit: r.totalProfit,
                totalDiscount: r.totalDiscount,
                topSellingProduct: await getTopProduct(r.allItems)
            };
        }

        // Current month stats
        const monthResult = await Invoice.aggregate(getPipeline({
            createdAt: { $gte: firstDay, $lte: lastDay }
        }));
        let currentMonthStats = { totalRevenue: 0, totalProfit: 0, totalDiscount: 0, topSellingProduct: null };
        if (monthResult.length) {
            const r = monthResult[0];
            currentMonthStats = {
                totalRevenue: r.totalRevenue,
                totalProfit: r.totalProfit,
                totalDiscount: r.totalDiscount,
                topSellingProduct: await getTopProduct(r.allItems)
            };
        }

        return {
            allTime: allTimeStats,
            currentMonth: currentMonthStats
        };

    } catch (error) {
        throw error;
    }
}

// Helper function to find top-selling product (name + quantity)
async function getTopProduct(allItemsArrays) {
    const allItems = allItemsArrays.flat();
    const qtyMap = {};

    for (const item of allItems) {
        const pid = item.productId.toString();
        qtyMap[pid] = (qtyMap[pid] || 0) + item.quantity;
    }

    let topProductId = null, maxQty = 0;
    for (const [pid, qty] of Object.entries(qtyMap)) {
        if (qty > maxQty) {
            maxQty = qty;
            topProductId = pid;
        }
    }

    if (!topProductId) return null;

    const product = await Product.findById(topProductId).select("name");
    return { name: product ? product.name : null, quantitySold: maxQty };
}


async function getProfitByPeriod(year, month = null) {
    try {

        if (!year) throw new Error("Year is required");

        if (month) {

            // WEEKLY PROFIT
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);

            const result = await Invoice.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $project: {
                        createdAt: 1,
                        totalDiscount: 1,
                        profit: {
                            $sum: {
                                $map: {
                                    input: "$items",
                                    as: "item",
                                    in: {
                                        $multiply: [
                                            { $subtract: ["$$item.unitPrice","$$item.unitBuyingCost"] },
                                            "$$item.quantity"
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        week: {
                            $min: [
                                { $ceil: { $divide: [{ $dayOfMonth: "$createdAt" }, 7] } },
                                4
                            ]
                        },
                        profit: { $subtract: ["$profit","$totalDiscount"] }
                    }
                },
                {
                    $group: {
                        _id: "$week",
                        profit: { $sum: "$profit" }
                    }
                }
            ]);

            // ensure all 4 weeks exist
            const weeks = [1,2,3,4].map(function(w){
                const found = result.find(function(r){ return r._id === w });
                return {
                    week: w,
                    profit: found ? found.profit : 0
                };
            });

            return weeks;

        } else {

            // MONTHLY PROFIT
            const startDate = new Date(year,0,1);
            const endDate = new Date(year,11,31,23,59,59,999);

            const result = await Invoice.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $project: {
                        totalDiscount: 1,
                        month: { $month: "$createdAt" },
                        profit: {
                            $sum: {
                                $map: {
                                    input: "$items",
                                    as: "item",
                                    in: {
                                        $multiply: [
                                            { $subtract: ["$$item.unitPrice","$$item.unitBuyingCost"] },
                                            "$$item.quantity"
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        month: 1,
                        profit: { $subtract: ["$profit","$totalDiscount"] }
                    }
                },
                {
                    $group: {
                        _id: "$month",
                        profit: { $sum: "$profit" }
                    }
                }
            ]);

            // ensure all 12 months exist
            const months = monthNames.map(function(name, index){

                const found = result.find(function(r){
                    return r._id === index + 1;
                });

                return {
                    month: name,
                    profit: found ? found.profit : 0
                };

            });

            return months;
        }

    } catch (error) {
        throw error;
    }
}


async function getMonthlyProfitTrend() {
    const now = new Date();

    // Current month start/end
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Previous month start/end
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = startOfCurrentMonth;

    // Function to calculate profit for a period
    async function calculateProfit(startDate, endDate) {
        const result = await Invoice.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $project: {
                    totalDiscount: 1,
                    itemsProfit: {
                        $sum: {
                            $map: {
                                input: "$items",
                                as: "item",
                                in: {
                                    $multiply: [
                                        { $subtract: ["$$item.unitPrice", "$$item.unitBuyingCost"] },
                                        "$$item.quantity"
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    profit: { $subtract: ["$itemsProfit", "$totalDiscount"] }
                }
            },
            {
                $group: {
                    _id: null,
                    profit: { $sum: "$profit" }
                }
            }
        ]);

        return result.length ? result[0].profit : 0;
    }

    const currentProfit = await calculateProfit(startOfCurrentMonth, startOfNextMonth);
    const previousProfit = await calculateProfit(startOfPreviousMonth, endOfPreviousMonth);

    let trend = "stable";
    if (currentProfit > previousProfit) trend = "up";
    else if (currentProfit < previousProfit) trend = "down";

    const monthName = now.toLocaleString("default", { month: "long" });

    return {
        month: monthName,
        profit: currentProfit,
        trend: trend
    };
}



async function getTopSellingProductsByBrand(brandId) {
    // 1️⃣ Get all products of the brand
    const products = await Product.find({ "brand.id": brandId }).select("_id name totalQuantity");

    const productIds = products.map(p => p._id);

    if (!productIds.length) return [];

    // 2️⃣ Aggregate invoices to calculate soldQuantity per product
    const soldData = await Invoice.aggregate([
        { $unwind: "$items" },
        { $match: { "items.productId": { $in: productIds } } },
        {
            $group: {
                _id: "$items.productId",
                soldQuantity: { $sum: "$items.quantity" }
            }
        }
    ]);

    // 3️⃣ Map sold quantities to products
    const topProducts = products.map(p => {
        const soldItem = soldData.find(s => s._id.toString() === p._id.toString());
        const soldQuantity = soldItem ? soldItem.soldQuantity : 0;
        const remainingQuantity = p.totalQuantity - soldQuantity;
        return {
            name: p.name,
            soldQuantity,
            remainingQuantity
        };
    });

    // 4️⃣ Sort descending by soldQuantity and take top 5
    topProducts.sort((a, b) => b.soldQuantity - a.soldQuantity);

    return topProducts.slice(0, 5);
}


module.exports = {
    getToplineStats,
    getProfitByPeriod,
    getMonthlyProfitTrend,
    getTopSellingProductsByBrand
};
