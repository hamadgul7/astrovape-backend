const Product = require("../models/product-model");
const ProductBatch = require("../models/productBatch-model");
const Brand = require("../models/brand-model");
const { normalizeSkus, assertSkusAreUnique } = require("../utils/sku");

async function addProduct(data) {
    const skus = normalizeSkus(data);
    await assertSkusAreUnique(Product, skus);

    const brand = await Brand.findById(data.brandId);
    if (!brand) {
        throw new Error("Brand not found");
    }

    const brandObj = { id: brand._id, name: brand.name };

    const product = await Product.create({
        name: data.name,
        skus,
        brand: brandObj,
        buyingCost: data.buyingCost,
        sellingCost: data.sellingCost,
        totalQuantity: data.totalQuantity
    });

    const productBatch = await ProductBatch.create({
        productId: product._id,
        name: "B-01",
        brand: brandObj,
        buyingCost: data.buyingCost,
        sellingCost: data.sellingCost,
        totalQuantity: data.totalQuantity
    });

    return { product, productBatch };
}

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
    const hasSkusPayload = data.skus !== undefined || data.sku !== undefined;

    if (hasSkusPayload) {
        const skus = normalizeSkus(data);
        await assertSkusAreUnique(Product, skus, id);
        data.skus = skus;
    }

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

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.skus !== undefined) updateData.skus = data.skus;
    if (data.buyingCost !== undefined) updateData.buyingCost = data.buyingCost;
    if (data.sellingCost !== undefined) updateData.sellingCost = data.sellingCost;
    if (data.brand !== undefined) updateData.brand = data.brand;

    if (data.totalQuantity !== undefined) {
        updateData.totalQuantity = data.totalQuantity;
    }

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


const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


async function searchProducts({ pageNo, limit, search }) {
    const pageNumber = parseInt(pageNo) || 1;
    const pageLimit = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;

    let filter = {};

    if (search) {
        const escapedSearch = escapeRegex(search);
        filter.name = {
            $regex: escapedSearch,
            $options: "i"
        };
    }

    const totalItems = await Product.countDocuments(filter);

    const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit);

    return {
        products,
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / pageLimit),
            currentPage: pageNumber,
            pageSize: pageLimit
        }
    };
}


async function addBulkProducts(productsData) {
    const createdProducts = [];
    const createdBatches = [];

    // Collect all SKUs in this bulk request to catch duplicates within the payload
    const seenInPayload = new Set();

    for (const data of productsData) {
        const skus = normalizeSkus(data);
        if (skus.length === 0) {
            throw new Error("At least one SKU is required for each product");
        }

        for (const sku of skus) {
            if (seenInPayload.has(sku)) {
                throw new Error(`Duplicate SKU "${sku}" found in bulk payload`);
            }
            seenInPayload.add(sku);
        }

        await assertSkusAreUnique(Product, skus);

        const brand = await Brand.findById(data.brandId);
        if (!brand) {
            throw new Error(`Brand not found for SKU(s) "${skus.join(", ")}"`);
        }

        const brandObj = { id: brand._id, name: brand.name };

        const product = await Product.create({
            name: data.name,
            skus,
            brand: brandObj,
            buyingCost: data.buyingCost,
            sellingCost: data.sellingCost,
            totalQuantity: data.totalQuantity
        });

        const productBatch = await ProductBatch.create({
            productId: product._id,
            name: data.name,
            brand: brandObj,
            buyingCost: data.buyingCost,
            sellingCost: data.sellingCost,
            totalQuantity: data.totalQuantity
        });

        createdProducts.push(product);
        createdBatches.push(productBatch);
    }

    return { products: createdProducts, productBatches: createdBatches };
}

async function searchProductsBySku({ pageNo, limit, search }) {
    const pageNumber = parseInt(pageNo) || 1;
    const pageLimit = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;

    let filter = {};

    if (search) {
        const escapedSearch = escapeRegex(search);
        // Match if any SKU in the array matches the regex
        filter.skus = {
            $regex: escapedSearch,
            $options: "i"
        };
    }

    const totalItems = await Product.countDocuments(filter);

    const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit);

    return {
        products,
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / pageLimit),
            currentPage: pageNumber,
            pageSize: pageLimit
        }
    };
}

async function searchProductsBySkuOrName({ pageNo, limit, search }) {
    const pageNumber = parseInt(pageNo) || 1;
    const pageLimit = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;

    let filter = {};

    if (search) {
        // Priority: 1) exact SKU → 2) brand name → 3) product name
        const normalizedSearch = String(search).trim().toUpperCase();
        const skuMatchFilter = { skus: normalizedSearch };

        const skuMatchCount = await Product.countDocuments(skuMatchFilter);

        if (skuMatchCount > 0) {
            filter = skuMatchFilter;
        } else {
            const escapedSearch = escapeRegex(String(search).trim());
            const brandMatchFilter = {
                "brand.name": {
                    $regex: escapedSearch,
                    $options: "i"
                }
            };

            const brandMatchCount = await Product.countDocuments(brandMatchFilter);

            if (brandMatchCount > 0) {
                filter = brandMatchFilter;
            } else {
                filter.name = {
                    $regex: escapedSearch,
                    $options: "i"
                };
            }
        }
    }

    const totalItems = await Product.countDocuments(filter);

    const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit);

    return {
        products,
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / pageLimit),
            currentPage: pageNumber,
            pageSize: pageLimit
        }
    };
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
