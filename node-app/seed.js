// Fills the database with demo data:  npm run seed
// WARNING: this deletes every user, listing and image in the database first.

require('dotenv').config()
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Users = require('./models/User');
const Products = require('./models/Product');
const Images = require('./models/Image');
const { CITIES } = require('./constants');

// every demo account uses this password
const DEMO_PASSWORD = 'demo1234';

const DAY = 24 * 60 * 60 * 1000;

// small seeded random generator so every run produces the same data
let _seed = 20261006;
const rand = () => {
    _seed = (_seed * 1664525 + 1013904223) % 4294967296;
    return _seed / 4294967296;
}
const pick = (list) => list[Math.floor(rand() * list.length)];

// username, college, city, extra fields
const USERS = [
    ['admin', 'IIT Delhi', 'New Delhi', { role: 'admin' }],
    ['aarav_sharma', 'IIT Delhi', 'New Delhi', {}],
    ['priya_mehta', 'Delhi Technological University', 'New Delhi', {}],
    ['rohan_kulkarni', 'IIT Bombay', 'Mumbai', {}],
    ['sneha_reddy', 'IIIT Hyderabad', 'Hyderabad', {}],
    ['kabir_joshi', 'COEP Technological University', 'Pune', {}],
    ['ananya_gupta', 'RV College of Engineering', 'Bengaluru', {}],
    ['vikram_nair', 'IIT Madras', 'Chennai', {}],
    ['meera_pillai', 'Anna University', 'Chennai', {}],
    ['arjun_das', 'Jadavpur University', 'Kolkata', {}],
    ['isha_tiwari', 'MNIT Jaipur', 'Jaipur', {}],
    ['dev_bansal', 'PES University', 'Bengaluru', {}],
    ['tanvi_chopra', 'VJTI Mumbai', 'Mumbai', {}],
    // edge cases: a brand new account with nothing listed, and a blocked account
    ['newbie_01', 'BITS Pilani, Hyderabad Campus', 'Hyderabad', { noListings: true }],
    ['spam_seller', 'Unknown College', 'New Delhi', { status: 'blocked' }],
];

