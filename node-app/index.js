require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const productController = require('./controllers/productController');
const userController = require('./controllers/userController');
const auth = require('./middleware/auth');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        if (IMAGE_TYPES.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Photos must be JPG, PNG, WebP or GIF.'))
        }
    }
})
const photos = upload.fields([{ name: 'pimage', maxCount: 1 }, { name: 'pimage2', maxCount: 1 }]);

const app = express()

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const port = process.env.PORT || 4000

if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Copy .env.example to .env and fill it in.')
    process.exit(1)
}
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.')
    process.exit(1)
}
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection failed:', err.message))

app.get('/', (req, res) => {
    res.send({ message: 'College Bazaar API is running.' })
})

// accounts
app.post('/signup', userController.signup)
app.post('/login', userController.login)
app.get('/my-profile/:userId?', auth, userController.myProfile)
app.post('/update-profile', auth, userController.updateProfile)
app.post('/change-password', auth, userController.changePassword)
app.get('/get-user/:uId', userController.getUserById)
app.get('/seller-contact/:uId', auth, userController.sellerContact)

// listings
app.get('/get-products', productController.getProducts)
app.get('/search', productController.getProducts)
app.get('/get-product/:pId', productController.getProductsById)
app.get('/image/:imageId', productController.getImage)
app.post('/add-product', auth, photos, productController.addProduct)
app.post('/edit-product/:pId', auth, photos, productController.editProduct)
app.post('/product-status/:pId', auth, productController.setStatus)
app.post('/delete-product/:pId', auth, productController.deleteProduct)
app.post('/my-products', auth, productController.myProducts)

// saved listings
app.post('/like-product', auth, userController.likeProducts)
app.post('/unlike-product', auth, userController.unlikeProducts)
app.post('/liked-products', auth, userController.likedProducts)
app.get('/liked-ids', auth, userController.likedIds)

// admin
app.get('/admin/stats', auth.admin, userController.adminStats)
app.get('/admin/users', auth.admin, userController.adminUsers)
app.post('/admin/user-status/:uId', auth.admin, userController.adminUserStatus)
app.get('/admin/products', auth.admin, productController.adminProducts)

app.use((req, res) => {
    res.status(404).send({ message: 'Not found.' })
})

// upload errors (wrong file type, file too large) and bad JSON land here
app.use((err, req, res, next) => {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be under 5 MB.' : (err.message || 'Something went wrong.');
    res.status(400).send({ message })
})

app.listen(port, () => {
    console.log(`College Bazaar API listening on port ${port}`)
})
