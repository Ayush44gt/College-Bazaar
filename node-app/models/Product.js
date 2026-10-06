const mongoose = require('mongoose');
const { CATEGORIES, CONDITIONS } = require('../constants');

const schema = new mongoose.Schema({
    pname: { type: String, required: true, trim: true },
    pdesc: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: CATEGORIES, required: true },
    condition: { type: String, enum: CONDITIONS, default: 'Good' },
    status: { type: String, enum: ['available', 'sold'], default: 'available' },
    pimage: String,
    pimage2: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    city: String,
    pLoc: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        // GeoJSON order is [longitude, latitude]
        coordinates: {
            type: [Number]
        }
    }
}, { timestamps: true });

schema.index({ pLoc: '2dsphere' });
schema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Products', schema);
