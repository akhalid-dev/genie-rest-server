const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const sanitize_html = require('sanitize-html');
const user_agents = require(path.join('..', 'user-agents'));
const fs = require('fs');

const scrape = async (link) => {
    return new Promise((resolve,reject) => {
        http_request = request.defaults({
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;',
                'Accept-Encoding': 'gzip',
                'User-Agent': user_agents.get_agent()
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
                    const amazon_listing = {};
                    amazon_listing.asin = getAsin($);
                    amazon_listing.title = getTitle($);
                    amazon_listing.inStock = inStock($);
    
                    if(amazon_listing.inStock) {
                        amazon_listing.availability = getAvailability($);
                        amazon_listing.price = getPrice($, amazon_listing.asin, html);
                        amazon_listing.merchant = getMerchant($);
                        amazon_listing.prime = isPrime($, amazon_listing.merchant);
                        amazon_listing.applyTax = isTaxApplicable($);
                        amazon_listing.isAddon = isAddon($);
                        amazon_listing.featured_points = getFeaturedBullets($);
                        amazon_listing.from_manufacturer = getFromManufacturer($);
                        getProdDetail($, (details) => {
                            amazon_listing.prod_details = details;
                        });
                        getProdDescription($, (description) => {
                            amazon_listing.prod_description = description;
                        });
                        amazon_listing.images = getGraphics(html, amazon_listing.asin);
                    
                    }
                    checkforsuccess(amazon_listing);
                    
                    resolve(amazon_listing);
                } catch (err) {
                    reject(link);
                    console.log('The following url encountered an error while scraping: ' + link);
                }
                    
            } else {
                console.log(error);
            }
        }); 
    });
}
module.exports.scrape = scrape;
const getGraphics = (html, asin) => {
    const jsonData = JSON.parse(getSpecificString(html, "var obj = jQuery.parseJSON('", "');"));
    const variationSelected = getVariationName(jsonData, asin);
    if(variationSelected != null) {
        //console.log(getImagesFromVariation(jsonData, variationSelected))
        return getImagesFromVariation(jsonData, variationSelected);
    } else {
        //console.log( getImages(html))
        return getImages(html);
    }
}

const getAsin = ($) => {
    return $("#ASIN").val();
} 

const getTitle = ($) => {
    return $("#productTitle").text().trim();
}

const inStock = ($) => {
    if($('#outOfStock').length != 0) {
        return false;
    }
    return true;
}

const getAvailability = ($) => {
    return $("#availability").text().trim();
}

const getPrice = ($, asin, html) => {
    let price = $("#price_inside_buybox").text().trim();
    
    if (price == '') {
        price = $('#newBuyBoxPrice').text().trim();
    }

    if (price == '') {
        price = $('#priceblock_ourprice').text().trim();
    }
 
    return price;
}

const isPrime = ($, merchant) => {
    let prime = false;
    if(merchant.toLowerCase().includes('ships from and sold by amazon.ca') || merchant.toLowerCase().includes('fulfilled by amazon')) {
        return true;
    }
    
    //Add a better prime mechanisim.
    return prime;
}

const getMerchant = ($) => {
    return $("#merchant-info").text().trim();
}
const isTaxApplicable = ($) => {
    const merchant = $("#merchant-info");
    return merchant.find("a").length === 0 ? true: false;
}

const isAddon = ($) => {
    if($("#addon").length != 0) {
        return true;
    } 
    return false;
}

const getFeaturedBullets = ($) => {
    const featured_points = [];
    $("#feature-bullets ul").children().each((index, element) => {
        featured_points.push($(element).text().trim());
    }); 
    if(!featured_points) featured_points = '';
    
    return featured_points;
}

const getFromManufacturer = ($) => {
    const dirty_html = $('#aplus').html();

    fs.writeFileSync('dirty.html', dirty_html);
    const settings = { 
        allowedTags: [ 'h1','h2','h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe', 'img' ],
        allowedAttributes: {
        a: [ 'name' ],
        img: [ 'src' ]
      }
    }

    //Add check for description pictures for Haram content.
    //Maybe replace image src with uploaded image.
    const sanitized_html = sanitize_html(dirty_html, settings);
    if(!sanitized_html) sanitized_html = '';

    return sanitized_html;
}