// emoji, title, description, price, category, condition
const ITEMS = [
    // Books
    ['📘', 'Engineering Mathematics - B.S. Grewal (44th ed.)', 'Used for first and second semester. A few pencil marks, no torn pages. Solved examples highlighted.', 350, 'Books', 'Good'],
    ['📗', 'Concepts of Physics Vol 1 & 2 - H.C. Verma', 'Both volumes together. Covers are slightly worn, inside is clean.', 450, 'Books', 'Good'],
    ['📕', 'Introduction to Algorithms (CLRS) 3rd Edition', 'Hardcover international edition. Barely opened after the DSA course ended.', 1200, 'Books', 'Like New'],
    ['📙', 'Operating System Concepts - Galvin', 'The dinosaur book. Some highlighting in chapters 3 to 8.', 500, 'Books', 'Good'],
    ['📚', 'GATE CSE previous year papers (2010-2025)', 'Topic-wise solved papers, bound set of two. Selling because I got placed.', 300, 'Books', 'Like New'],
    ['📓', 'Let Us C - Yashavant Kanetkar', 'Good for beginners. Old edition but content is the same.', 150, 'Books', 'Fair'],
    ['📔', 'Organic Chemistry - Morrison & Boyd', 'Seventh edition. Spine has tape on it, pages are all intact.', 400, 'Books', 'Fair'],
    ['📖', 'Data Structures using C - Reema Thareja', '', 280, 'Books', 'Good'],
    ['📒', 'Complete first year B.Tech notes (all subjects, handwritten, spiral bound, 600+ pages)', 'Maths 1 and 2, Physics, Chemistry, BEE, Mechanics and Programming. Neat handwriting, scored 9.2 with these. Diagrams are colour coded. Includes important questions marked from the last five years of end-semester papers.', 600, 'Books', 'Good'],
    ['📘', 'Signals and Systems - Oppenheim', 'Second edition, Indian print.', 380, 'Books', 'Good'],
    ['📗', 'Free: old JEE module set', 'Giving away a full set of coaching modules. Just come and collect from the hostel.', 0, 'Books', 'Fair'],

    // Electronics
    ['🎧', 'Sony WH-CH520 Wireless Headphones', 'Eight months old, with box and charging cable. Battery easily lasts a week.', 2800, 'Electronics', 'Like New'],
    ['🔊', 'JBL Go 3 Bluetooth Speaker', 'Loud for its size. Small scratch on the back.', 1500, 'Electronics', 'Good'],
    ['🧮', 'Casio fx-991ES Plus Scientific Calculator', 'Allowed in all exams. Works perfectly, cover included.', 600, 'Electronics', 'Good'],
    ['⌨️', 'Keychron K2 Mechanical Keyboard (Brown switches)', 'Bluetooth and wired. Selling because I moved to a smaller layout.', 5200, 'Electronics', 'Like New'],
    ['🖱️', 'Logitech M331 Silent Mouse', 'Silent clicks, good for library use.', 550, 'Electronics', 'Good'],
    ['🖥️', 'Dell 24 inch Full HD Monitor', 'IPS panel, HDMI cable included. No dead pixels.', 6500, 'Electronics', 'Good'],
    ['🔌', 'Arduino Uno starter kit with sensors', 'Board, breadboard, jumper wires, ultrasonic, IR and DHT11 sensors. Used for one project.', 900, 'Electronics', 'Like New'],
    ['💾', 'Seagate 1TB External Hard Drive', 'USB 3.0. Health check is clean.', 2400, 'Electronics', 'Good'],
    ['📷', 'Canon EOS 1500D with 18-55mm lens', 'Shutter count around 6,000. Comes with bag, 32GB card and charger.', 22000, 'Electronics', 'Good'],
    ['🎮', 'Wired Xbox 360 controller for PC', 'Left stick has slight drift.', 500, 'Electronics', 'Fair'],
    ['🔋', 'Mi 20000mAh Power Bank', 'Fast charging works. Holds about 80% of original capacity.', 800, 'Electronics', 'Good'],

    // Laptops
    ['💻', 'HP Pavilion 14 - i5 11th Gen, 16GB RAM, 512GB SSD', 'Two years old. Battery gives about 4 hours. Original charger and bag.', 34000, 'Laptops', 'Good'],
    ['💻', 'MacBook Air M1 (8GB / 256GB) Space Grey', 'Battery health 89%. No dents. Box and charger included.', 52000, 'Laptops', 'Like New'],
    ['💻', 'Lenovo IdeaPad Gaming 3 - Ryzen 5, GTX 1650', 'Great for games and ML coursework. Fan is a bit loud.', 41000, 'Laptops', 'Good'],
    ['💻', 'Dell Inspiron 15 (old, for basic use)', 'i3 7th gen, 4GB RAM, 1TB HDD. Slow but fine for documents and browsing. Hinge is loose.', 9500, 'Laptops', 'Fair'],
    ['💻', 'ASUS ROG Strix G15 - Ryzen 7, RTX 3060, 16GB', 'Top spec, one year warranty left. Selling because I am moving abroad.', 85000, 'Laptops', 'Like New'],
    ['🧊', 'Laptop cooling pad with 5 fans', 'Blue LEDs, adjustable height.', 650, 'Laptops', 'Good'],

    // Mobiles
    ['📱', 'OnePlus Nord CE 3 Lite (8GB/128GB)', 'One year old, always used with a case and screen guard.', 13500, 'Mobiles', 'Good'],
    ['📱', 'iPhone 12 64GB Blue', 'Battery health 82%. Small scratch near the camera. With original box.', 26000, 'Mobiles', 'Good'],
    ['📱', 'Redmi Note 12 5G (6GB/128GB)', 'Bill available. Back glass has a hairline crack.', 8500, 'Mobiles', 'Fair'],
    ['📱', 'Samsung Galaxy M34 5G - sealed', 'Won in a hackathon, unopened box.', 14500, 'Mobiles', 'New'],
    ['⌚', 'Noise ColorFit Pro 4 Smartwatch', 'Extra strap included.', 1400, 'Mobiles', 'Good'],
    ['🔌', '33W fast charger with Type-C cable', 'Original Xiaomi charger.', 450, 'Mobiles', 'Like New'],

    // Cycles
    ['🚲', 'Hero Sprint 26T Mountain Bike', 'Single speed, new brake pads. Perfect for getting around campus.', 3200, 'Cycles', 'Good'],
    ['🚲', 'Btwin Rockrider ST100 (21 gears)', 'Serviced last month. Comes with lock and bottle holder.', 9500, 'Cycles', 'Good'],
    ['🚴', 'Firefox Road Runner Pro', 'Disc brakes, front suspension. Graduating, need to sell fast.', 7800, 'Cycles', 'Like New'],
    ['🚲', 'Old Atlas cycle - works, needs new tyres', 'Rusty but runs. Cheapest way to reach class.', 900, 'Cycles', 'Fair'],
    ['🔒', 'Cycle lock and LED light set', 'Number lock and rechargeable front light.', 300, 'Cycles', 'Good'],

    // Furniture
    ['🪑', 'Ergonomic study chair with armrests', 'Mesh back, height adjustable. One wheel squeaks.', 2500, 'Furniture', 'Good'],
    ['🛋️', 'Foldable study table', 'Engineered wood, folds flat under the bed.', 1100, 'Furniture', 'Good'],
    ['📚', 'Five-shelf bookshelf', 'Metal frame. Needs to be picked up from my flat.', 1400, 'Furniture', 'Good'],
    ['🛏️', 'Single bed mattress 4 inch', 'Used for one year with a protector on.', 1800, 'Furniture', 'Good'],
    ['💺', 'Bean bag XXL with beans', 'Brown leatherette. Beans were refilled recently.', 1300, 'Furniture', 'Like New'],

    // Clothing
    ['🥼', 'Lab coat - size M', 'Worn for two semesters, washed and ironed.', 200, 'Clothing', 'Good'],
    ['🧥', 'College fest hoodie (limited edition) - L', 'Worn twice.', 550, 'Clothing', 'Like New'],
    ['👔', 'Formal blazer for placements - size 40', 'Navy blue. Worn only for interviews.', 1500, 'Clothing', 'Like New'],
    ['👟', 'Nike Revolution 6 running shoes - UK 9', 'Used for three months.', 1900, 'Clothing', 'Good'],
    ['🧣', 'Winter jacket - size M', 'Warm enough for a Delhi winter.', 900, 'Clothing', 'Good'],

    // Hostel
    ['🫖', 'Electric kettle 1.5L', 'Makes Maggi and chai in three minutes.', 450, 'Hostel', 'Good'],
    ['💡', 'Study lamp with USB charging', 'Three brightness levels.', 380, 'Hostel', 'Like New'],
    ['🌀', 'Table fan (high speed)', 'Loud but powerful. A summer essential.', 850, 'Hostel', 'Good'],
    ['🧺', 'Bucket, mug and laundry bag set', 'Leaving the hostel, take it all.', 150, 'Hostel', 'Fair'],
    ['🔥', 'Induction cooktop 1600W', 'Comes with one induction-base pan.', 1300, 'Hostel', 'Good'],
    ['🧊', 'Mini fridge 45L', 'Works well. Small dent on the side door.', 4200, 'Hostel', 'Good'],
    ['🔌', 'Extension board, 4 sockets, 3m cable', '', 250, 'Hostel', 'Good'],

    // Stationery
    ['📐', 'Engineering drawing kit (drafter, board, instruments)', 'Mini drafter, A2 board, compass set and scales. Everything for first-year ED.', 700, 'Stationery', 'Good'],
    ['🖊️', 'Unused A4 notebooks - pack of 6', 'Bought extra at the start of the semester.', 240, 'Stationery', 'New'],
    ['🎨', 'Staedtler colour pencil set (48 shades)', 'A few pencils have been sharpened.', 400, 'Stationery', 'Like New'],
    ['📎', 'Whiteboard 2x3 ft with markers', 'Good for planning and practice problems.', 500, 'Stationery', 'Good'],

    // Sports
    ['🏏', 'SG Kashmir willow cricket bat', 'Knocked in and ready. Grip replaced.', 1100, 'Sports', 'Good'],
    ['🏸', 'Yonex badminton racquets (pair) with shuttles', 'One string was replaced.', 1200, 'Sports', 'Good'],
    ['⚽', 'Nivia football size 5', 'Used on grass only.', 400, 'Sports', 'Good'],
    ['🏋️', 'Dumbbell set 2 x 5kg', 'Rubber coated.', 900, 'Sports', 'Like New'],
    ['🧘', 'Yoga mat 6mm with carry strap', '', 350, 'Sports', 'Like New'],
    ['🎾', 'Table tennis bats and balls set', 'Two bats, six balls.', 450, 'Sports', 'Good'],

    // Others
    ['🎸', 'Yamaha F280 acoustic guitar', 'With bag, capo and extra strings. Small ding on the body.', 5500, 'Others', 'Good'],
    ['🎒', 'Wildcraft 45L trekking backpack', 'Used on two treks. Rain cover included.', 1600, 'Others', 'Good'],
    ['🎟️', 'Board game - Catan', 'All pieces present.', 1500, 'Others', 'Like New'],
    ['☂️', 'Umbrella and raincoat combo', 'For the monsoon semester.', 300, 'Others', 'Good'],
];

