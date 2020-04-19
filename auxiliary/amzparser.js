const request = require('request');
const cheerio = require('cheerio');
const afl = require('./amzaflparser');

const userAgents = require('./user-agents');

const track = (link, asin) => {
    return new Promise((resolve,reject) => {
        http_request = request.defaults({
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;',
                'Accept-Encoding': 'gzip',
                'User-Agent': userAgents.get_agent()
            }
        });

        http_request.get({
            url: link,
            gzip: true,
            jar: true
        }, (error, response, html) => {
            if (!error) {
                try {
                    const $ = cheerio.load(html);
                    
                    let inStock = false; 
                    let price;
                    
                    
                    if($('#availability').text().includes('In Stock')) { //Case where In Stock is Visible in Text. (Sold by Amazon)
                        inStock = true;
                        afl.getAffiliatePrice('https://ws-na.assoc-amazon.com/widgets/cm?t=feed-20&language=en_CA&o=15&l=as4&m=amazon&asins=' + asin)
                        .then(res => {
                            price = res;
                            resolve({inStock, price});
                        })
                    } else if($('#availability').text().includes('ships')) { //Case where (Sold and Shipped by Third Party) : Has text like: Usually ships within 2 to 3 days.
                        inStock = true;
                        afl.getAffiliatePrice('https://ws-na.assoc-amazon.com/widgets/cm?t=feed-20&language=en_CA&o=15&l=as4&m=amazon&asins=' + asin)
                        .then(res => {
                            price = res;
                            resolve({inStock, price});
                        })
                    } 
                    else {
                        resolve({inStock, price});
                    }

                } catch (err) {
                    reject(link);
                    console.log(err);
                    console.log('The following url encountered an error: ' + link);
                }
                    
            } else {
                console.log(error);
            }
        }); 
    });
}

module.exports.track = track;


