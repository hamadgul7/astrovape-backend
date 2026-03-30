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
        const invoicesData = req.body.invoices; 

        const result = await invoiceService.createBulkInvoices(invoicesData);

        return res.status(201).json(result);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

async function getAllInvoices(req, res) {
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        const result = await invoiceService.getAllInvoices({
            page,
            limit,
            startDate,
            endDate,
        });

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

async function getSingleInvoiceById(req, res) {
    try {
        const invoice = await invoiceService.getSingleInvoiceById(req.params.id);

        return res.status(200).json({
            returnDocument: 'after',
            data: invoice,
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
}


async function updateInvoice(req, res) {
    try {
        const invoice = await invoiceService.updateInvoice(
            req.params.id,
            req.body
        );

        return res.status(200).json({
            returnDocument: 'after',
            message: "Invoice updated successfully",
            data: invoice,
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
}


async function deleteInvoice(req, res) {
    try {
        await invoiceService.deleteInvoice(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Invoice deleted successfully",
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
}


module.exports = {
    createInvoice,
    createBulkInvoices,
    getAllInvoices,
    getSingleInvoiceById,
    updateInvoice,
    deleteInvoice
};