const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoice-controller");
const verifyToken = require('../middlewares/verifyToken');

router.post("/createInvoice", invoiceController.createInvoice);
router.post("/createBulkInvoices", invoiceController.createBulkInvoices);
router.get("/getAllInvoices", verifyToken, invoiceController.getAllInvoices);

module.exports = router;