const express = require('express');
const router = express.Router();
const details = require('../controllers/track');

//POST /item/track
router.post('/track', details.postItem);


module.exports = router;