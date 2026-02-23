const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
        }
    },
    {
        timestamps: true 
    }
);

module.exports = mongoose.model("Brand", userSchema);