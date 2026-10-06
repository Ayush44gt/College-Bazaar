import API_URL from './constants';

export const imageUrl = (path) => (path ? API_URL + '/' + path : '');

export const formatPrice = (price) => {
    const value = Number(price);
    if (!value) return 'Free';
    return '₹' + value.toLocaleString('en-IN');
};

export const timeAgo = (date) => {
    const seconds = Math.max(Math.floor((Date.now() - new Date(date).getTime()) / 1000), 0);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + ' min ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    const days = Math.floor(hours / 24);
    if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago');
    const months = Math.floor(days / 30);
    if (months < 12) return months + (months === 1 ? ' month ago' : ' months ago');
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

export const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// the message the API sent back, or a fallback when the server could not be reached
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
    if (err && err.response && err.response.data && err.response.data.message) {
        return err.response.data.message;
    }
    if (err && !err.response) {
        return 'Cannot reach the server. Check that the API is running.';
    }
    return fallback;
};
