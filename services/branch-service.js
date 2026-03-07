const Branch = require("../models/branch-model");

async function createBranch(branchData) {
    const count = await Branch.countDocuments();
    if (count >= 2) {
        throw new Error("Cannot create more than 2 branches");
    }

    const branch = new Branch(branchData);
    return await branch.save();
}

async function updateBranch(branchId, updateData) {
    const branch = await Branch.findByIdAndUpdate(branchId, updateData, { new: true });
    if (!branch) {
        throw new Error("Branch not found");
    }
    return branch;
}

async function getAllBranches() {
    return await Branch.find();
}

module.exports = {
    createBranch,
    updateBranch,
    getAllBranches
};