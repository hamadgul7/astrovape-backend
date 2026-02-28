const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        brand: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
            name: { type: String, required: true, trim: true }
        },

        buyingCost: {
            type: Number,
            required: true,
            min: 0
        },

        sellingCost: {
            type: Number,
            required: true,
            min: 0
        },

        totalQuantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Product", productSchema);