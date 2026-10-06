var jwt = require('jsonwebtoken');
const Users = require('../models/User');

// Verifies the login token and sets req.userId / req.role for the controllers.
const auth = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).send({ message: 'Please log in to continue.' })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Your session has expired. Please log in again.' })
        }
        Users.findById(decoded.userId).select('role status')
            .then((user) => {
                if (!user || user.status === 'blocked') {
                    return res.status(401).send({ message: 'This account is not available.' })
                }
                req.userId = String(user._id);
                req.role = user.role;
                next();
            })
            .catch(() => {
                res.status(500).send({ message: 'Something went wrong. Please try again.' })
            })
    });
}

auth.admin = (req, res, next) => {
    auth(req, res, () => {
        if (req.role !== 'admin') {
            return res.status(403).send({ message: 'Only admins can do this.' })
        }
        next();
    })
}

module.exports = auth;
