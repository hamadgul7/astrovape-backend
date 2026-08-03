/**
 * One-time migration: convert Product.sku (string) → Product.skus (array).
 *
 * Usage: node scripts/migrate-sku-to-skus.js
 *
 * Safe to re-run: products that already have `skus` are skipped for conversion.
 */
require("dotenv").config();
const mongoose = require("mongoose");

async function migrate() {
    await mongoose.connect(
        `mongodb+srv://${encodeURIComponent(process.env.MONGO_USER)}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
    );

    const db = mongoose.connection.db;
    const products = db.collection("products");

    console.log("Connected. Migrating sku → skus...");

    const cursor = products.find({
        sku: { $exists: true },
        $or: [
            { skus: { $exists: false } },
            { skus: { $size: 0 } },
            { skus: null }
        ]
    });

    let migrated = 0;
    let skipped = 0;

    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        const skuValue = typeof doc.sku === "string" ? doc.sku.trim().toUpperCase() : null;

        if (!skuValue) {
            skipped += 1;
            continue;
        }

        await products.updateOne(
            { _id: doc._id },
            {
                $set: { skus: [skuValue] },
                $unset: { sku: "" }
            }
        );
        migrated += 1;
    }

    // Also unset leftover `sku` on docs that already have skus
    const unsetResult = await products.updateMany(
        { sku: { $exists: true }, skus: { $exists: true, $ne: [] } },
        { $unset: { sku: "" } }
    );

    // Drop old unique index on sku if present
    try {
        const indexes = await products.indexes();
        const skuIndex = indexes.find(
            (idx) => idx.key && idx.key.sku === 1
        );
        if (skuIndex) {
            await products.dropIndex(skuIndex.name);
            console.log(`Dropped old index: ${skuIndex.name}`);
        }
    } catch (err) {
        console.warn("Could not drop old sku index (may not exist):", err.message);
    }

    // Ensure unique index on skus
    try {
        await products.createIndex({ skus: 1 }, { unique: true });
        console.log("Ensured unique index on skus");
    } catch (err) {
        console.warn("Could not create skus index:", err.message);
    }

    console.log(`Done. Migrated: ${migrated}, skipped: ${skipped}, leftover sku unset: ${unsetResult.modifiedCount}`);
    await mongoose.disconnect();
}

migrate().catch(async (err) => {
    console.error("Migration failed:", err);
    try {
        await mongoose.disconnect();
    } catch (_) {
        // ignore
    }
    process.exit(1);
});
