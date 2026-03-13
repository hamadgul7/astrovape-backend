const Brand = require("../models/brand-model");
const Product = require("../models/product-model");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Create Brand with image
async function createBrand(data, file) {
    const uploadedImage = await cloudinary.uploader.upload(file.path);
    data.imagePath = uploadedImage.secure_url;

    const brand = new Brand(data);
    return await brand.save();
}


// Update Brand with optional image
async function updateBrand(id, data, file) {
    if (file) {
        const uploadedImage = await cloudinary.uploader.upload(file.path);
        data.imagePath = uploadedImage.secure_url;
    }

    return await Brand.findByIdAndUpdate(id, data, {
        returnDocument: "after",
        runValidators: true
    });
}


async function getAllBrands(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const brands = await Brand.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const brandsWithProductCount = await Promise.all(
        brands.map(async (brand) => {
            const totalProducts = await Product.countDocuments({ "brand.id": brand._id });
            return {
                _id: brand._id,
                name: brand.name,
                imagePath: brand.imagePath || null, // include image
                createdAt: brand.createdAt,
                updatedAt: brand.updatedAt,
                totalProducts
            };
        })
    );

    const total = await Brand.countDocuments();

    return {
        data: brandsWithProductCount,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

async function getBrandById(id) {
    return await Brand.findById(id);
}

async function deleteBrand(id) {
    return await Brand.findByIdAndDelete(id);
}

// Search brands
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function searchBrands({ pageNo, limit, search }) {
    const pageNumber = parseInt(pageNo) || 1;
    const pageLimit = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;

    let filter = {};
    if (search) {
        const escapedSearch = escapeRegex(search);
        filter.name = { $regex: escapedSearch, $options: "i" };
    }

    const totalItems = await Brand.countDocuments(filter);

    const brands = await Brand.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit);

    return {
        brands,
        meta: {
            totalItems,
            totalPages: Math.ceil(totalItems / pageLimit),
            currentPage: pageNumber,
            pageSize: pageLimit
        }
    };
}

module.exports = {
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
    searchBrands
};