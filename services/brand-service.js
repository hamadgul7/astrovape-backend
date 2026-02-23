const Brand = require("../models/brand-model");


async function createBrand(data) {
    const count = await Brand.countDocuments();

    const brand = new Brand(data);
    return await brand.save();
}


async function getAllBrands(page, limit) {
    const skip = (page - 1) * limit;

    const brands = await Brand.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalBrands = await Brand.countDocuments();

    return {
        data: brands,
        totalBrands,
        page,
        limit,
        totalPages: Math.ceil(totalBrands / limit),
    };
}


async function getBrandById(id) {
    return await Brand.findById(id);
}


async function updateBrand(id, data) {
    return await Brand.findByIdAndUpdate(id, data, {
        returnDocument: 'after',
        runValidators: true
    });
}


async function deleteBrand(id) {
    return await Brand.findByIdAndDelete(id);
}

module.exports = {
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    deleteBrand
};