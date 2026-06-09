const Invoice = require("../models/invoice-model");
const Product = require("../models/product-model");
const mongoose = require("mongoose");

async function createInvoice(data) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { branchId, items, subTotal, totalDiscount, totalAmount, paymentMethod } = data;

        const updatedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);

            if (!product) {
                throw new Error("Product not found");
            }

            if (product.totalQuantity < item.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }

            // Reduce stock
            product.totalQuantity -= item.quantity;
            await product.save({ session });

            // Store item with unitBuyingCost
            updatedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                unitBuyingCost: product.buyingCost, // <-- added
            });
        }

        const invoice = await Invoice.create(
            [
                {
                    branchId, // assign invoice to branch
                    items: updatedItems,
                    subTotal,
                    totalDiscount,
                    totalAmount,
                    paymentMethod,
                },
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return invoice[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

async function createBulkInvoices(invoicesData) {
    if (!Array.isArray(invoicesData) || invoicesData.length === 0) {
        throw new Error("Invoices data must be a non-empty array");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        for (const data of invoicesData) {
            const { branchId, items, subTotal, totalDiscount, totalAmount, paymentMethod } = data;

            const updatedItems = [];

            for (const item of items) {
                const product = await Product.findById(item.productId).session(session);

                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }

                if (product.totalQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for product: ${product.name}`);
                }

                product.totalQuantity -= item.quantity;
                await product.save({ session });

                updatedItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    unitBuyingCost: product.buyingCost,
                });
            }

            await Invoice.create(
                [
                    {
                        branchId, 
                        items: updatedItems,
                        subTotal,
                        totalDiscount,
                        totalAmount,
                        paymentMethod,
                    },
                ],
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        return { success: true, message: "All invoices created successfully" };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}


async function getAllInvoices({
    page = 1,
    limit = 10,
    startDate,
    endDate,
    branchId,
    sku
}) {
    try {
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;

        const filter = {};

        // =========================
        // DATE FILTER
        // =========================
        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        // =========================
        // BRANCH FILTER
        // =========================
        if (branchId && branchId !== "both") {
            filter.branchId = new mongoose.Types.ObjectId(branchId);
        }

        // =========================
        // SKU FILTER
        // =========================
        if (sku) {
            const product = await Product.findOne({ sku }).select("_id");

            if (!product) {
                return {
                    invoices: [],
                    pageSummary: {
                        pageSales: 0,
                        pageProfit: 0
                    },
                    globalSummary: {
                        branchId: branchId || "both",
                        totalSales: 0,
                        totalProfit: 0
                    },
                    meta: {
                        totalItems: 0,
                        totalPages: 0,
                        currentPage: page,
                        pageLimit: limit,
                        nextPage: null,
                        previousPage: null
                    }
                };
            }

            filter["items.productId"] = product._id;
        }

        // =========================
        // PAGINATED INVOICES
        // =========================
        const totalItems = await Invoice.countDocuments(filter);

        let invoices = await Invoice.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("items.productId", "name sku brand")
            .populate("branchId", "name")
            .lean();

        // =========================
        // PAGE METRICS
        // =========================
        let pageProfit = 0;
        let pageSales = 0;

        invoices = invoices.map((invoice) => {
            pageSales += invoice.totalAmount || 0;

            let invoiceProfit = 0;

            invoice.items.forEach((item) => {
                invoiceProfit +=
                    (item.unitPrice - item.unitBuyingCost) * item.quantity;
            });

            invoiceProfit -= invoice.totalDiscount || 0;

            pageProfit += invoiceProfit;

            return {
                ...invoice,
                profit: invoiceProfit
            };
        });

        const totalPages = Math.ceil(totalItems / limit);

        // =========================
        // GLOBAL METRICS
        // =========================
        const globalResult = await Invoice.aggregate([
            {
                $match: filter
            },
            {
                $project: {
                    totalAmount: 1,
                    profit: {
                        $subtract: [
                            {
                                $reduce: {
                                    input: "$items",
                                    initialValue: 0,
                                    in: {
                                        $add: [
                                            "$$value",
                                            {
                                                $multiply: [
                                                    {
                                                        $subtract: [
                                                            "$$this.unitPrice",
                                                            "$$this.unitBuyingCost"
                                                        ]
                                                    },
                                                    "$$this.quantity"
                                                ]
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                $ifNull: ["$totalDiscount", 0]
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: {
                        $sum: "$totalAmount"
                    },
                    totalProfit: {
                        $sum: "$profit"
                    }
                }
            }
        ]);

        const totalSales = globalResult[0]?.totalSales || 0;
        const totalProfit = globalResult[0]?.totalProfit || 0;

        return {
            invoices,

            pageSummary: {
                pageSales,
                pageProfit
            },

            globalSummary: {
                branchId: branchId || "both",
                totalSales,
                totalProfit
            },

            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                pageLimit: limit,
                nextPage: page < totalPages ? page + 1 : null,
                previousPage: page > 1 ? page - 1 : null
            }
        };

    } catch (error) {
        throw error;
    }
}

async function getSingleInvoiceById(id) {
    const invoice = await Invoice.findById(id)
        .populate("items.productId", "name sku brand")
        .populate("branchId", "name")
        .lean();

    if (!invoice) {
        throw new Error("Invoice not found");
    }

    return invoice;
}

async function updateInvoice(id, data) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const existingInvoice = await Invoice.findById(id).session(session);

        if (!existingInvoice) {
            throw new Error("Invoice not found");
        }

        const updatedItems = [];

        for (let i = 0; i < data.items.length; i++) {
            const newItem = data.items[i];
            const oldItem = existingInvoice.items[i];

            const product = await Product.findById(newItem.productId).session(session);

            if (!product) {
                throw new Error("Product not found");
            }

            const difference = newItem.quantity - oldItem.quantity;

            if (difference > 0) {
                if (product.totalQuantity < difference) {
                    throw new Error(`Insufficient stock for product: ${product.name}`);
                }
                product.totalQuantity -= difference;
            }

            if (difference < 0) {
                product.totalQuantity += Math.abs(difference);
            }

            await product.save({ session });

            updatedItems.push({
                productId: newItem.productId,
                quantity: newItem.quantity,
                unitPrice: newItem.unitPrice,
                unitBuyingCost: product.buyingCost
            });
        }

        const invoice = await Invoice.findByIdAndUpdate(
            id,
            {
                branchId: data.branchId,
                items: updatedItems,
                subTotal: data.subTotal,
                totalDiscount: data.totalDiscount,
                totalAmount: data.totalAmount,
                paymentMethod: data.paymentMethod,
            },
            { returnDocument: 'after', runValidators: true, session }
        ).populate("items.productId", "name sku brand");

        await session.commitTransaction();
        session.endSession();

        return invoice;

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

async function deleteInvoice(id) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const invoice = await Invoice.findById(id).session(session);

        if (!invoice) {
            throw new Error("Invoice not found");
        }

        for (const item of invoice.items) {
            const product = await Product.findById(item.productId).session(session);

            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

            product.totalQuantity += item.quantity;

            await product.save({ session });
        }

        await Invoice.findByIdAndDelete(id).session(session);

        await session.commitTransaction();
        session.endSession();

        return invoice;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

async function getInvoicesByDate(date) {
    if (!date) {
        throw new Error("Date is required");
    }

    const start = new Date(date);
    const end = new Date(date);

    end.setHours(23, 59, 59, 999);

    const invoices = await Invoice.find({
        createdAt: {
            $gte: start,
            $lte: end,
        },
    })
        .sort({ createdAt: -1 })
        .populate("items.productId", "name sku brand")
        .populate("branchId", "name")
        .lean();

    let totalSales = 0;
    let totalDiscount = 0;
    let totalProfit = 0;

    const updatedInvoices = invoices.map((invoice) => {
        let invoiceProfit = 0;

        invoice.items.forEach((item) => {
            invoiceProfit +=
                (item.unitPrice - item.unitBuyingCost) * item.quantity;
        });

        invoiceProfit -= invoice.totalDiscount || 0;

        totalSales += invoice.totalAmount;
        totalDiscount += invoice.totalDiscount || 0;
        totalProfit += invoiceProfit;

        return {
            ...invoice,
            branchName: invoice.branchId?.name || null,
            profit: invoiceProfit,
        };
    });

    return {
        invoices: updatedInvoices,
        summary: {
            totalSales,
            totalProfit,
            totalDiscount,
        },
    };
}

module.exports = {
    createInvoice,
    createBulkInvoices,
    getAllInvoices,
    getSingleInvoiceById,
    updateInvoice,
    deleteInvoice,
    getInvoicesByDate,
};