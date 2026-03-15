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


async function getAllInvoices({ page = 1, limit = 10 }) {
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const totalItems = await Invoice.countDocuments();

    const invoices = await Invoice.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("items.productId", "name sku brand")
        .lean();

    const totalPages = Math.ceil(totalItems / limit);

    return {
        invoices,
        meta: {
            totalItems,
            totalPages,
            currentPage: page,
            pageLimit: limit,
            nextPage: page < totalPages ? page + 1 : null,
            previousPage: page > 1 ? page - 1 : null,
        },
    };
}




async function getSingleInvoiceById(id) {
    const invoice = await Invoice.findById(id)
        .populate("items.productId", "name sku brand")
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
    const invoice = await Invoice.findByIdAndDelete(id);

    if (!invoice) {
        throw new Error("Invoice not found");
    }

    return invoice;
}

module.exports = {
    createInvoice,
    createBulkInvoices,
    getAllInvoices,
    getSingleInvoiceById,
    updateInvoice,
    deleteInvoice,
};