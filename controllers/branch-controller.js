const branchService = require("../services/branch-service");

async function createBranch(req, res) {
    try {
        const branch = await branchService.createBranch(req.body);
        res.status(201).json({
            success: true,
            message: "Branch created successfully",
            data: branch
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function updateBranch(req, res) {
    try {
        const branch = await branchService.updateBranch(req.params.id, req.body);
        res.status(200).json({
            returnDocument: 'after',
            message: "Branch updated successfully",
            data: branch
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getAllBranches(req, res) {
    try {
        const branches = await branchService.getAllBranches();
        res.status(200).json({
            success: true,
            data: branches
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    createBranch,
    updateBranch,
    getAllBranches
};