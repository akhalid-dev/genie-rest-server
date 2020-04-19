const amzparser = require('../auxiliary/amzparser');

exports.postItem = (req, res, next) => {
    const item = req.body.item;
    checkItem(item)
    .then(details => {
        res.json(details);
    })
    .catch(err => console.log(err));
}


const checkItem = item => {
    return new Promise((resolve) => {
        resolve(amzparser.track(item.sourceLink, item.asin));
    })
     
}