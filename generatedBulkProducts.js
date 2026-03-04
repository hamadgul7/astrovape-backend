const fs = require("fs");

// Example Brand IDs
const brands = [
    "69a1c7c8e400bec771a6aaf5",
    "69a1c71ce400bec771a6aaf2",
    "69a44958021196f76b031ab4"
];

const products = [];

for (let i = 1; i <= 1000; i++) {
    const name = `Vape Product ${i}`;
    const sku = `VAPE-PROD-${i.toString().padStart(4, "0")}`;
    const brandId = brands[Math.floor(Math.random() * brands.length)];

    const sellingCost = Math.floor(Math.random() * (10000 - 2000 + 1)) + 2000; // 2000–10000
    const buyingCost = sellingCost - (Math.floor(Math.random() * 800) + 200);   // 200–1000 less than sellingCost

    const totalQuantity = Math.floor(Math.random() * (50 - 30 + 1)) + 30; // 30–50

    products.push({
        name,
        sku,
        brandId,
        buyingCost,
        sellingCost,
        totalQuantity
    });
}

// Write to JSON file
fs.writeFileSync("bulkProducts.json", JSON.stringify(products, null, 2));

console.log("1000 dummy products generated in bulkProducts.json");