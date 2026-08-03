const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        skus: {
            type: [
                {
                    type: String,
                    trim: true,
                    uppercase: true
                }
            ],
            required: true,
            validate: {
                validator: function (value) {
                    return Array.isArray(value) && value.length > 0;
                },
                message: "At least one SKU is required"
            }
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

// Each SKU value must be unique across all products
productSchema.index({ skus: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);
