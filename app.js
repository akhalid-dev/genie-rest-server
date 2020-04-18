const express = require('express');
const port = process.env.PORT || 8080;

const priceRoutes = require('./routes/track');

const app = express();

app.use('/item', priceRoutes);


app.listen(port);