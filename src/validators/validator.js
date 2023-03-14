const validUrl = require('valid-url');
const isWebUri = validUrl.isWebUri;

module.exports = { isWebUri };