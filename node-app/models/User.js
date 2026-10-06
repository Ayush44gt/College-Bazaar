const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    mobile: String,
    email: { type: String, trim: true, lowercase: true },
    college: { type: String, trim: true },
    password: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    likedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Products' }]
}, { timestamps: true });

module.exports = mongoose.model('Users', schema);
