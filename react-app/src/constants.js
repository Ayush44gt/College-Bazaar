const API_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:4000';

// Keep these lists in sync with node-app/constants.js.

export const CATEGORIES = [
    { name: 'Books', icon: '📚' },
    { name: 'Electronics', icon: '🎧' },
    { name: 'Laptops', icon: '💻' },
    { name: 'Mobiles', icon: '📱' },
    { name: 'Cycles', icon: '🚲' },
    { name: 'Furniture', icon: '🪑' },
    { name: 'Clothing', icon: '👕' },
    { name: 'Hostel', icon: '🛏️' },
    { name: 'Stationery', icon: '✏️' },
    { name: 'Sports', icon: '🏏' },
    { name: 'Others', icon: '📦' },
];

export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

// loc is "latitude,longitude"
export const CITIES = [
    { name: 'New Delhi', loc: '28.6139,77.2090' },
    { name: 'Mumbai', loc: '19.0760,72.8777' },
    { name: 'Bengaluru', loc: '12.9716,77.5946' },
    { name: 'Hyderabad', loc: '17.3850,78.4867' },
    { name: 'Pune', loc: '18.5204,73.8567' },
    { name: 'Chennai', loc: '13.0827,80.2707' },
    { name: 'Kolkata', loc: '22.5726,88.3639' },
    { name: 'Jaipur', loc: '26.9124,75.7873' },
];

export const SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
    { value: 'oldest', label: 'Oldest first' },
];

export default API_URL;