const getProdDescription = ($, cb) => {
    let san_html = sanitize_html($('#productDescription_feature_div').html());
    $_new = cheerio.load(san_html);
    let lines = $_new.text().split('\n');
    const usefulLines = [];
    lines.forEach((value, index, array) => {
        if(value.trim() != '') {
            usefulLines.push(value);
        } 
    });
    if(!usefulLines) usefulLines = '';
    cb(usefulLines);

}

const getProdDetail = ($, cb) => {
    $('#detail_bullets_id table tbody tr td' ).each((index, element) => {
        
        let data = $(element).text().trim().replace(/[\r\n]+/g, '\n');
        let lines = data.split('\n');
        
        const useFulldata = [];
        try {
            lines.forEach((value, index, array) => {
                if(value.trim() != '') {
                
                    if(value.toLowerCase().includes('amazon') || value.toLowerCase().includes('asin')){
                        throw "Uh-oh, we read something linked with Amazon.";
                    }

                    if(value.toLowerCase().includes('customer review')){
                        throw "We don't care about amazon reviews.";
                    }
                useFulldata.push(value);  
                }
                
            });
        } catch(err) {
            cb(useFulldata);
        }
        if(!useFulldata) useFulldata = '';
    cb(useFulldata);
    });
}



const getSpecificString = (html, startText, endText) => {
    let from = html.indexOf(startText);
    let to = html.indexOf(endText, from);
    return html.substring(from + startText.length, to);
}

const getImages = (html) => {
    return getImageLinks(html, '"hiRes":"https://images-na');
}

const getImageLinks = (text, imageBaseUrl) => {
    var init = 0;
    var extension = '.jpg';
    var images = [];

    while (text.indexOf(imageBaseUrl, init) > -1) {
        var from = text.indexOf(imageBaseUrl, init) + 9;
        var to = text.indexOf(extension, from) + extension.length;
        var imgUrl = text.substring(from, to);
        if (images.indexOf(imgUrl) === -1) {
            images.push(imgUrl);
        }
        init = to + 1;
    }
    
    return images;
}


const getVariationName = (data, asin) => {
    if (data != null && data["colorToAsin"] != null) {
        var names = Object.keys(data["colorToAsin"]);
        var idx = 0;
        for (var variation in data["colorToAsin"]) {
            if (data["colorToAsin"].hasOwnProperty(variation)) {
                if (data.colorToAsin[Object.keys(data.colorToAsin)[idx]].asin == asin) {
                    return names[idx];
                }
                idx += 1;
            }
        }
    } else {
        return null;
    }
}

const getImagesFromVariation = (data, variationName) => {
    var images = [];
    if (data["colorImages"] != null) {
        var variationImages = data["colorImages"][variationName];
        if (variationImages != null) {
            for (var i = 0; i < variationImages.length; i++) {
                if (variationImages[i]["hiRes"] != null) {
                    images.push(variationImages[i]["hiRes"]);
                } else if (variationImages[i]["large"] != null) {
                    images.push(variationImages[i]["large"]);
                }
            }
        }
    }
    return images;
}

const checkforsuccess = (listing) => {
    listing.foundList = {}
    listing.foundList.asin = (!listing.asin) ? false : true;
    listing.foundList.title = (!listing.title) ? false : true;
    listing.foundList.inStock = (!listing.inStock) ? false : true;
    listing.foundList.availability = (!listing.availability) ? false : true;
    listing.foundList.price = (!listing.price) ? false : true;
    listing.foundList.merchant = (!listing.merchant) ? false : true;
    listing.foundList.prime = (!listing.prime) ? false : true;
    listing.foundList.applyTax = (!listing.applyTax) ? false : true;
    listing.foundList.isAddon = (!listing.isAddon) ? false : true;
    listing.foundList.featured_points = (!listing.featured_points) ? false : true;
    listing.foundList.from_manufacturer = (!listing.from_manufacturer) ? false : true;
    listing.foundList.prod_details = (!listing.prod_details) ? false : true;
    listing.foundList.prod_description = (!listing.prod_description) ? false : true;
    listing.foundList.images = (!listing.images) ? false : true;
}
