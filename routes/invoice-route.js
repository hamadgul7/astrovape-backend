const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoice-controller");

router.post("/createInvoice", invoiceController.createInvoice);
router.post("/createBulkInvoices", invoiceController.createBulkInvoices);

module.exports = router;