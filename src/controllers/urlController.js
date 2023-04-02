const urlModel = require('../models/urlMode');
const { isWebUri } = require('../validators/validator');
const shortId = require('shortid')
const { createClient } = require('redis');
const { promisify } = require('util');

//
const client = createClient({
    password: 'TCgFRBVdKNCOp76ZutXVAsTlDwa5s4HQ',
    socket: {
        host: 'redis-14670.c301.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 14670
    }
});

// redis client to store data in chache and to retrive data from cache
// const client = redis.createClient(
//     14670,                                                    // port-number
//     "redis-14670.c301.ap-south-1-1.ec2.cloud.redislabs.com",  //host name and url of redis
//     { no_ready_check: true }
// );

// client.auth("ysDNRyfBElfft4UKeapXaAF1fAJmTujy", function (err) {
//     if (err) throw err; // it authenticate the client
// });
//on is the listener when we event is listen then it print in console
client.on("connect", async function () {
    console.log("Successfully conected to redis");
});
const SET_ASYNC = promisify(client.SETEX).bind(client);
const GET_ASYNC = promisify(client.GET).bind(client);

// 
// route handler to create sort url
const createShortUrl = async function (req, res) {
    try {
        const data = req.body;
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: 'please provide url' });
        const { longUrl } = data;
        if (!longUrl) return res.status(400).send({ status: false, message: 'please provide url' });
        if (!isWebUri(longUrl)) return res.status(400).send({ status: false, message: 'please enter a valid url' });

        // checking url in chache 
        const cacheData = await GET_ASYNC(`${longUrl}`);
        const obj = JSON.parse(cacheData);
        if (obj) return res.status(201).send({ data: obj });

        // generating short url code 
        const urlCode = shortId.generate(longUrl).toLowerCase();
        const shortUrl = `http://localhost:3001/${urlCode}`;
        data.urlCode = urlCode;
        data.shortUrl = shortUrl;

        // creating short url on db 
        const urlCreated = await urlModel.create(data);
        const response = { longUrl, shortUrl, urlCode };

        // storing data in chache before sending response
        await SET_ASYNC(`${urlCode}`, 24 * 3600, JSON.stringify(response));

        res.status(201).send({ data: response });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    };
};

//
// route handler to redirecting to long url using sort url
const getUrl = async function (req, res) {
    try {
        const urlCode = req.params.urlCode;
        if (!shortId.isValid(urlCode)) return res.status(400).send({ status: false, message: 'please enter a valid url code' });

        // checking url code in cache 
        const cacheData = await GET_ASYNC(`${urlCode}`);
        const obj = JSON.parse(cacheData);
        if (obj) return res.status(302).redirect(obj.longUrl);

        // checking url code on db 
        const urlOnDb = await urlModel.findOne({ urlCode: urlCode }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 });
        if (!urlOnDb) return res.status(404).send({ status: false, message: 'url not found' });

        // storing data in cache before sending response 
        await SET_ASYNC(`${urlCode}`, 24 * 3600, JSON.stringify(urlOnDb));

        res.status(302).redirect(urlOnDb.longUrl);
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    };
};
module.exports = { createShortUrl, getUrl };