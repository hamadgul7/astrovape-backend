/**
 * Normalize incoming SKU payload into a unique, trimmed, uppercased array.
 * Accepts: skus (array|string) or sku (string|array) for backward compatibility.
 */
function normalizeSkus(data) {
    let raw = [];

    if (data.skus !== undefined && data.skus !== null) {
        raw = Array.isArray(data.skus) ? data.skus : [data.skus];
    } else if (data.sku !== undefined && data.sku !== null) {
        raw = Array.isArray(data.sku) ? data.sku : [data.sku];
    }

    const normalized = raw
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean);

    return [...new Set(normalized)];
}

/**
 * Ensure none of the given SKUs already exist on another product.
 * @param {string[]} skus
 * @param {string|null} excludeProductId - product id to exclude (for updates)
 */
async function assertSkusAreUnique(Product, skus, excludeProductId = null) {
    if (!skus || skus.length === 0) {
        throw new Error("At least one SKU is required");
    }

    const query = { skus: { $in: skus } };
    if (excludeProductId) {
        query._id = { $ne: excludeProductId };
    }

    const existing = await Product.findOne(query).select("skus name");
    if (existing) {
        const conflict = existing.skus.find((s) => skus.includes(s));
        throw new Error(
            `SKU "${conflict || skus[0]}" already exists. Please use a unique SKU.`
        );
    }
}

module.exports = {
    normalizeSkus,
    assertSkusAreUnique
};
