const request = require('request');
const cheerio = require('cheerio');
const userAgents = require('./user-agents');

const getAffiliatePrice = link => {
    return new Promise((resolve, reject) => {
        http_request = request.defaults({
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;',
                'User-Agent': userAgents.get_agent()
            }
        });

        http_request.get({
            url: link
        }, (error, response, html) => {
            if (!error) {
                try {
                    const $ = cheerio.load(html);
                    const price = $('.price').text()
                    resolve(price);
                    
                    
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

module.exports.getAffiliatePrice = getAffiliatePrice;