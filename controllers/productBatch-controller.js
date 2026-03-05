const productBatchService = require("../services/productBatch-service");

async function addProductBatch(req, res) {
    try {
        const batch = await productBatchService.addProductBatch(req.body);
        res.status(201).json({
            success: true,
            message: "Product batch added successfully",
            data: batch
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function getProductAllBatches(req, res) {
    try {
        const { pageNo = 1, limit = 10 } = req.query;
        const productId = req.params.id;
        const data = await productBatchService.getProductAllBatches(pageNo, limit, productId);
        res.status(200).json({
            success: true,
            message: "Product batches retrieved successfully",
            data: data.batches,
            meta: data.meta
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

async function getProductBatchById(req, res) {
    try {
        const batch = await productBatchService.getProductBatchById(req.params.id);
        if (!batch) return res.status(404).json({ 
            success: false, 
            message: "Batch not found" 
        });
        
        res.status(200).json({ 
            success: true, 
            message: "Product batch retrieved successfully", 
            data: batch 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

async function updateProductBatch(req, res) {
    try {
        const batch = await productBatchService.updateProductBatch(req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: "Product batch updated successfully",
            data: batch
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

async function deleteProductBatch(req, res) {
    try {
        const batch = await productBatchService.deleteProductBatch(req.params.id);
        res.status(200).json({
            success: true,
            message: "Product batch deleted successfully",
            data: batch
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
}

// async function searchProductBatches(req, res) {
//     try {
//         const { pageNo, limit, search } = req.query;
//         const data = await productBatchService.searchProductBatches({ pageNo, limit, search });
//         res.status(200).json({
//             success: true,
//             message: "Product batches retrieved successfully",
//             data: data.batches,
//             meta: data.meta
//         });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// }

module.exports = {
    addProductBatch,
    getProductAllBatches,
    getProductBatchById,
    updateProductBatch,
    deleteProductBatch,
    // searchProductBatches
};