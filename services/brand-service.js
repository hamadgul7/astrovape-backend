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


const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

async function searchBrands({ pageNo, limit, search }) {
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