const PALETTE = {
    Books: ['#4f46e5', '#7c3aed'],
    Electronics: ['#0ea5e9', '#2563eb'],
    Laptops: ['#334155', '#0f172a'],
    Mobiles: ['#db2777', '#9333ea'],
    Cycles: ['#16a34a', '#0d9488'],
    Furniture: ['#b45309', '#92400e'],
    Clothing: ['#e11d48', '#f97316'],
    Hostel: ['#f59e0b', '#ea580c'],
    Stationery: ['#0891b2', '#0e7490'],
    Sports: ['#65a30d', '#15803d'],
    Others: ['#6366f1', '#0ea5e9'],
};

const escapeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// draws a simple placeholder photo so no image files are needed
const makePhoto = (emoji, category, title, second) => {
    const [c1, c2] = PALETTE[category];
    const label = escapeXml(second ? 'Another angle' : (title.length > 34 ? title.slice(0, 33) + '…' : title));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
<defs><linearGradient id="g" gradientTransform="rotate(${second ? 120 : 35})"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="800" height="600" fill="url(#g)"/>
<circle cx="${second ? 140 : 660}" cy="110" r="190" fill="#fff" opacity=".12"/>
<circle cx="${second ? 680 : 120}" cy="530" r="150" fill="#fff" opacity=".1"/>
<text x="400" y="${second ? 300 : 280}" font-size="${second ? 170 : 220}" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
<text x="400" y="520" font-size="32" font-family="Inter,Arial,sans-serif" font-weight="600" fill="#fff" text-anchor="middle" opacity=".92">${label}</text>
</svg>`;
    return { data: Buffer.from(svg), contentType: 'image/svg+xml' };
}

async function seed() {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Refusing to seed a production database.');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to', mongoose.connection.name);

    await Promise.all([Users.deleteMany({}), Products.deleteMany({}), Images.deleteMany({})]);
    await Promise.all([Users.syncIndexes(), Products.syncIndexes()]);

    const password = await bcrypt.hash(DEMO_PASSWORD, 10);
    const users = await Users.insertMany(USERS.map(([username, college, city, extra], i) => ({
        username, college, password,
        email: username + '@example.com',
        mobile: '90000000' + String(10 + i),
        role: extra.role || 'user',
        status: extra.status || 'active',
        createdAt: new Date(Date.now() - (200 - i * 9) * DAY),
    })));

    const cityOf = {};
    USERS.forEach(([username, , city], i) => { cityOf[users[i]._id] = city });

    const sellers = users.filter((u, i) => u.role !== 'admin' && !USERS[i][3].noListings && u.status === 'active');
    const blocked = users.find((u) => u.status === 'blocked');

    const products = [];
    for (let i = 0; i < ITEMS.length; i++) {
        const [emoji, pname, pdesc, price, category, condition] = ITEMS[i];
        // the first seller gets extra listings so one account looks like a power seller
        const seller = i % 6 === 0 ? sellers[0] : pick(sellers);
        const city = cityOf[seller._id];
        const [latitude, longitude] = CITIES[city];

        const photos = [makePhoto(emoji, category, pname, false)];
        // roughly a third of listings have only one photo
        if (i % 3 !== 2) photos.push(makePhoto(emoji, category, pname, true));
        const saved = await Images.insertMany(photos);

        products.push({
            pname, pdesc, price, category, condition, city,
            status: i % 7 === 3 ? 'sold' : 'available',
            pimage: 'image/' + saved[0]._id,
            pimage2: saved[1] ? 'image/' + saved[1]._id : undefined,
            addedBy: seller._id,
            pLoc: { type: 'Point', coordinates: [longitude, latitude] },
            createdAt: new Date(Date.now() - Math.floor(rand() * 60 * DAY) - i * 60000),
        });
    }

    // two listings owned by the blocked account: they must not show up when browsing
    for (const [emoji, pname] of [['💸', 'Brand new iPhone 15 at 90% off!!!'], ['🎁', 'Free laptops - pay shipping only']]) {
        const saved = await Images.insertMany([makePhoto(emoji, 'Others', pname, false)]);
        const [latitude, longitude] = CITIES['New Delhi'];
        products.push({
            pname, pdesc: 'Limited offer, pay advance now.', price: 999, category: 'Others', condition: 'New',
            city: 'New Delhi', status: 'available', pimage: 'image/' + saved[0]._id, addedBy: blocked._id,
            pLoc: { type: 'Point', coordinates: [longitude, latitude] },
            createdAt: new Date(Date.now() - 2 * DAY),
        });
    }

    const inserted = await Products.insertMany(products);

    // everyone except the brand new account saves a handful of other people's listings
    const visible = inserted.filter((p) => String(p.addedBy) !== String(blocked._id));
    for (let i = 0; i < users.length; i++) {
        if (USERS[i][3].noListings || users[i].status === 'blocked') continue;
        const liked = new Set();
        const count = 3 + Math.floor(rand() * 6);
        while (liked.size < count) {
            const p = pick(visible);
            if (String(p.addedBy) !== String(users[i]._id)) liked.add(String(p._id));
        }
        await Users.updateOne({ _id: users[i]._id }, { likedProducts: [...liked] });
    }

    console.log(`Seeded ${users.length} users, ${inserted.length} listings and ${await Images.countDocuments()} images.`);
    console.log(`Log in as "admin" or any other username (for example "aarav_sharma") with the password "${DEMO_PASSWORD}".`);
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exit(1);
});
