const brandService = require("../services/brand-service");

async function addBrand(req, res) {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Brand name is required" });
        }

        const brand = await brandService.createBrand({ name });

        res.status(201).json({
            message: "Brand created successfully",
            data: brand
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


async function getAllBrands(req, res) {
    try {
        const page = parseInt(req.query.pageNo) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await brandService.getAllBrands(page, limit);

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


async function getBrand(req, res) {
    try {
        const brand = await brandService.getBrandById(req.params.id);

        if (!brand) {
            return res.status(404).json({ message: "Brand not found" });
        }

        res.status(200).json({ data: brand });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


async function updateBrand(req, res) {
    try {
        const brand = await brandService.updateBrand(req.params.id, req.body);

        if (!brand) {
            return res.status(404).json({ message: "Brand not found" });
        }

        res.status(200).json({
            message: "Brand updated successfully",
            data: brand
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


async function deleteBrand(req, res) {
    try {
        const brand = await brandService.deleteBrand(req.params.id);

        if (!brand) {
            return res.status(404).json({ message: "Brand not found" });
        }

        res.status(200).json({
            message: "Brand deleted successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


async function searchBrands(req, res) {
    try {
        const { pageNo, limit, search } = req.query;

        const result = await brandService.searchBrands({
            pageNo,
            limit,
            search
        });

        return res.status(200).json({
            success: true,
            message: "Brands retrieved successfully",
            data: result.brands,
            meta: result.meta
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching brands",
            error: error.message
        });
    }
}

module.exports = {
    addBrand,
    getAllBrands,
    getBrand,
    updateBrand,
    deleteBrand,
    searchBrands
};