const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const Users = require('../models/User');
const Products = require('../models/Product');
const handle = require('../middleware/handle');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{10}$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

const publicUser = (user) => ({
    _id: user._id,
    username: user.username,
    college: user.college,
    createdAt: user.createdAt
})

const privateUser = (user) => ({
    ...publicUser(user),
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    status: user.status
})

// returns an error message, or null when the contact details are fine
const checkContact = ({ email, mobile, college }) => {
    if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
    if (!MOBILE_RE.test(mobile)) return 'Enter a 10-digit mobile number.';
    if (college.length < 2 || college.length > 80) return 'Enter your college name.';
    return null;
}

module.exports.signup = handle(async (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    const email = String(req.body.email || '').trim().toLowerCase();
    const mobile = String(req.body.mobile || '').trim();
    const college = String(req.body.college || '').trim();

    if (!USERNAME_RE.test(username)) {
        return res.status(400).send({ message: 'Username must be 3-20 letters, numbers or underscores.' })
    }
    if (password.length < 6) {
        return res.status(400).send({ message: 'Password must be at least 6 characters.' })
    }
    const problem = checkContact({ email, mobile, college });
    if (problem) {
        return res.status(400).send({ message: problem })
    }

    // usernames are matched without case so "Ravi" and "ravi" cannot both exist
    const taken = await Users.findOne({ username: new RegExp('^' + username + '$', 'i') });
    if (taken) {
        return res.status(400).send({ message: 'That username is already taken.' })
    }
    if (await Users.findOne({ email })) {
        return res.status(400).send({ message: 'An account with that email already exists.' })
    }

    const hash = await bcrypt.hash(password, 10);
    await new Users({ username, password: hash, email, mobile, college }).save();
    res.send({ message: 'Account created. You can log in now.' })
})

module.exports.login = handle(async (req, res) => {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    const user = await Users.findOne({ username: username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).send({ message: 'Wrong username or password.' })
    }
    if (user.status === 'blocked') {
        return res.status(403).send({ message: 'This account has been blocked. Contact the admin.' })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.send({
        message: 'Logged in.', token: token, userId: user._id,
        username: user.username, role: user.role
    })
})

module.exports.myProfile = handle(async (req, res) => {
    const user = await Users.findById(req.userId);
    const [listings, sold] = await Promise.all([
        Products.countDocuments({ addedBy: req.userId }),
        Products.countDocuments({ addedBy: req.userId, status: 'sold' })
    ]);
    res.send({
        user: privateUser(user),
        stats: { listings, sold, saved: user.likedProducts.length }
    })
})

module.exports.updateProfile = handle(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const mobile = String(req.body.mobile || '').trim();
    const college = String(req.body.college || '').trim();

    const problem = checkContact({ email, mobile, college });
    if (problem) {
        return res.status(400).send({ message: problem })
    }
    if (await Users.findOne({ email, _id: { $ne: req.userId } })) {
        return res.status(400).send({ message: 'Another account already uses that email.' })
    }

    const user = await Users.findByIdAndUpdate(req.userId, { email, mobile, college }, { new: true });
    res.send({ message: 'Profile updated.', user: privateUser(user) })
})

module.exports.changePassword = handle(async (req, res) => {
    const current = String(req.body.currentPassword || '');
    const next = String(req.body.newPassword || '');

    if (next.length < 6) {
        return res.status(400).send({ message: 'New password must be at least 6 characters.' })
    }
    const user = await Users.findById(req.userId);
    if (!(await bcrypt.compare(current, user.password))) {
        return res.status(400).send({ message: 'Current password is wrong.' })
    }
    user.password = await bcrypt.hash(next, 10);
    await user.save();
    res.send({ message: 'Password changed.' })
})

// public: who a seller is, without their contact details
module.exports.getUserById = handle(async (req, res) => {
    const user = await Users.findById(req.params.uId);
    if (!user || user.status === 'blocked') {
        return res.status(404).send({ message: 'User not found.' })
    }
    res.send({ user: publicUser(user) })
})

// logged-in users only: phone and email of a seller
module.exports.sellerContact = handle(async (req, res) => {
    const user = await Users.findById(req.params.uId);
    if (!user || user.status === 'blocked') {
        return res.status(404).send({ message: 'User not found.' })
    }
    res.send({ contact: { username: user.username, email: user.email, mobile: user.mobile } })
})

module.exports.likeProducts = handle(async (req, res) => {
    const product = await Products.findById(req.body.productId).select('_id');
    if (!product) {
        return res.status(404).send({ message: 'This listing no longer exists.' })
    }
    await Users.updateOne({ _id: req.userId }, { $addToSet: { likedProducts: product._id } });
    res.send({ message: 'Saved.' })
})

module.exports.unlikeProducts = handle(async (req, res) => {
    await Users.updateOne({ _id: req.userId }, { $pull: { likedProducts: req.body.productId } });
    res.send({ message: 'Removed from saved.' })
})

module.exports.likedProducts = handle(async (req, res) => {
    const user = await Users.findById(req.userId).populate('likedProducts');
    // newest saves first
    res.send({ products: user.likedProducts.reverse() })
})

module.exports.likedIds = handle(async (req, res) => {
    const user = await Users.findById(req.userId).select('likedProducts');
    res.send({ ids: user.likedProducts })
})


// ---- admin ----

module.exports.adminStats = handle(async (req, res) => {
    const [users, blocked, listings, sold, byCategory, saves] = await Promise.all([
        Users.countDocuments({}),
        Users.countDocuments({ status: 'blocked' }),
        Products.countDocuments({}),
        Products.countDocuments({ status: 'sold' }),
        Products.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),
        Users.aggregate([
            { $project: { n: { $size: '$likedProducts' } } },
            { $group: { _id: null, total: { $sum: '$n' } } }
        ])
    ]);
    res.send({
        stats: {
            users, blocked, listings, sold,
            available: listings - sold,
            saves: saves.length ? saves[0].total : 0,
            byCategory: byCategory.map((c) => ({ category: c._id, count: c.count }))
        }
    })
})

module.exports.adminUsers = handle(async (req, res) => {
    const [users, counts] = await Promise.all([
        Users.find({}).select('-password').sort({ createdAt: -1 }),
        Products.aggregate([{ $group: { _id: '$addedBy', count: { $sum: 1 } } }])
    ]);
    const listingCount = {};
    counts.forEach((c) => { listingCount[String(c._id)] = c.count });

    res.send({
        users: users.map((u) => ({
            ...privateUser(u),
            listings: listingCount[String(u._id)] || 0
        }))
    })
})

module.exports.adminUserStatus = handle(async (req, res) => {
    const status = req.body.status;
    if (!['active', 'blocked'].includes(status)) {
        return res.status(400).send({ message: 'Unknown status.' })
    }
    const user = await Users.findById(req.params.uId);
    if (!user) {
        return res.status(404).send({ message: 'User not found.' })
    }
    if (user.role === 'admin') {
        return res.status(400).send({ message: 'Admin accounts cannot be blocked.' })
    }
    user.status = status;
    await user.save();
    res.send({ message: status === 'blocked' ? 'User blocked.' : 'User unblocked.' })
})
