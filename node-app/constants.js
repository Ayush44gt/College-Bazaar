// Shared lists used by validation and the seed script.
// Keep in sync with react-app/src/constants.js.

module.exports.CATEGORIES = [
    'Books', 'Electronics', 'Laptops', 'Mobiles', 'Cycles', 'Furniture',
    'Clothing', 'Hostel', 'Stationery', 'Sports', 'Others'
];

module.exports.CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

// coordinates are [latitude, longitude]
module.exports.CITIES = {
    'New Delhi': [28.6139, 77.2090],
    'Mumbai': [19.0760, 72.8777],
    'Bengaluru': [12.9716, 77.5946],
    'Hyderabad': [17.3850, 78.4867],
    'Pune': [18.5204, 73.8567],
    'Chennai': [13.0827, 80.2707],
    'Kolkata': [22.5726, 88.3639],
    'Jaipur': [26.9124, 75.7873],
};

// listings within this distance of the chosen city are shown
module.exports.SEARCH_RADIUS_KM = 60;
