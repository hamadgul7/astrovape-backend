const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        
        unitBuyingCost: { 
            type: Number, 
            required: true, 
            min: 0 
        },
    },
    { _id: false } 
);

const invoiceSchema = new mongoose.Schema(
    {
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch", 
            required: true,
        },

        items: {
            type: [invoiceItemSchema],
            required: true,
            validate: [
                (val) => val.length > 0,
                "Invoice must have at least one item",
            ],
        },

        subTotal: {
            type: Number,
            required: true,
            min: 0,
        },

        totalDiscount: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        paymentMethod: {
            type: String,
            default: "Cash",
            enum: ["Cash", "Card"],
        },

    },
    { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);