const Invoice = require("../models/invoice-model");
const Product = require("../models/product-model");
const mongoose = require("mongoose");

async function createInvoice(data) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, subTotal, totalDiscount, totalAmount, paymentMethod } = data;

        for (const item of items) {
        const product = await Product.findById(item.productId).session(session);

        if (!product) {
            throw new Error("Product not found");
        }

        if (product.totalQuantity < item.quantity) {
            throw new Error(
            `Insufficient stock for product: ${product.name}`
            );
        }

        product.totalQuantity -= item.quantity;

        await product.save({ session });
        }

        const invoice = await Invoice.create(
        [
            {
                items,
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
        const { items, subTotal, totalDiscount, totalAmount, paymentMethod } = data;

        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);

            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

            if (product.totalQuantity < item.quantity) {
                throw new Error(
                    `Insufficient stock for product: ${product.name}`
                );
            }

            product.totalQuantity -= item.quantity;
            await product.save({ session });
        }

        await Invoice.create(
            [
                {
                    items,
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


module.exports = {
    createInvoice,
    createBulkInvoices,
};