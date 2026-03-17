const productService = require("../services/product-service");

async function addProduct(req, res) {
    try {
        const data = req.body;
        const result = await productService.addProduct(data);
        res.status(201).json({
            message: "Product added successfully",
            product: result.product,
            productBatch: result.productBatch
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

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

async function deleteProduct(req, res) {
    try {
        const deletedProduct = await productService.deleteProduct(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function searchProducts(req, res) {
    try {
        const { pageNo, limit, search } = req.query;

        const result = await productService.searchProducts({
            pageNo,
            limit,
            search
        });

        return res.status(200).json({
            success: true,
            message: "Products retrieved successfully",
            data: result.products,
            meta: result.meta
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching products",
            error: error.message
        });
    }
}


async function addBulkProducts(req, res) {
    try {
        const productsData = req.body; 

        if (!Array.isArray(productsData) || productsData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide an array of products to add"
            });
        }

        const { products, productBatches } = await productService.addBulkProducts(productsData);

        res.status(201).json({
            success: true,
            message: "Products added successfully",
            data: {
                products,
                productBatches
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function searchProductsBySku(req, res) {
    try {
        const { pageNo, limit, search } = req.query;

        const result = await productService.searchProductsBySku({
            pageNo,
            limit,
            search
        });

        return res.status(200).json({
            success: true,
            message: "Products retrieved successfully",
            data: result.products,
            meta: result.meta
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching products",
            error: error.message
        });
    }
}


async function searchProductsBySkuOrName(req, res) {
    try {
        const { pageNo, limit, search } = req.query;

        const result = await productService.searchProductsBySkuOrName({
            pageNo,
            limit,
            search
        });

        return res.status(200).json({
            success: true,
            message: "Products retrieved successfully",
            data: result.products,
            meta: result.meta
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching products",
            error: error.message
        });
    }
}




module.exports = {
    addProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    searchProducts,
    addBulkProducts,
    searchProductsBySku,
    searchProductsBySkuOrName
};