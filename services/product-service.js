const Product = require("../models/product-model");
const ProductBatch = require("../models/productBatch-model");
const Brand = require("../models/brand-model");

// Add Product + ProductBatch
async function addProduct(data) {
    // Check if SKU already exists exactly as provided
    const existingSKU = await Product.findOne({ sku: data.sku });
    if (existingSKU) {
        throw new Error("SKU already exists. Please use a unique SKU.");
    }

    // Fetch brand name using brandId
    const brand = await Brand.findById(data.brandId);
    if (!brand) {
        throw new Error("Brand not found");
    }

    const brandObj = { id: brand._id, name: brand.name };

    // Create Product
    const product = await Product.create({
        name: data.name,
        sku: data.sku, // keep as provided
        brand: brandObj,
        buyingCost: data.buyingCost,
        sellingCost: data.sellingCost,
        totalQuantity: data.totalQuantity
    });

    // Create ProductBatch
    const productBatch = await ProductBatch.create({
        productId: product._id,
        name: data.name,
        sku: data.sku, // keep as provided
        brand: brandObj,
        buyingCost: data.buyingCost,
        sellingCost: data.sellingCost,
        totalQuantity: data.totalQuantity
    });

    return { product, productBatch };
}

// Other service functions remain the same
async function getAllProducts(page = 1, limit = 10) {
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const totalItems = await Product.countDocuments();

    const products = await Product.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const totalPages = Math.ceil(totalItems / limit);

    return {
        products,
        meta: {
            totalItems,
            totalPages,
            currentPage: page,
            pageLimit: limit,
            nextPage: page < totalPages ? page + 1 : null,
            previousPage: page > 1 ? page - 1 : null
        }
    };
}



async function getProductById(id) {
    return Product.findById(id);
}


async function updateProduct(id, data) {
    // If SKU is being updated, check uniqueness
    if (data.sku) {
        const existingSKU = await Product.findOne({ sku: data.sku, _id: { $ne: id } });
        if (existingSKU) {
            throw new Error(`SKU already exists. Please use a unique SKU.`);
        }
    }

    // If brandId is provided, fetch the brand name
    if (data.brandId) {
        const brand = await Brand.findById(data.brandId);
        if (!brand) {
            throw new Error("Brand not found");
        }
        data.brand = {
            id: brand._id,
            name: brand.name
        };
    }

    // Build update object with only provided fields
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.buyingCost !== undefined) updateData.buyingCost = data.buyingCost;
    if (data.sellingCost !== undefined) updateData.sellingCost = data.sellingCost;
    if (data.brand !== undefined) updateData.brand = data.brand;

    if (data.totalQuantity !== undefined) {
        const product = await Product.findById(id);
        if (!product) throw new Error("Product not found");
        updateData.totalQuantity = product.totalQuantity + data.totalQuantity;
    }

    // Update Product
    const product = await Product.findByIdAndUpdate(id, updateData, {
        returnDocument: 'after',
        runValidators: true
    });

    if (!product) {
        throw new Error("Product not found");
    }

    return product;
}

async function deleteProduct(id) {
    const product = await Product.findByIdAndDelete(id);
    // if (product) {
    //     await ProductBatch.deleteMany({ productId: id });
    // }
    return product;
}


module.exports = {
    addProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};