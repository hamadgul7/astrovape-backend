const invoiceService = require("../services/invoice-service");

async function createInvoice(req, res) {
    try {
        const invoice = await invoiceService.createInvoice(req.body);

        return res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            data: invoice,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

async function createBulkInvoices(req, res) {
    try {
        const invoicesData = req.body.invoices; // Expect { invoices: [ {items, subTotal, ...}, ... ] }

        const result = await invoiceService.createBulkInvoices(invoicesData);

        return res.status(201).json(result);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

module.exports = {
    createInvoice,
    createBulkInvoices
};