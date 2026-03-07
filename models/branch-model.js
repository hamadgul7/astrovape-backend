const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        }
    },
    { timestamps: true } 
);

const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;