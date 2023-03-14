const express = require('express');
const router = express.Router();

const { createShortUrl, getUrl } = require('../controllers/urlController');

router.post('/url/shorten', createShortUrl);
router.get('/:urlCode', getUrl);

router.all('/*', function (req, res) {
    res.status(404).send({ status: false, message: 'Error 404! page not found' });
});

module.exports = router;