const ProductBatch = require("../models/productBatch-model");
const Product = require("../models/product-model");
const Brand = require("../models/brand-model");



const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


async function addProductBatch(data) {
    const product = await Product.findById(data.productId);
    if (!product) throw new Error("Product not found");

    const brand = await Brand.findById(data.brandId);
    if (!brand) throw new Error("Brand not found");
    const brandObj = { id: brand._id, name: brand.name };

    const productBatch = await ProductBatch.create({
        productId: product._id,
        name: data.name || product.name,
        brand: brandObj,
        buyingCost: data.buyingCost,
        sellingCost: data.sellingCost,
        totalQuantity: data.totalQuantity || 0
    });

    product.totalQuantity += data.totalQuantity || 0;

    if (data.buyingCost !== undefined) product.buyingCost = data.buyingCost;
    if (data.sellingCost !== undefined) product.sellingCost = data.sellingCost;

    await product.save();

    return productBatch;
}


async function getProductAllBatches({
    page = 1,
    limit = 10,
    productId = null,
    sku = null
}) {
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    let batchFilter = null;

    if (productId) {
        batchFilter = { productId };
    }

    else if (sku) {
        const escapedSku = escapeRegex(sku);

        const products = await Product.find({
            sku: { $regex: escapedSku, $options: "i" }
        }).select("_id");

        const productIds = products.map(p => p._id);

        if (productIds.length === 0) {
            return {
                batches: [],
                meta: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: page,
                    pageLimit: limit
                }
            };
        }

        batchFilter = {
            productId: { $in: productIds }
        };
    }

    else {
        return {
            batches: [],
            meta: {
                totalItems: 0,
                totalPages: 0,
                currentPage: page,
                pageLimit: limit
            }
        };
    }

    const totalItems = await ProductBatch.countDocuments(batchFilter);

    const batches = await ProductBatch.find(batchFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const batchesWithMonthYear = batches.map(batch => {
        const createdDate = new Date(batch.createdAt);

        return {
            ...batch.toObject(),
            monthYear: createdDate.toLocaleString("default", {
                month: "long",
                year: "numeric"
            })
        };
    });

    return {
        batches: batchesWithMonthYear,
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            pageLimit: limit,
            nextPage: page < Math.ceil(totalItems / limit) ? page + 1 : null,
            previousPage: page > 1 ? page - 1 : null
        }
    };
}


async function getProductBatchById(id) {
    return ProductBatch
        .findById(id)
}


async function updateProductBatch(id, data) {
    const batch = await ProductBatch.findById(id);
    if (!batch) throw new Error("Product batch not found");

    if (data.brandId) {
        const brand = await Brand.findById(data.brandId);
        if (!brand) throw new Error("Brand not found");
        batch.brand = { id: brand._id, name: brand.name };
    }

    if (data.name !== undefined) batch.name = data.name;
    if (data.buyingCost !== undefined) batch.buyingCost = data.buyingCost;
    if (data.sellingCost !== undefined) batch.sellingCost = data.sellingCost;

    if (data.totalQuantity !== undefined) {
        batch.totalQuantity += data.totalQuantity;
        const product = await Product.findById(batch.productId);
        if (product) {
            product.totalQuantity += data.totalQuantity;
            await product.save();
        }
    }

    await batch.save();
    return batch;
}


async function deleteProductBatch(id) {
    const batch = await ProductBatch.findByIdAndDelete(id);
    if (!batch) throw new Error("Product batch not found");

    // Reduce total quantity in Product
    // const product = await Product.findById(batch.productId);
    // if (product) {
    //     product.totalQuantity -= batch.totalQuantity;
    //     if (product.totalQuantity < 0) product.totalQuantity = 0;
    //     await product.save();
    // }

    return batch;
}


// Search batches
// const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// async function searchProductBatches({ pageNo, limit, search }) {
//     const page = parseInt(pageNo) || 1;
//     const pageLimit = parseInt(limit) || 10;
//     const skip = (page - 1) * pageLimit;

//     let filter = {};
//     if (search) {
//         const escapedSearch = escapeRegex(search);
//         filter.name = { $regex: escapedSearch, $options: "i" };
//     }

//     const totalItems = await ProductBatch.countDocuments(filter);

//     const batches = await ProductBatch.find(filter)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(pageLimit);

//     return {
//         batches,
//         meta: {
//             totalItems,
//             totalPages: Math.ceil(totalItems / pageLimit),
//             currentPage: page,
//             pageLimit
//         }
//     };
// }

async function searchProductBatchBySku({ pageNo, limit, search }) {

    const pageNumber = parseInt(pageNo) || 1;
    const pageLimit = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;

    let productFilter = {};

    if (search) {
        const escapedSearch = escapeRegex(search);

        productFilter.sku = {
            $regex: escapedSearch,
            $options: "i"
        };
    }

    const products = await Product.find(productFilter).select("_id");

    const productIds = products.map(product => product._id);

    let batchFilter = {};

    if (productIds.length > 0) {
        batchFilter.productId = { $in: productIds };
    } else {
        batchFilter.productId = null;
    }

    const totalItems = await ProductBatch.countDocuments(batchFilter);

    const batches = await ProductBatch.find(batchFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit);

    return {
        batches,
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / pageLimit),
            currentPage: pageNumber,
            pageSize: pageLimit
        }
    };
}




module.exports = {
    addProductBatch,
    getProductAllBatches,
    getProductBatchById,
    updateProductBatch,
    deleteProductBatch,
    searchProductBatchBySku
    // searchProductBatches
};