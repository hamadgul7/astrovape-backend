const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoice-controller");
const verifyToken = require('../middlewares/verifyToken');

router.post("/createInvoice", invoiceController.createInvoice);
router.post("/createBulkInvoices", invoiceController.createBulkInvoices);
router.get("/getAllInvoices", verifyToken, invoiceController.getAllInvoices);
router.get("/getSingleInvoiceById/:id", verifyToken, invoiceController.getSingleInvoiceById);
router.patch("/updateInvoice/:id", verifyToken, invoiceController.updateInvoice);
router.delete("/deleteInvoice/:id", verifyToken, invoiceController.deleteInvoice);
router.get("/getInvoicesByDate", verifyToken, invoiceController.getInvoicesByDate);

module.exports = router;