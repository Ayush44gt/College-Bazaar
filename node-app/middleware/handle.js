// Wraps an async controller so every failure becomes a clean JSON response.
module.exports = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
        if (err.name === 'CastError') {
            return res.status(404).send({ message: 'Not found.' })
        }
        if (err.name === 'ValidationError') {
            return res.status(400).send({ message: 'Some details are missing or invalid.' })
        }
        console.error(err);
        res.status(500).send({ message: 'Something went wrong. Please try again.' })
    })
}
