const productService = require("../services/product-service");

// Add product (also adds product batch)
async function addProduct(req, res) {
    try {
        const data = req.body;
        const result = await ProductService.addProduct(data);
        res.status(201).json({
            message: "Product added successfully",
            product: result.product,
            productBatch: result.productBatch
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

// Get all products
async function getAllProducts(req, res) {
    try {
        const { pageNo = 1, limit = 10 } = req.query;

        const data = await productService.getAllProducts(pageNo, limit);

        res.status(200).json({
            success: true,
            message: "Products retrieved successfully",
            data: data.products,
            meta: data.meta
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Get product by id
async function getProductById(req, res) {
    try {
        const product = await productService.getProductById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({
            success: true, 
            message: "Product retrieved successfully", 
            data: product
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Update product
async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const data = req.body;

        const product = await productService.updateProduct(id, data);

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

// Delete product
async function deleteProduct(req, res) {
    try {
        const deletedProduct = await productService.deleteProduct(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    addProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};