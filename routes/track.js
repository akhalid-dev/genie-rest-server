const express = require('express');
const router = express.Router();
const priceController = require('../controllers/track');

//POST /item/tracking
router.post('/tracking', priceController.postItems);


module.exports = router;