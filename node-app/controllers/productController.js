const Products = require('../models/Product');
const Images = require('../models/Image');
const Users = require('../models/User');
const handle = require('../middleware/handle');
const { CATEGORIES, CONDITIONS, CITIES, SEARCH_RADIUS_KM } = require('../constants');

const EARTH_RADIUS_KM = 6378.1;
const SELLER_FIELDS = 'username college createdAt';

const saveImage = (file) => {
    const image = new Images({ data: file.buffer, contentType: file.mimetype });
    return image.save().then((saved) => 'image/' + saved._id)
}

const deleteImages = (paths) => {
    const ids = paths.filter(Boolean).map((p) => p.split('/')[1]);
    return Images.deleteMany({ _id: { $in: ids } })
}

// reads and checks the listing fields; returns { error } or { fields }
const readFields = (body) => {
    const pname = String(body.pname || '').trim();
    const pdesc = String(body.pdesc || '').trim();
    const price = Number(body.price);
    const category = body.category;
    const condition = body.condition || 'Good';
    const city = body.city;

    if (pname.length < 3 || pname.length > 80) {
        return { error: 'Title must be between 3 and 80 characters.' }
    }
    if (pdesc.length > 1000) {
        return { error: 'Description can be at most 1000 characters.' }
    }
    if (body.price === '' || body.price === undefined || isNaN(price) || price < 0 || price > 10000000) {
        return { error: 'Enter a valid price.' }
    }
    if (!CATEGORIES.includes(category)) {
        return { error: 'Choose a category.' }
    }
    if (!CONDITIONS.includes(condition)) {
        return { error: 'Choose a condition.' }
    }
    if (!CITIES[city]) {
        return { error: 'Choose a city.' }
    }
    const [latitude, longitude] = CITIES[city];
    return {
        fields: {
            pname, pdesc, price: Math.round(price), category, condition, city,
            pLoc: { type: 'Point', coordinates: [longitude, latitude] }
        }
    }
}

module.exports.getProducts = handle(async (req, res) => {
    const { catName, seller } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 24, 1), 60);
    const status = ['available', 'sold', 'all'].includes(req.query.status) ? req.query.status : 'available';

    let _f = {}

    if (status !== 'all') {
        _f.status = status
    }
    if (catName) {
        _f.category = String(catName)
    }
    if (seller) {
        _f.addedBy = String(seller)
    } else {
        // listings from blocked accounts are hidden from browsing
        const blocked = await Users.find({ status: 'blocked' }).distinct('_id');
        if (blocked.length) {
            _f.addedBy = { $nin: blocked }
        }
    }

    if (req.query.search) {
        // escape regex characters so the text is matched literally
        const search = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        _f.$or = [
            { pname: { $regex: search, $options: 'i' } },
            { pdesc: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
        ]
    }

    const [latitude, longitude] = String(req.query.loc || '').split(',').map(parseFloat);
    if (!isNaN(latitude) && !isNaN(longitude)) {
        _f.pLoc = {
            $geoWithin: {
                // GeoJSON order is [longitude, latitude]
                $centerSphere: [[longitude, latitude], SEARCH_RADIUS_KM / EARTH_RADIUS_KM]
            }
        }
    }

    const sorts = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        price_asc: { price: 1, createdAt: -1 },
        price_desc: { price: -1, createdAt: -1 },
    }
    const sort = sorts[req.query.sort] || sorts.newest;

    const [products, total] = await Promise.all([
        Products.find(_f).sort(sort).skip((page - 1) * limit).limit(limit).populate('addedBy', SELLER_FIELDS),
        Products.countDocuments(_f)
    ]);

    res.send({ products, total, page, pages: Math.max(Math.ceil(total / limit), 1) })
})

module.exports.getProductsById = handle(async (req, res) => {
    const product = await Products.findById(req.params.pId).populate('addedBy', SELLER_FIELDS + ' status');
    if (!product || !product.addedBy || product.addedBy.status === 'blocked') {
        return res.status(404).send({ message: 'This listing does not exist or was removed.' })
    }
    const likes = await Users.countDocuments({ likedProducts: product._id });
    res.send({ product, likes })
})

module.exports.addProduct = handle(async (req, res) => {
    const files = req.files || {};
    const { error, fields } = readFields(req.body);

    if (error) {
        return res.status(400).send({ message: error })
    }
    if (!files.pimage) {
        return res.status(400).send({ message: 'Add at least one photo.' })
    }

    const [pimage, pimage2] = await Promise.all([
        saveImage(files.pimage[0]),
        files.pimage2 ? saveImage(files.pimage2[0]) : undefined
    ]);
    const product = await new Products({ ...fields, pimage, pimage2, addedBy: req.userId }).save();
    res.send({ message: 'Your listing is live.', productId: product._id })
})

// finds a listing the caller is allowed to change (its owner, or an admin)
const findOwned = async (req, res) => {
    const product = await Products.findById(req.params.pId);
    if (!product) {
        res.status(404).send({ message: 'This listing does not exist or was removed.' })
        return null;
    }
    if (String(product.addedBy) !== req.userId && req.role !== 'admin') {
        res.status(403).send({ message: 'You can only change your own listings.' })
        return null;
    }
    return product;
}

module.exports.editProduct = handle(async (req, res) => {
    const files = req.files || {};
    const product = await findOwned(req, res);
    if (!product) return;

    const { error, fields } = readFields(req.body);
    if (error) {
        return res.status(400).send({ message: error })
    }

    const stale = [];
    if (files.pimage) {
        stale.push(product.pimage);
        product.pimage = await saveImage(files.pimage[0]);
    }
    if (files.pimage2) {
        stale.push(product.pimage2);
        product.pimage2 = await saveImage(files.pimage2[0]);
    } else if (req.body.removeImage2 === 'true') {
        stale.push(product.pimage2);
        product.pimage2 = undefined;
    }

    Object.assign(product, fields);
    await product.save();
    await deleteImages(stale);
    res.send({ message: 'Listing updated.', productId: product._id })
})

module.exports.setStatus = handle(async (req, res) => {
    if (!['available', 'sold'].includes(req.body.status)) {
        return res.status(400).send({ message: 'Unknown status.' })
    }
    const product = await findOwned(req, res);
    if (!product) return;

    product.status = req.body.status;
    await product.save();
    res.send({ message: product.status === 'sold' ? 'Marked as sold.' : 'Marked as available.' })
})

module.exports.deleteProduct = handle(async (req, res) => {
    const product = await findOwned(req, res);
    if (!product) return;

    await Promise.all([
        product.deleteOne(),
        deleteImages([product.pimage, product.pimage2]),
        Users.updateMany({ likedProducts: product._id }, { $pull: { likedProducts: product._id } })
    ]);
    res.send({ message: 'Listing deleted.' })
})

module.exports.myProducts = handle(async (req, res) => {
    const products = await Products.find({ addedBy: req.userId }).sort({ createdAt: -1 });
    res.send({ products })
})

module.exports.adminProducts = handle(async (req, res) => {
    const products = await Products.find({}).sort({ createdAt: -1 }).limit(500)
        .populate('addedBy', SELLER_FIELDS + ' status');
    res.send({ products })
})

module.exports.getImage = handle(async (req, res) => {
    const image = await Images.findById(req.params.imageId);
    if (!image) {
        return res.status(404).send({ message: 'Image not found.' })
    }
    res.set('Content-Type', image.contentType)
    res.set('Cache-Control', 'public, max-age=31536000, immutable')
    // images are untrusted uploads: never let one run as a page
    res.set('X-Content-Type-Options', 'nosniff')
    res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'")
    res.send(image.data)
})
