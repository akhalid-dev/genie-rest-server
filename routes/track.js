const express = require('express');
const router = express.Router();
const priceController = require('../controllers/track');

router.get('/price', priceController.getPrice);


module.exports = router;