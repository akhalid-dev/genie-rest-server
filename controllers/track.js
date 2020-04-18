exports.getPrice = (req, res, next) => {
    res.status(200).json({
        item: {
            number: 123456,
            price: '59.99',
            inStock: true
        }
    });
}