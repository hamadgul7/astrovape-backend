const Product = require("../models/product-model");
const Invoice = require("../models/invoice-model");
const Brand = require("../models/brand-model");
const mongoose = require("mongoose");
const Branch = require("../models/branch-model");



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

        const inventoryResult = await Product.aggregate([
            { $project: { worth: { $multiply: ["$buyingCost", "$totalQuantity"] } } },
            { $group: { _id: null, inventoryWorth: { $sum: "$worth" } } }
        ]);
        const inventoryWorth = inventoryResult.length ? inventoryResult[0].inventoryWorth : 0;

        const allTimeResult = await Invoice.aggregate(getPipeline());
        let allTimeStats = { totalRevenue: 0, totalProfit: 0, totalDiscount: 0, inventoryWorth: inventoryWorth };

        if (allTimeResult.length) {
            const r = allTimeResult[0];

            allTimeStats = {
                totalRevenue: r.totalRevenue,
                totalProfit: r.totalProfit,
                totalDiscount: r.totalDiscount,
                inventoryWorth: inventoryWorth
            };
        }

        const monthResult = await Invoice.aggregate(getPipeline({
            createdAt: { $gte: firstDay, $lte: lastDay }
        }));

        let currentMonthStats = { totalRevenue: 0, totalProfit: 0, totalDiscount: 0 };

        if (monthResult.length) {
            const r = monthResult[0];

            currentMonthStats = {
                totalRevenue: r.totalRevenue,
                totalProfit: r.totalProfit,
                totalDiscount: r.totalDiscount
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


// async function getTopProduct(allItemsArrays) {
//     const allItems = allItemsArrays.flat();
//     const qtyMap = {};

//     for (const item of allItems) {
//         const pid = item.productId.toString();
//         qtyMap[pid] = (qtyMap[pid] || 0) + item.quantity;
//     }

//     let topProductId = null, maxQty = 0;
//     for (const [pid, qty] of Object.entries(qtyMap)) {
//         if (qty > maxQty) {
//             maxQty = qty;
//             topProductId = pid;
//         }
//     }

//     if (!topProductId) return null;

//     const product = await Product.findById(topProductId).select("name");
//     return { name: product ? product.name : null, quantitySold: maxQty };
// }


async function getProfitByPeriod(year, month = null) {
    try {

        if (!year) throw new Error("Year is required");

        if (month) {

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

            const weeks = [1,2,3,4].map(function(w){
                const found = result.find(function(r){ return r._id === w });
                return {
                    week: w,
                    profit: found ? found.profit : 0
                };
            });

            return weeks;

        } else {

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

    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = startOfCurrentMonth;

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

    let products;

    if (brandId) {
        products = await Product.find({ "brand.id": brandId })
            .select("_id name totalQuantity");
    } 
    else {
        products = await Product.find()
            .select("_id name totalQuantity");
    }

    const productIds = products.map(p => p._id);

    if (!productIds.length) return [];

    const soldData = await Invoice.aggregate([
        { $unwind: "$items" },
        {
            $match: {
                "items.productId": { $in: productIds }
            }
        },
        {
            $group: {
                _id: "$items.productId",
                soldQuantity: { $sum: "$items.quantity" }
            }
        }
    ]);

    const result = products.map(p => {
        const soldItem = soldData.find(
            s => s._id.toString() === p._id.toString()
        );

        const soldQuantity = soldItem ? soldItem.soldQuantity : 0;

        return {
            name: p.name,
            soldQuantity,
            remainingQuantity: p.totalQuantity
        };
    });

    result.sort((a, b) => b.soldQuantity - a.soldQuantity);

    return result.slice(0, 5);
}

async function calculateBranchSales(startDate, endDate) {
    try {
        const matchFilter = {};

        if (startDate && endDate) {
            matchFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const sales = await Branch.aggregate([
            {
                $lookup: {
                    from: "invoices",
                    let: { branchId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$branchId", "$$branchId"]
                                },
                                ...matchFilter
                            }
                        },
                        {
                            $project: {
                                invoiceProfit: {
                                    $subtract: [
                                        {
                                            $sum: {
                                                $map: {
                                                    input: "$items",
                                                    as: "item",
                                                    in: {
                                                        $multiply: [
                                                            {
                                                                $subtract: [
                                                                    "$$item.unitPrice",
                                                                    "$$item.unitBuyingCost"
                                                                ]
                                                            },
                                                            "$$item.quantity"
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        "$totalDiscount"
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalSales: {
                                    $sum: "$invoiceProfit"
                                }
                            }
                        }
                    ],
                    as: "salesData"
                }
            },
            {
                $project: {
                    branchId: "$_id",
                    branchName: "$name",
                    totalSales: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    "$salesData.totalSales",
                                    0
                                ]
                            },
                            0
                        ]
                    }
                }
            }
        ]);

        return sales;

    } catch (error) {
        throw error;
    }
}

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildDateMatch(startDate, endDate) {
    if (!startDate && !endDate) return {};

    const createdAt = {};

    if (startDate) {
        createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
        const end = new Date(endDate);
        if (!String(endDate).includes("T")) {
            end.setHours(23, 59, 59, 999);
        }
        createdAt.$lte = end;
    }

    return { createdAt };
}

async function getProductSales({ startDate, endDate, barcode, name }) {
    if (!barcode && !name) {
        throw new Error("Provide a barcode or product name to search");
    }

    let productFilter = {};

    if (barcode) {
        const normalizedBarcode = String(barcode).trim().toUpperCase();
        productFilter.skus = normalizedBarcode;
    } else {
        productFilter.name = {
            $regex: escapeRegex(String(name).trim()),
            $options: "i"
        };
    }

    const products = await Product.find(productFilter).sort({ createdAt: -1 });

    if (!products.length) {
        return [];
    }

    const productIds = products.map((p) => p._id);
    const dateMatch = buildDateMatch(startDate, endDate);

    const salesData = await Invoice.aggregate([
        ...(Object.keys(dateMatch).length ? [{ $match: dateMatch }] : []),
        { $unwind: "$items" },
        {
            $match: {
                "items.productId": { $in: productIds }
            }
        },
        {
            $group: {
                _id: {
                    productId: "$items.productId",
                    branchId: "$branchId"
                },
                unitsSold: { $sum: "$items.quantity" },
                totalSales: {
                    $sum: {
                        $multiply: ["$items.unitPrice", "$items.quantity"]
                    }
                },
                totalProfit: {
                    $sum: {
                        $multiply: [
                            {
                                $subtract: [
                                    "$items.unitPrice",
                                    "$items.unitBuyingCost"
                                ]
                            },
                            "$items.quantity"
                        ]
                    }
                }
            }
        },
        {
            $lookup: {
                from: "branches",
                localField: "_id.branchId",
                foreignField: "_id",
                as: "branch"
            }
        },
        {
            $project: {
                productId: "$_id.productId",
                branchId: "$_id.branchId",
                branchName: {
                    $ifNull: [{ $arrayElemAt: ["$branch.name", 0] }, "Unknown"]
                },
                unitsSold: 1,
                totalSales: 1,
                totalProfit: 1
            }
        }
    ]);

    return products.map((product) => {
        const productSales = salesData.filter(
            (s) => s.productId.toString() === product._id.toString()
        );

        const branchSales = productSales.map((s) => ({
            branchId: s.branchId,
            branchName: s.branchName,
            unitsSold: s.unitsSold,
            totalSales: s.totalSales,
            totalProfit: s.totalProfit
        }));

        const totalUnitsSold = branchSales.reduce((sum, b) => sum + b.unitsSold, 0);
        const totalSales = branchSales.reduce((sum, b) => sum + b.totalSales, 0);
        const totalProfit = branchSales.reduce((sum, b) => sum + b.totalProfit, 0);

        return {
            product: {
                _id: product._id,
                name: product.name,
                barcode: product.skus,
                skus: product.skus,
                brand: product.brand,
                buyingCost: product.buyingCost,
                sellingCost: product.sellingCost,
                totalQuantity: product.totalQuantity,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt
            },
            name: product.name,
            barcode: product.skus,
            totalUnitsSold,
            totalSales,
            totalProfit,
            createdAt: product.createdAt,
            branchSales
        };
    });
}

module.exports = {
    getToplineStats,
    getProfitByPeriod,
    getMonthlyProfitTrend,
    getTopSellingProductsByBrand,
    calculateBranchSales,
    getProductSales
};
