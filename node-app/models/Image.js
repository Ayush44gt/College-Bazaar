const mongoose = require('mongoose');

// uploaded images live in MongoDB, nothing is written to disk
module.exports = mongoose.model('Images', {
    data: Buffer,
    contentType: String
});
