const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

router.get('/report', stockController.getStockReport);
router.get('/transactions', stockController.getStockTransactions);

module.exports = router;
