const express = require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 8080;

const priceRoutes = require('./routes/track');

const app = express();

app.use(bodyParser.json()); 

//Cross Origin Reference Sharing
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); //*: All domains.
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})

app.use('/item', priceRoutes);


app.listen(port);